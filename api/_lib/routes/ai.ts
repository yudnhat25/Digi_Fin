import { Hono } from 'hono';
import { computeCreditScore, computeCreditScoreWithRealAltData } from '../ai/credit';
import { checkFraud, checkFraudWithRealAltData } from '../ai/fraud';
import { buildAdvisor, RiskProfile } from '../ai/advisor';
import { getSentiment, getWhaleFlow, getFearGreed, signalFromSentiment } from '../ai/altdata';
import { runAltDataPipeline } from '../ai/pipeline';
import { classify as classifyNb, getModelInfo } from '../ai/nlp/classifier';
import { pingReddit } from '../ai/sources/reddit';
import { pingHackerNews } from '../ai/sources/hackerNews';
import { pingFearGreed } from '../ai/sources/fearGreed';
import { pingCoinGecko } from '../ai/sources/coingecko';

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

// ─── REAL alt-data pipeline endpoints ───

aiRouter.get('/alt-data/pipeline/:symbol', async (c) => {
  const sym = c.req.param('symbol').toUpperCase();
  try {
    const result = await runAltDataPipeline(sym);
    return c.json(result);
  } catch (e) {
    return c.json({ error: 'pipeline_failed', message: (e as Error).message }, 500);
  }
});

aiRouter.get('/alt-data/model/info', (c) => c.json(getModelInfo()));

aiRouter.post('/alt-data/classify', async (c) => {
  const body = await c.req.json().catch(() => ({})) as { text?: string };
  if (!body.text) return c.json({ error: 'text required' }, 400);
  return c.json(classifyNb(body.text));
});

aiRouter.get('/alt-data/sources/health', async (c) => {
  const [reddit, news, fg, cg] = await Promise.all([
    pingReddit(), pingHackerNews(), pingFearGreed(), pingCoinGecko(),
  ]);
  return c.json({
    reddit, news, fearGreed: fg, coinGecko: cg,
    overall: news.ok || fg.ok || cg.ok ? 'live' : 'down',
    timestamp: new Date().toISOString(),
  });
});

aiRouter.post('/credit-score-real', async (c) => {
  const body = await c.req.json().catch(() => ({})) as { accountId?: string; proxySymbol?: string };
  if (!body.accountId) return c.json({ error: 'accountId required' }, 400);
  const result = await computeCreditScoreWithRealAltData(body.accountId, body.proxySymbol || 'BTCUSDT');
  return c.json(result);
});

aiRouter.post('/fraud-check-real', async (c) => {
  const body = await c.req.json().catch(() => null) as { accountId?: string; transaction?: any } | null;
  if (!body?.accountId || !body.transaction) return c.json({ error: 'accountId & transaction required' }, 400);
  const result = await checkFraudWithRealAltData(body.accountId, body.transaction);
  return c.json(result);
});
