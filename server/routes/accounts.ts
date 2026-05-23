import { Hono } from 'hono';
import { getAccount, shortId, ServerTransaction } from '../state.js';
import { usdToVnd, vndToUsd, getRates } from '../fx.js';
import { checkFraud } from '../ai/fraud.js';

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
  };
  if (!body.side || !body.symbol) return c.json({ error: 'side & symbol required' }, 400);

  const acc = getAccount(id);
  const symbol = body.symbol.toUpperCase();
  const price = await priceFor(symbol);
  if (!price) return c.json({ error: 'Failed to fetch market price' }, 502);

  const usdNotional =
    typeof body.amountUsd === 'number' ? body.amountUsd :
    typeof body.amountVnd === 'number' ? vndToUsd(body.amountVnd) :
    typeof body.amount === 'number' ? body.amount * price : 0;
  if (!usdNotional || usdNotional <= 0) return c.json({ error: 'Notional amount required' }, 400);

  const baseAmount = usdNotional / price;
  const fee = usdNotional * 0.001; // 10 bps demo fee
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

  if (body.side === 'BUY') {
    if (acc.cashUsd < usdNotional + fee) return c.json({ error: 'Insufficient cash' }, 400);
    acc.cashUsd -= (usdNotional + fee);
    const pos = acc.positions.find((p) => p.symbol === symbol);
    if (pos) pos.amount += baseAmount; else acc.positions.push({ symbol, amount: baseAmount });
  } else {
    const pos = acc.positions.find((p) => p.symbol === symbol);
    if (!pos || pos.amount < baseAmount) return c.json({ error: 'Insufficient position' }, 400);
    pos.amount -= baseAmount;
    if (pos.amount < 1e-9) acc.positions = acc.positions.filter((p) => p.symbol !== symbol);
    acc.cashUsd += (usdNotional - fee);
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
