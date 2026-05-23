import { Hono } from 'hono';
import { computeCreditScore } from '../ai/credit.js';
import { checkFraud } from '../ai/fraud.js';
import { buildAdvisor, RiskProfile } from '../ai/advisor.js';
import { getSentiment, getWhaleFlow, getFearGreed, signalFromSentiment } from '../ai/altdata.js';

export const aiRouter = new Hono();

aiRouter.post('/credit-score', async (c) => {
  const body = await c.req.json().catch(() => ({})) as { accountId?: string };
  if (!body.accountId) return c.json({ error: 'accountId required' }, 400);
  return c.json(computeCreditScore(body.accountId));
});

aiRouter.post('/fraud-check', async (c) => {
  const body = await c.req.json().catch(() => null) as { accountId?: string; transaction?: any } | null;
  if (!body?.accountId || !body.transaction) return c.json({ error: 'accountId & transaction required' }, 400);
  return c.json(checkFraud(body.accountId, body.transaction));
});

aiRouter.post('/advisor', async (c) => {
  const body = await c.req.json().catch(() => ({})) as { accountId?: string; riskProfile?: RiskProfile };
  if (!body.accountId) return c.json({ error: 'accountId required' }, 400);
  return c.json(buildAdvisor(body.accountId, body.riskProfile || 'BALANCED'));
});

aiRouter.post('/insight', async (c) => {
  const body = await c.req.json().catch(() => ({})) as { symbol?: string };
  if (!body.symbol) return c.json({ error: 'symbol required' }, 400);
  const sym = body.symbol.toUpperCase();
  const sentiment = getSentiment(sym);
  const whale = getWhaleFlow(sym);
  const fg = getFearGreed();
  const blendedSignal = signalFromSentiment(sentiment.score, whale.netFlow24hUsd > 0 ? 5 : -5);
  const confidence = Math.min(
    0.98,
    0.45 + Math.abs(sentiment.score) * 0.35 + (Math.abs(whale.netFlow24hUsd) > 1_000_000 ? 0.15 : 0),
  );
  const signal =
    blendedSignal === 'BUY' && sentiment.score > 0.5 ? 'STRONG_BUY' :
    blendedSignal === 'SELL' && sentiment.score < -0.5 ? 'STRONG_SELL' :
    blendedSignal;
  const narrative =
    `${sym.replace('USDT', '')} — Composite AI signal: ${signal} (confidence ${(confidence * 100).toFixed(0)}%). ` +
    `Sentiment is ${sentiment.label.toLowerCase()} (${(sentiment.score * 100).toFixed(0)}/100) across ` +
    `${sentiment.mentions24h.toLocaleString()} 24h mentions. ` +
    `On-chain whales net ${whale.netFlow24hUsd >= 0 ? '+' : '-'}$${Math.abs(whale.netFlow24hUsd).toLocaleString()} — ` +
    `${whale.verdict.toLowerCase()}. Market mood: ${fg.classification} (${fg.value}/100).`;

  return c.json({
    symbol: sym,
    signal,
    confidence: Number(confidence.toFixed(3)),
    sentiment,
    whale,
    fearGreed: fg,
    narrative,
  });
});
