/**
 * Agentic tool dispatcher used by the Gemini chatbot.
 *
 * The chatbot declares its tools to Gemini using function-calling. When Gemini
 * decides to call a tool, the frontend forwards the call here. Each tool maps
 * to an existing endpoint or in-memory service and returns a JSON result that
 * the model can quote back to the user (and that we render in the chat UI).
 */
import { Hono } from 'hono';
import { getAccount } from '../state';
import { usdToVnd, vndToUsd, convert, getRates } from '../fx';
import { getSentiment, getWhaleFlow, getFearGreed } from '../ai/altdata';
import { computeCreditScore } from '../ai/credit';
import { buildAdvisor, RiskProfile } from '../ai/advisor';
import { checkFraud } from '../ai/fraud';

export const agentRouter = new Hono();

// Source of truth lives in Firebase on the client. Backend in-memory state
// resets on every Vercel cold start, so we sync from a client-supplied
// snapshot before dispatching any tool. Without this, getBalance / placeTrade
// see a fresh $1M cash + 0 positions account that contradicts what the user
// actually owns.
function syncAccountFromSnapshot(
  accountId: string,
  snapshot: { cashUsd?: number; positions?: { symbol: string; amount: number }[] } | undefined,
) {
  if (!snapshot) return;
  const acc = getAccount(accountId);
  if (Number.isFinite(snapshot.cashUsd)) {
    acc.cashUsd = Number(snapshot.cashUsd);
  }
  if (Array.isArray(snapshot.positions)) {
    acc.positions = snapshot.positions
      .filter((p) => p && typeof p.symbol === 'string' && Number.isFinite(p.amount) && p.amount > 0)
      .map((p) => ({ symbol: String(p.symbol).toUpperCase(), amount: Number(p.amount) }));
  }
}

const BINANCE = 'https://api.binance.com/api/v3';
async function priceFor(symbol: string): Promise<number> {
  try {
    const r = await fetch(`${BINANCE}/ticker/price?symbol=${symbol}`);
    const j = (await r.json()) as { price?: string };
    return j.price ? Number(j.price) : 0;
  } catch { return 0; }
}

interface ExecBody {
  accountId?: string;
  tool?: string;
  args?: Record<string, any>;
  accountSnapshot?: {
    cashUsd?: number;
    positions?: { symbol: string; amount: number }[];
  };
}

agentRouter.post('/execute', async (c) => {
  const body = await c.req.json().catch(() => ({})) as ExecBody;
  const tool = body.tool || '';
  const args = body.args || {};
  const accountId = body.accountId || args.accountId;
  if (accountId) syncAccountFromSnapshot(accountId, body.accountSnapshot);

  try {
    switch (tool) {
      case 'getBalance': {
        if (!accountId) throw new Error('accountId required');
        const acc = getAccount(accountId);
        let assetsUsd = 0;
        const positions: any[] = [];
        for (const p of acc.positions) {
          const px = await priceFor(p.symbol);
          assetsUsd += p.amount * px;
          positions.push({ symbol: p.symbol, amount: p.amount, valueUsd: p.amount * px });
        }
        const netUsd = assetsUsd + acc.cashUsd;
        return c.json({
          cashUsd: acc.cashUsd,
          cashVnd: usdToVnd(acc.cashUsd),
          assetsUsd,
          netUsd,
          netVnd: usdToVnd(netUsd),
          positions,
        });
      }
      case 'getCreditScore': {
        if (!accountId) throw new Error('accountId required');
        return c.json(computeCreditScore(accountId));
      }
      case 'getSentiment': {
        if (!args.symbol) throw new Error('symbol required');
        return c.json(getSentiment(String(args.symbol).toUpperCase()));
      }
      case 'getInsight': {
        if (!args.symbol) throw new Error('symbol required');
        const sym = String(args.symbol).toUpperCase();
        return c.json({
          sentiment: getSentiment(sym),
          whale: getWhaleFlow(sym),
          fearGreed: getFearGreed(),
        });
      }
      case 'getFearGreed':
        return c.json(getFearGreed());
      case 'getAdvisor': {
        if (!accountId) throw new Error('accountId required');
        const profile: RiskProfile = (args.riskProfile || 'BALANCED') as RiskProfile;
        return c.json(buildAdvisor(accountId, profile));
      }
      case 'convertCurrency': {
        const amount = Number(args.amount);
        if (!amount) throw new Error('amount required');
        const r = convert(amount, String(args.from || 'USD'), String(args.to || 'VND'));
        return c.json({ amount, from: args.from, to: args.to, ...r });
      }
      case 'placeTrade': {
        if (!accountId) throw new Error('accountId required');
        const side = (args.side || 'BUY').toUpperCase();
        const symbol = String(args.symbol || 'BTCUSDT').toUpperCase();
        const amountUsd = Number(args.amountUsd ?? (args.amountVnd ? vndToUsd(Number(args.amountVnd)) : 0));
        if (!amountUsd || !Number.isFinite(amountUsd) || amountUsd <= 0) {
          throw new Error('amountUsd or amountVnd required');
        }
        // Binance is geo-blocked from some Vercel function regions — fall back
        // to the priceHint the client injects from its live marketData prop.
        let price = await priceFor(symbol);
        const hint = Number(args.priceHint);
        if ((!price || !Number.isFinite(price) || price <= 0) && Number.isFinite(hint) && hint > 0) {
          price = hint;
        }
        if (!price || !Number.isFinite(price) || price <= 0) {
          throw new Error(`Could not fetch live price for ${symbol}. Try again in a moment.`);
        }
        const baseAmount = amountUsd / price;
        const amountVnd = usdToVnd(amountUsd);
        const txCandidate = {
          type: side as 'BUY' | 'SELL', asset: symbol,
          amount: baseAmount, price,
          total: side === 'BUY' ? -amountUsd : amountUsd, timestamp: Date.now(),
        };
        const fraud = checkFraud(accountId, txCandidate);
        return c.json({
          quoted: true,
          requiresUserConfirm: true,
          side, symbol,
          amountUsd, amountVnd,
          priceUsd: price, baseAmount,
          fraudCheck: fraud,
          message:
            `Quote: ${side} ${baseAmount.toFixed(6)} ${symbol.replace('USDT', '')} ` +
            `≈ $${amountUsd.toFixed(2)} / ${amountVnd.toLocaleString('vi-VN')} ₫. ` +
            `Risk: ${fraud.verdict}.`,
        });
      }
      case 'depositVnd': {
        if (!accountId) throw new Error('accountId required');
        const amountVnd = Number(args.amountVnd);
        if (!amountVnd) throw new Error('amountVnd required');
        const usd = vndToUsd(amountVnd);
        return c.json({
          quoted: true,
          requiresUserConfirm: true,
          amountVnd, amountUsd: usd,
          rate: getRates().rates.VND,
          channel: args.channel || 'VNPAY',
          message: `Deposit quote: ${amountVnd.toLocaleString('vi-VN')} ₫ ≈ $${usd.toFixed(2)}.`,
        });
      }
      default:
        return c.json({ error: `Unknown tool '${tool}'` }, 400);
    }
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});
