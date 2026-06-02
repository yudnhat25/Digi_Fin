import { Hono } from 'hono';
import { computeCreditScore, computeCreditScoreWithRealAltData } from '../ai/credit';
import { checkFraud, checkFraudWithRealAltData } from '../ai/fraud';
import { buildAdvisor, RiskProfile } from '../ai/advisor';
import { getSentiment, getWhaleFlow, getFearGreed, signalFromSentiment } from '../ai/altdata';
import { runAltDataPipeline } from '../ai/pipeline';
import { classify as classifyNb, getModelInfo } from '../ai/nlp/classifier';
import { analyzeText } from '../ai/nlp/vader';
import { pingReddit } from '../ai/sources/reddit';
import { pingHackerNews } from '../ai/sources/hackerNews';
import { pingFearGreed, fetchFearGreedReal } from '../ai/sources/fearGreed';
import { pingCoinGecko } from '../ai/sources/coingecko';
import { fetchBtcSnapshot, fetchBtcHistory } from '../ai/sources/btcMarket';

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
  return c.json(await buildAdvisor(body.accountId, body.riskProfile || 'BALANCED'));
});

// Map pipeline's 5-label space to the legacy SentimentSnapshot enum the UI
// expects (Bearish | Neutral | Bullish | Euphoric).
function mapPipelineLabel(l: string): 'Bearish' | 'Neutral' | 'Bullish' | 'Euphoric' {
  if (l === 'Euphoric') return 'Euphoric';
  if (l === 'Bullish') return 'Bullish';
  if (l === 'Bearish' || l === 'Capitulation') return 'Bearish';
  return 'Neutral';
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), ms);
    p.then((v) => { clearTimeout(t); resolve(v); })
     .catch(() => { clearTimeout(t); resolve(null); });
  });
}

const INSIGHT_PIPELINE_TIMEOUT_MS = 9_000;

