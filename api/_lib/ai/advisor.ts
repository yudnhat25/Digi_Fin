/**
 * AI Portfolio Advisor — builds a target allocation tailored to the user's risk
 * profile, tilted by REAL alternative-data signals, plus a narrative rationale.
 *
 * Real data sources (no synthetic seeding):
 *   • Social sentiment      — CoinGecko community vote % (sentiment_votes up/down)
 *   • Price momentum        — Binance 24h ticker priceChangePercent
 *   • Market mood           — Alternative.me Fear & Greed Index
 *   • Position valuation     — live Binance last price (not a fixed proxy)
 *
 * Each signal degrades gracefully: if a source is unreachable, that coin's term
 * collapses to neutral (0 tilt) instead of a guessed value, and the result is
 * flagged `degraded` so the UI can stamp the provenance honestly.
 */
import { getAccount } from '../state';
import { getFearGreed, loadCoinGecko } from './altdata';
import { getRealSentimentScore } from './pipeline';

export type RiskProfile = 'CONSERVATIVE' | 'BALANCED' | 'GROWTH' | 'AGGRESSIVE';

// Bounds a promise so one slow alt-data pipeline run can't hang the advisor.
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }).catch(() => { clearTimeout(t); resolve(null); });
  });
}

const UNIVERSE: { symbol: string; defaultWeight: Record<RiskProfile, number> }[] = [
  { symbol: 'BTCUSDT',  defaultWeight: { CONSERVATIVE: 0.45, BALANCED: 0.35, GROWTH: 0.25, AGGRESSIVE: 0.18 } },
  { symbol: 'ETHUSDT',  defaultWeight: { CONSERVATIVE: 0.25, BALANCED: 0.25, GROWTH: 0.22, AGGRESSIVE: 0.18 } },
  { symbol: 'SOLUSDT',  defaultWeight: { CONSERVATIVE: 0.05, BALANCED: 0.10, GROWTH: 0.15, AGGRESSIVE: 0.18 } },
  { symbol: 'BNBUSDT',  defaultWeight: { CONSERVATIVE: 0.05, BALANCED: 0.08, GROWTH: 0.10, AGGRESSIVE: 0.10 } },
  { symbol: 'LINKUSDT', defaultWeight: { CONSERVATIVE: 0.00, BALANCED: 0.05, GROWTH: 0.08, AGGRESSIVE: 0.10 } },
  { symbol: 'AVAXUSDT', defaultWeight: { CONSERVATIVE: 0.00, BALANCED: 0.03, GROWTH: 0.08, AGGRESSIVE: 0.10 } },
  { symbol: 'INJUSDT',  defaultWeight: { CONSERVATIVE: 0.00, BALANCED: 0.02, GROWTH: 0.06, AGGRESSIVE: 0.08 } },
  { symbol: 'ARBUSDT',  defaultWeight: { CONSERVATIVE: 0.00, BALANCED: 0.02, GROWTH: 0.06, AGGRESSIVE: 0.08 } },
];

export interface AdvisorAllocation {
  symbol: string;
  weight: number;
  rationale: string;
}

export type SourceStatus = 'ai-pipeline' | 'coingecko' | 'binance' | 'alternative.me' | 'synthetic' | 'unavailable';

export interface AdvisorSources {
  sentiment: SourceStatus;
  momentum: SourceStatus;
  fearGreed: SourceStatus;
  prices: SourceStatus;
}

export interface AdvisorResult {
  riskProfile: RiskProfile;
  targetAllocation: AdvisorAllocation[];
  cashBufferPct: number;
  expectedReturnPct: number;
  volatilityPct: number;
  rebalanceActions: string[];
  narrative: string;
  sources: AdvisorSources;
  degraded: boolean;
}

// Forward-looking profile model assumptions (not directly observable from
// market data — surfaced honestly as assumptions in the narrative).
const EXPECTED_RETURN: Record<RiskProfile, number> = {
  CONSERVATIVE: 8, BALANCED: 14, GROWTH: 22, AGGRESSIVE: 35,
};
const VOL: Record<RiskProfile, number> = {
  CONSERVATIVE: 12, BALANCED: 22, GROWTH: 38, AGGRESSIVE: 60,
};
const CASH_BUFFER: Record<RiskProfile, number> = {
  CONSERVATIVE: 0.20, BALANCED: 0.10, GROWTH: 0.05, AGGRESSIVE: 0.02,
};

