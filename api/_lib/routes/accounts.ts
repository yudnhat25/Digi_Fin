import { Hono } from 'hono';
import { getAccount, shortId, ServerTransaction } from '../state';
import { usdToVnd, vndToUsd, getRates } from '../fx';
import { checkFraud } from '../ai/fraud';

export const accountsRouter = new Hono();

const BINANCE = 'https://api.binance.com/api/v3';

async function priceFor(symbol: string): Promise<number> {
  try {
    const r = await fetch(`${BINANCE}/ticker/price?symbol=${symbol}`);
    const j = (await r.json()) as { price?: string };
    return j.price ? Number(j.price) : 0;
  } catch {
    return 0;
  }
}

accountsRouter.get('/:accountId/balance', async (c) => {
  const acc = getAccount(c.req.param('accountId'));
  const positions = await Promise.all(
    acc.positions.map(async (p) => {
      const px = await priceFor(p.symbol);
      const valueUsd = p.amount * px;
      return { symbol: p.symbol, amount: p.amount, valueUsd, valueVnd: usdToVnd(valueUsd) };
    }),
  );
  const assetsUsd = positions.reduce((s, p) => s + p.valueUsd, 0);
  const netUsd = assetsUsd + acc.cashUsd;
  return c.json({
    accountId: acc.accountId,
    cashUsd: acc.cashUsd,
    cashVnd: usdToVnd(acc.cashUsd),
    assetsUsd,
    assetsVnd: usdToVnd(assetsUsd),
    netWorthUsd: netUsd,
    netWorthVnd: usdToVnd(netUsd),
    positions,
    asOf: new Date().toISOString(),
  });
});

accountsRouter.get('/:accountId/transactions', (c) => {
  const acc = getAccount(c.req.param('accountId'));
  return c.json(acc.transactions.slice(-100).reverse());
});

accountsRouter.post('/:accountId/deposit-vnd', async (c) => {
  const id = c.req.param('accountId');
  const body = await c.req.json().catch(() => ({})) as { amountVnd?: number; channel?: string };
  if (!body.amountVnd || body.amountVnd <= 0) return c.json({ error: 'amountVnd required' }, 400);
  const acc = getAccount(id);
  const usd = vndToUsd(body.amountVnd);
  const rate = getRates().rates.VND;
  acc.cashUsd += usd;
  const txn: ServerTransaction = {
    id: shortId('dep'),
    type: 'DEPOSIT',
    asset: 'VND',
    amount: body.amountVnd,
    price: 1 / rate,
    total: usd,
    timestamp: Date.now(),
    currency: 'VND',
    fxRate: rate,
    channel: body.channel || 'BANK_TRANSFER',
  };
  acc.transactions.push(txn);
  return c.json({
    accountId: id,
    amountVnd: body.amountVnd,
    amountUsd: usd,
    rate,
    channel: txn.channel,
    ref: txn.id,
    newBalanceUsd: acc.cashUsd,
  });
});