aiRouter.post('/insight', async (c) => {
  const body = await c.req.json().catch(() => ({})) as { symbol?: string };
  if (!body.symbol) return c.json({ error: 'symbol required' }, 400);
  const sym = body.symbol.toUpperCase();
  const base = sym.replace(/USDT?$/, '');

  // Real sentiment via the alt-data pipeline: Reddit (or HN fallback) corpus →
  // VADER lexicon + trained Naive Bayes → blended with CoinGecko vote % and
  // alternative.me Fear & Greed. Bounded at 9s so the card never hangs the UI.
  const real = await withTimeout(runAltDataPipeline(base), INSIGHT_PIPELINE_TIMEOUT_MS);

  // Whale flow has no free real source in this codebase — keep synthetic but
  // label it so the UI can stamp DEMO badge on it.
  const whale = getWhaleFlow(sym);
  const fg = await getFearGreed();

  let sentiment;
  let signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' | 'NEUTRAL';
  let confidence: number;
  let sources: {
    sentimentScore: 'real' | 'synthetic';
    sentimentMentions: 'real' | 'synthetic';
    whale: 'synthetic';
    fearGreed: 'hybrid';
    signal: 'real' | 'synthetic';
    confidence: 'real' | 'synthetic';
  };
  let degraded: boolean;

  if (real) {
    const score = real.fusion.compositeScore;
    const mentions = real.collected.totalDocs;
    sentiment = {
      symbol: sym,
      score,
      label: mapPipelineLabel(real.fusion.label),
      mentions24h: mentions,
      sources: { twitter: 0, reddit: 0, news: 0 },
      topThemes: [],
      aiSummary: `${base} — ${real.fusion.label} (${(score * 100).toFixed(0)}/100) from ${mentions} 24h docs.`,
      updatedAt: new Date().toISOString(),
    };
    signal = (real.fusion.signal as typeof signal) || 'HOLD';
    confidence = Number(real.fusion.confidence.toFixed(3));
    sources = {
      sentimentScore: 'real',
      sentimentMentions: mentions > 0 ? 'real' : 'synthetic',
      whale: 'synthetic',
      fearGreed: 'hybrid',
      signal: 'real',
      confidence: 'real',
    };
    degraded = real.stages.some((s) => s.status === 'failed');
  } else {
    // Pipeline timed out or threw — degrade to the legacy synthetic path with
    // a clearly-capped confidence so the UI doesn't oversell stale data.
    const synth = getSentiment(sym);
    sentiment = synth;
    const blended = signalFromSentiment(synth.score, whale.netFlow24hUsd > 0 ? 5 : -5);
    signal =
      blended === 'BUY' && synth.score > 0.5 ? 'STRONG_BUY' :
      blended === 'SELL' && synth.score < -0.5 ? 'STRONG_SELL' :
      blended;
    confidence = Number(Math.min(0.6, 0.4 + Math.abs(synth.score) * 0.2).toFixed(3));
    sources = {
      sentimentScore: 'synthetic',
      sentimentMentions: 'synthetic',
      whale: 'synthetic',
      fearGreed: 'hybrid',
      signal: 'synthetic',
      confidence: 'synthetic',
    };
    degraded = true;
  }

  const narrative =
    `${base} — Composite AI signal: ${signal} (confidence ${(confidence * 100).toFixed(0)}%). ` +
    `Sentiment is ${sentiment.label.toLowerCase()} (${(sentiment.score * 100).toFixed(0)}/100) across ` +
    `${sentiment.mentions24h.toLocaleString()} 24h mentions` +
    `${sources.sentimentMentions === 'real' ? ' (Reddit + HN)' : ''}. ` +
    `Market mood: ${fg.classification} (${fg.value}/100).`;

  return c.json({
    symbol: sym,
    signal,
    confidence,
    sentiment,
    whale,
    fearGreed: fg,
    narrative,
    sources,
    pipeline: real
      ? {
          totalLatencyMs: real.totalLatencyMs,
          stages: real.stages.map((s: any) => ({ name: s.name ?? '', status: s.status, message: s.message })),
          degraded,
        }
      : { totalLatencyMs: INSIGHT_PIPELINE_TIMEOUT_MS, stages: [], degraded: true },
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

  const nb = classifyNb(body.text);
  const vader = analyzeText(body.text);
  const nbHasSignal = nb.matchedFeatures.length > 0;
  const vaderHasSignal = vader.matchedTerms.length > 0;

  // The NB model is trained on crypto-finance text only. For comments built
  // from out-of-vocabulary words (casual speech, profanity) — or where NB has
  // only a weak read — it collapses toward its class prior, which skews
  // "positive". Trust NB only when it has a confident in-vocab read; otherwise
  // defer to the VADER lexicon (covers everyday + profanity terms). If neither
  // has a clear signal, return Neutral — never a guessed Positive.
  const nbConfident = nbHasSignal && nb.confidence >= 0.6;
  if (!nbConfident && vaderHasSignal) {
    const cmp = vader.compound;
    const label = cmp >= 0.05 ? 'positive' : cmp <= -0.05 ? 'negative' : 'neutral';
    return c.json({
      ...nb,
      label,
      compound: Number(cmp.toFixed(4)),
      confidence: Number(Math.min(0.95, 0.55 + Math.abs(cmp) * 0.45).toFixed(4)),
      source: nbHasSignal ? 'vader-override' : 'vader-fallback',
      vader: { compound: cmp, matchedTerms: vader.matchedTerms },
    });
  }
  if (!nbHasSignal && !vaderHasSignal) {
    return c.json({ ...nb, label: 'neutral', compound: 0, confidence: 0.34, source: 'no-signal' });
  }
  return c.json({ ...nb, source: 'naive-bayes' });
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

// ─── Fear & Greed dedicated page (Binance-style) ───
// Bundles 365-day F&G history (alternative.me) + BTC snapshot/history (CoinGecko)
// + period summaries so the frontend only makes one round-trip.

aiRouter.get('/fear-greed/full', async (c) => {
  const [fg, snap, hist] = await Promise.all([
    fetchFearGreedReal(365),
    fetchBtcSnapshot(),
    fetchBtcHistory(365),
  ]);

  if (!fg.ok) return c.json({ ok: false, error: fg.error, fetchedAt: fg.fetchedAt }, 502);

  const points = fg.history;
  const last = points[points.length - 1];
  const yesterday = points[points.length - 2];
  const lastWeek  = points[points.length - 8];
  const lastMonth = points[points.length - 31];
  const lastYear  = points[0];

  let yearHigh = last;
  let yearLow = last;
  for (const p of points) {
    if (p.value > yearHigh.value) yearHigh = p;
    if (p.value < yearLow.value) yearLow = p;
  }

  return c.json({
    ok: true,
    fetchedAt: new Date().toISOString(),
    fearGreed: {
      source: fg.source,
      current: fg.current,
      delta24h: fg.delta24h,
      delta7d: fg.delta7d,
      history: fg.history,
      periods: {
        yesterday: yesterday || null,
        lastWeek: lastWeek || null,
        lastMonth: lastMonth || null,
        lastYear: lastYear || null,
      },
      yearHigh,
      yearLow,
    },
    btc: snap.ok ? snap : null,
    btcHistory: hist.ok ? hist : null,
    sources: {
      fearGreed: 'real',
      btcSnapshot: snap.ok ? 'real' : 'unavailable',
      btcHistory: hist.ok ? 'real' : 'unavailable',
    },
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