const BINANCE = 'https://api.binance.com/api/v3';

/**
 * Live Binance 24h ticker for the requested symbols (one batched call). Returns
 * a map of symbol → { price, change24h }. Binance is geo-blocked from some
 * serverless regions — on any failure the map is left partial/empty and the
 * caller treats missing entries as neutral rather than inventing numbers.
 */
async function fetchTickers(symbols: string[]): Promise<Map<string, { price: number; change24h: number }>> {
  const map = new Map<string, { price: number; change24h: number }>();
  if (!symbols.length) return map;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4500);
    const param = encodeURIComponent(JSON.stringify(symbols));
    const res = await fetch(`${BINANCE}/ticker/24hr?symbols=${param}`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`http ${res.status}`);
    const arr = (await res.json()) as Array<{ symbol: string; lastPrice: string; priceChangePercent: string }>;
    for (const d of arr) {
      map.set(d.symbol, { price: Number(d.lastPrice), change24h: Number(d.priceChangePercent) });
    }
  } catch {
    /* leave map empty — caller degrades gracefully */
  }
  return map;
}

export async function buildAdvisor(accountId: string, profile: RiskProfile = 'BALANCED'): Promise<AdvisorResult> {
  const acc = getAccount(accountId);

  // Fire the real sources together: Fear & Greed (alternative.me) + CoinGecko
  // community sentiment. Then batch a Binance 24h ticker call for the universe
  // plus whatever the user actually holds (for valuation).
  const [fg, cg] = await Promise.all([getFearGreed(), loadCoinGecko()]);
  const universeSymbols = UNIVERSE.map((u) => u.symbol);
  const heldSymbols = acc.positions.map((p) => p.symbol);
  const tickers = await fetchTickers(Array.from(new Set([...universeSymbols, ...heldSymbols])));

  // The trained-model sentiment that actually drives allocation: per universe
  // coin, run the SAME alt-data composite the Lab shows (VADER + trained Naive
  // Bayes on StockTwits/news, blended with CoinGecko vote + Fear & Greed).
  // Bounded per coin (cached/deduped) so the advisor stays responsive; coins
  // that time out fall back to the raw CoinGecko vote sentiment.
  const ALT_TIMEOUT_MS = 8000;
  const composites = await Promise.all(
    UNIVERSE.map((u) => withTimeout(getRealSentimentScore(u.symbol), ALT_TIMEOUT_MS)),
  );
  const compBySymbol = new Map<string, number>();
  UNIVERSE.forEach((u, i) => {
    const c = composites[i];
    if (c && Number.isFinite(c.score)) compBySymbol.set(u.symbol, c.score);
  });
  const modelUsed = compBySymbol.size > 0;

  const cgOk = cg.size > 0;
  const pxOk = tickers.size > 0;
  const fgReal = fg.source === 'alternative.me';

  // Sentiment-tilted weights. PRIMARY driver = the alt-data sentiment model
  // composite; Binance 24h momentum is the market overlay. Falls back to the
  // CoinGecko vote (+ contrarian F&G nudge) when the model is unavailable.
  const raw = UNIVERSE.map((u) => {
    const snap = cg.get(u.symbol);
    const tk = tickers.get(u.symbol);
    const cgSentiment = snap ? snap.sentiment : 0;               // [-1, 1]
    const composite = compBySymbol.get(u.symbol);               // [-1, 1] or undefined
    const usingModel = composite !== undefined;
    const aiSent = usingModel ? composite! : cgSentiment;
    const change24h = tk ? tk.change24h : 0;                     // %
    const momentum = Math.max(-1, Math.min(1, change24h / 20));  // clamp ±20% → ±1
    // The composite already folds in CoinGecko vote + F&G, so don't double-count
    // the F&G nudge on the model path; keep it only on the CoinGecko-only path.
    const tilt = usingModel
      ? aiSent * 0.45 + momentum * 0.15
      : aiSent * 0.35 + momentum * 0.15 + (fg.value > 60 ? -0.05 : fg.value < 40 ? 0.07 : 0);
    const base = u.defaultWeight[profile];
    const adjusted = Math.max(0, base * (1 + tilt));
    const sentTxt = usingModel
      ? `AI sentiment ${(aiSent * 100).toFixed(0)}/100 (VADER+NB on social/news)`
      : snap ? `CoinGecko sentiment ${(cgSentiment * 100).toFixed(0)}/100` : 'sentiment n/a';
    const momTxt = tk ? `24h ${change24h >= 0 ? '+' : ''}${change24h.toFixed(1)}%` : 'momentum n/a';
    const rationale =
      tilt > 0.05
        ? `Overweight — ${sentTxt}, ${momTxt}.`
        : tilt < -0.05
        ? `Underweight — ${sentTxt}, ${momTxt}.`
        : `Base weight — neutral signals (${sentTxt}, ${momTxt}).`;
    return { symbol: u.symbol, weight: adjusted, rationale };
  });
  const sum = raw.reduce((s, r) => s + r.weight, 0) || 1;
  const cashBuffer = CASH_BUFFER[profile];
  const investable = 1 - cashBuffer;
  const targetAllocation: AdvisorAllocation[] = raw.map((r) => ({
    symbol: r.symbol,
    weight: Number(((r.weight / sum) * investable).toFixed(4)),
    rationale: r.rationale,
  })).filter((r) => r.weight > 0.01);

  // Build rebalance actions vs current positions using LIVE Binance prices.
  const currentValueBySymbol: Record<string, number> = {};
  let netWorth = acc.cashUsd;
  for (const p of acc.positions) {
    const px = tickers.get(p.symbol)?.price ?? 0;
    const v = p.amount * px;
    currentValueBySymbol[p.symbol] = v;
    netWorth += v;
  }
  const actions = targetAllocation.slice(0, 5).map((t) => {
    const targetUsd = t.weight * netWorth;
    const currentUsd = currentValueBySymbol[t.symbol] || 0;
    const delta = targetUsd - currentUsd;
    if (Math.abs(delta) < 50) return `${t.symbol}: hold (within band)`;
    return delta > 0
      ? `${t.symbol}: BUY +$${delta.toFixed(0)} to reach target weight ${(t.weight * 100).toFixed(1)}%`
      : `${t.symbol}: SELL -$${Math.abs(delta).toFixed(0)} to trim`;
  });

  const sources: AdvisorSources = {
    sentiment: modelUsed ? 'ai-pipeline' : cgOk ? 'coingecko' : 'unavailable',
    momentum: pxOk ? 'binance' : 'unavailable',
    fearGreed: fgReal ? 'alternative.me' : 'synthetic',
    prices: pxOk ? 'binance' : 'unavailable',
  };
  const degraded = (!modelUsed && !cgOk) || !pxOk || !fgReal;

  return {
    riskProfile: profile,
    targetAllocation,
    cashBufferPct: cashBuffer * 100,
    expectedReturnPct: EXPECTED_RETURN[profile],
    volatilityPct: VOL[profile],
    rebalanceActions: actions,
    sources,
    degraded,
    narrative:
      `For a ${profile.toLowerCase()} investor, the AI advisor tilts the portfolio primarily on ` +
      `${modelUsed
        ? 'the alt-data sentiment model — VADER + trained Naive Bayes on live StockTwits/news, blended with CoinGecko vote & Fear & Greed'
        : (cgOk ? 'CoinGecko community sentiment' : 'sentiment unavailable')}, ` +
      `overlaid with ${pxOk ? '24h price momentum from Binance' : 'momentum unavailable'}. ` +
      `Fear & Greed ${fg.value} (${fg.classification}${fgReal ? '' : ', synthetic fallback'}). ` +
      `Expected ~${EXPECTED_RETURN[profile]}% return / ~${VOL[profile]}% volatility are ${profile.toLowerCase()} ` +
      `model assumptions, not live-derived. Cash buffer ${(cashBuffer * 100).toFixed(0)}% kept for dip-buys.`,
  };
}