accountsRouter.post('/:accountId/trade', async (c) => {
  const id = c.req.param('accountId');
  const body = await c.req.json().catch(() => ({})) as {
    side?: 'BUY' | 'SELL';
    symbol?: string;
    amount?: number;
    amountUsd?: number;
    amountVnd?: number;
    priceHint?: number;
    // Optional client-side state hints. The real source of truth is Firebase
    // on the frontend; the backend's in-memory `acc.*` resets on every Vercel
    // cold start so we accept these snapshots for validation instead.
    currentCashUsd?: number;
    currentPositionAmount?: number;
  };
  if (!body.side || !body.symbol) return c.json({ error: 'side & symbol required' }, 400);

  const acc = getAccount(id);
  const symbol = body.symbol.toUpperCase();
  // Binance is geo-blocked from some Vercel function regions — fall back to the
  // client-provided priceHint (frontend already has a live price via marketData).
  let price = await priceFor(symbol);
  if (!price && body.priceHint && Number.isFinite(body.priceHint) && body.priceHint > 0) {
    price = body.priceHint;
  }
  if (!price) return c.json({ error: 'Failed to fetch market price' }, 502);

  let usdNotional =
    typeof body.amountUsd === 'number' ? body.amountUsd :
    typeof body.amountVnd === 'number' ? vndToUsd(body.amountVnd) :
    typeof body.amount === 'number' ? body.amount * price : 0;
  if (!usdNotional || usdNotional <= 0) return c.json({ error: 'Notional amount required' }, 400);

  const FEE_RATE = 0.001; // 10 bps demo fee
  // Safety clamp for BUY: if notional alone fits cash but notional+fee does
  // not (Gemini quoted ≈cash without using the buyAllCash semantics),
  // shrink notional to the fee-safe maximum. Truly over-budget orders
  // (notional > cash) still hit the rejection below.
  if (body.side === 'BUY') {
    const cashForClamp = Number.isFinite(body.currentCashUsd) ? Number(body.currentCashUsd) : 0;
    if (cashForClamp > 0) {
      const maxBuyNotional = cashForClamp / (1 + FEE_RATE);
      if (usdNotional <= cashForClamp && usdNotional > maxBuyNotional) {
        usdNotional = maxBuyNotional;
      }
    }
  }

  const baseAmount = usdNotional / price;
  const fee = usdNotional * FEE_RATE;
  const txCandidate = {
    type: body.side,
    asset: symbol,
    amount: baseAmount,
    price,
    total: body.side === 'BUY' ? -usdNotional : usdNotional,
    timestamp: Date.now(),
  };
  const fraud = checkFraud(id, txCandidate);
  if (fraud.verdict === 'BLOCK') {
    return c.json({ ok: false, blocked: true, fraudCheck: fraud }, 200);
  }

  // Validate against client-side state hints when present (frontend Firebase
  // state is authoritative — backend in-memory state resets on cold start so
  // it's NOT reliable for enforcement). Fall back to backend state otherwise.
  if (body.side === 'BUY') {
    const cashAvailable = Number.isFinite(body.currentCashUsd)
      ? Number(body.currentCashUsd)
      : acc.cashUsd;
    if (cashAvailable < usdNotional + fee) {
      return c.json({ error: 'Insufficient cash' }, 400);
    }
    acc.cashUsd = Math.max(0, cashAvailable - (usdNotional + fee));
    const pos = acc.positions.find((p) => p.symbol === symbol);
    if (pos) pos.amount += baseAmount; else acc.positions.push({ symbol, amount: baseAmount });
  } else {
    const positionAvailable = Number.isFinite(body.currentPositionAmount)
      ? Number(body.currentPositionAmount)
      : (acc.positions.find((p) => p.symbol === symbol)?.amount ?? 0);
    if (positionAvailable < baseAmount) {
      return c.json({ error: 'Insufficient position' }, 400);
    }
    const pos = acc.positions.find((p) => p.symbol === symbol);
    if (pos) {
      pos.amount = Math.max(0, positionAvailable - baseAmount);
      if (pos.amount < 1e-9) acc.positions = acc.positions.filter((p) => p.symbol !== symbol);
    }
    const cashBase = Number.isFinite(body.currentCashUsd) ? Number(body.currentCashUsd) : acc.cashUsd;
    acc.cashUsd = cashBase + (usdNotional - fee);
  }
  const txn: ServerTransaction = {
    id: shortId(body.side.toLowerCase()),
    type: body.side,
    asset: symbol,
    amount: baseAmount,
    price,
    total: body.side === 'BUY' ? -usdNotional : usdNotional,
    timestamp: Date.now(),
    currency: 'USD',
  };
  acc.transactions.push(txn);
  return c.json({
    ok: true,
    txId: txn.id,
    side: body.side,
    symbol,
    executedAmount: baseAmount,
    executedPriceUsd: price,
    feeUsd: fee,
    newBalanceUsd: acc.cashUsd,
    fraudCheck: fraud,
  });
});
