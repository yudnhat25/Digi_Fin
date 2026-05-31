/**
 * Alternative-Data analytics layer (Part A of the assignment).
 *
 * The data sources demonstrated here:
 *   • Social sentiment (Twitter/Reddit/News blend)        — score ∈ [-1, 1]
 *   • On-chain whale flow (net large-wallet movement)
 *   • Fear & Greed market mood index
 *   • Aggregated social pulse leaderboard
 *
 * In production these would call CryptoPanic, LunarCrush, Etherscan,
 * Alternative.me etc. For the assignment demo we generate deterministic
 * pseudo-realistic data seeded by the asset symbol so values are stable
 * inside a session but vary across coins — perfect for live UI demos.
 */

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pseudoRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const SENTIMENT_THEMES: Record<string, string[]> = {
  BTC: ['ETF inflows', 'halving narrative', 'institutional buying', 'macro hedge'],
  ETH: ['L2 adoption', 'restaking', 'fee burn', 'staking yield'],
  SOL: ['memecoin volume', 'DePIN growth', 'mobile wallet UX'],
  BNB: ['exchange flow', 'BNB Chain TVL', 'ecosystem grants'],
  XRP: ['SEC clarity', 'cross-border rails', 'banking partnerships'],
  DOGE: ['Elon mention', 'retail FOMO', 'pump risk'],
  SHIB: ['burn rate', 'community hype'],
};

function themesFor(base: string): string[] {
  return SENTIMENT_THEMES[base] || ['retail interest', 'developer activity', 'macro liquidity'];
}

export interface SentimentSnapshot {
  symbol: string;
  score: number;
  label: 'Bearish' | 'Neutral' | 'Bullish' | 'Euphoric';
  mentions24h: number;
  sources: { twitter: number; reddit: number; news: number };
  topThemes: string[];
  aiSummary: string;
  updatedAt: string;
}

export function getSentiment(symbol: string): SentimentSnapshot {
  const base = symbol.replace('USDT', '').toUpperCase();
  const rnd = pseudoRandom(hash(base) + Math.floor(Date.now() / (15 * 60 * 1000)));
  const raw = (rnd() * 2 - 1) * 0.85;
  const score = Number(raw.toFixed(3));
  const label: SentimentSnapshot['label'] =
    score > 0.55 ? 'Euphoric' : score > 0.2 ? 'Bullish' : score < -0.4 ? 'Bearish' : 'Neutral';
  const mentions = Math.floor(800 + rnd() * 28000);
  const themes = themesFor(base).slice(0, 3);
  return {
    symbol,
    score,
    label,
    mentions24h: mentions,
    sources: {
      twitter: Number((0.4 + rnd() * 0.6).toFixed(2)),
      reddit: Number((0.3 + rnd() * 0.6).toFixed(2)),
      news: Number((0.2 + rnd() * 0.6).toFixed(2)),
    },
    topThemes: themes,
    aiSummary:
      `Last 24h: ${mentions.toLocaleString()} social mentions for ${base}. ` +
      `Sentiment is ${label.toLowerCase()} (${(score * 100).toFixed(0)}/100). ` +
      `Key drivers: ${themes.join(', ')}.`,
    updatedAt: new Date().toISOString(),
  };
}

export interface WhaleFlow {
  symbol: string;
  netFlow24hUsd: number;
  largeBuys: number;
  largeSells: number;
  biggestSingle: number;
  verdict: string;
  series: { t: string; netUsd: number }[];
}

export function getWhaleFlow(symbol: string): WhaleFlow {
  const base = symbol.replace('USDT', '').toUpperCase();
  const rnd = pseudoRandom(hash(`whale-${base}`) + Math.floor(Date.now() / (10 * 60 * 1000)));
  const net = Math.round((rnd() - 0.45) * 4_800_000);
  const buys = Math.floor(8 + rnd() * 24);
  const sells = Math.floor(6 + rnd() * 22);
  const series = Array.from({ length: 24 }, (_, i) => ({
    t: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
    netUsd: Math.round((rnd() - 0.5) * 1_200_000),
  }));
  return {
    symbol,
    netFlow24hUsd: net,
    largeBuys: buys,
    largeSells: sells,
    biggestSingle: Math.round(rnd() * 3_500_000 + 500_000),
    verdict:
      net > 1_000_000
        ? 'Smart-money is accumulating'
        : net < -1_000_000
        ? 'Smart-money is distributing'
        : 'Neutral whale flow — wait for confirmation',
    series,
  };
}

export interface FearGreedRow { date: string; value: number }
export interface FearGreed {
  value: number;
  classification: string;
  delta24h: number;
  history: FearGreedRow[];
  source?: 'alternative.me' | 'synthetic';
}

function getFearGreedSynthetic(): FearGreed {
  const rnd = pseudoRandom(Math.floor(Date.now() / (30 * 60 * 1000)));
  const value = Math.round(20 + rnd() * 70);
  const delta = Math.round((rnd() - 0.5) * 12);
  const classification =
    value < 25 ? 'Extreme Fear' : value < 45 ? 'Fear' : value < 55 ? 'Neutral' : value < 75 ? 'Greed' : 'Extreme Greed';
  const history: FearGreedRow[] = Array.from({ length: 14 }, (_, i) => {
    const r = pseudoRandom(hash(`fg-${i}`) + Math.floor(Date.now() / (24 * 3600 * 1000)));
    return {
      date: new Date(Date.now() - (13 - i) * 24 * 3600 * 1000).toISOString().slice(0, 10),
      value: Math.round(20 + r() * 70),
    };
  });
  return { value, classification, delta24h: delta, history, source: 'synthetic' };
}

// In-memory cache. Alternative.me publishes one new data point per day at
// 00:00 UTC, so 30-minute TTL is generous and avoids hammering the endpoint.
const FG_CACHE_TTL_MS = 30 * 60 * 1000;
let fgCache: { data: FearGreed; ts: number } | null = null;

/**
 * Fetches the live Fear & Greed Index from Alternative.me — the canonical
 * source most crypto sites quote. Public, free, no API key. Falls back to the
 * synthetic generator on network error or schema drift so the UI never breaks.
 *
 * Docs: https://alternative.me/crypto/fear-and-greed-index/
 */
export async function getFearGreed(): Promise<FearGreed> {
  const now = Date.now();
  if (fgCache && now - fgCache.ts < FG_CACHE_TTL_MS) return fgCache.data;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4500);
    const res = await fetch('https://api.alternative.me/fng/?limit=15', { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`http ${res.status}`);
    const json = (await res.json()) as {
      data: Array<{ value: string; value_classification: string; timestamp: string }>;
    };
    const data = json.data || [];
    if (!data.length) throw new Error('empty payload');
    const today = data[0];
    const yesterday = data[1] || today;
    // API returns newest first → reverse for chronological history.
    const history: FearGreedRow[] = data
      .slice(0, 14)
      .map((r) => ({
        date: new Date(Number(r.timestamp) * 1000).toISOString().slice(0, 10),
        value: Number(r.value),
      }))
      .reverse();
    const result: FearGreed = {
      value: Number(today.value),
      classification: today.value_classification,
      delta24h: Number(today.value) - Number(yesterday.value),
      history,
      source: 'alternative.me',
    };
    fgCache = { data: result, ts: now };
    return result;
  } catch {
    return getFearGreedSynthetic();
  }
}

export interface SocialPulseRow {
  symbol: string;
  mentions24h: number;
  sentiment: number;
  delta: number;
  momentum: 'Spike' | 'Rising' | 'Stable' | 'Cooling';
  source?: 'cryptopanic' | 'synthetic';
}

const PULSE_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT',
  'ADAUSDT', 'AVAXUSDT', 'LINKUSDT', 'DOTUSDT', 'SHIBUSDT', 'NEARUSDT',
  'WIFUSDT', 'PEPEUSDT', 'TIAUSDT', 'INJUSDT', 'ARBUSDT', 'OPUSDT'
];

function momentumFromDelta(delta: number): SocialPulseRow['momentum'] {
  if (delta > 0.3) return 'Spike';
  if (delta > 0.05) return 'Rising';
  if (delta < -0.2) return 'Cooling';
  return 'Stable';
}

function getSocialPulseSynthetic(): SocialPulseRow[] {
  return PULSE_SYMBOLS.map((sym) => {
    const s = getSentiment(sym);
    const delta = Number(((Math.random() - 0.5) * 0.8).toFixed(2));
    return {
      symbol: sym,
      mentions24h: s.mentions24h,
      sentiment: s.score,
      delta,
      momentum: momentumFromDelta(delta),
      source: 'synthetic' as const,
    };
  }).sort((a, b) => b.mentions24h - a.mentions24h);
}

interface CryptoPanicAggregate {
  posts: number;
  sentiment: number;
  delta: number;
}

const CP_CACHE_TTL_MS = 15 * 60 * 1000;
let cpCache: { data: Map<string, CryptoPanicAggregate>; ts: number } | null = null;

/**
 * Fetches recent crypto news from CryptoPanic and aggregates per-coin
 * sentiment. The public API ranks posts with community votes (positive,
 * negative, important, toxic, etc.); we treat positive+liked+important as
 * bullish signal and negative+toxic+disliked as bearish, then normalize to
 * [-1, 1].
 *
 * Requires a free API key at https://cryptopanic.com/developers/api/ exposed
 * as the CRYPTOPANIC_API_KEY env var on Vercel. Without the key we silently
 * return an empty map and the caller falls back to synthetic data.
 *
 * The "current vs previous half" delta gives us a momentum signal: if a coin
 * is mentioned 8 times in the recent half of the feed but only 3 in the
 * older half, that's a spike.
 */
async function loadCryptoPanic(): Promise<Map<string, CryptoPanicAggregate>> {
  const key = process.env.CRYPTOPANIC_API_KEY;
  if (!key) return new Map();
  const now = Date.now();
  if (cpCache && now - cpCache.ts < CP_CACHE_TTL_MS) return cpCache.data;

  try {
    const tracked = PULSE_SYMBOLS.map((s) => s.replace('USDT', '')).join(',');
    const url = `https://cryptopanic.com/api/v1/posts/?auth_token=${encodeURIComponent(key)}&public=true&currencies=${tracked}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5500);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`http ${res.status}`);
    const json = (await res.json()) as {
      results?: Array<{
        votes?: {
          positive?: number; negative?: number; important?: number;
          liked?: number; disliked?: number; toxic?: number;
        };
        currencies?: Array<{ code: string }>;
        published_at?: string;
      }>;
    };
    const posts = json.results || [];
    if (!posts.length) throw new Error('empty');

    // Bucket the feed into "recent half" vs "older half" so we can derive a
    // 24h-ish delta. CryptoPanic's free endpoint returns ~50 latest posts; the
    // boundary is just the median position.
    const half = Math.floor(posts.length / 2);
    const agg = new Map<string, { posts: number; pos: number; neg: number; recentPosts: number; olderPosts: number }>();
    posts.forEach((post, idx) => {
      const votes = post.votes || {};
      const positive = (votes.positive || 0) + (votes.liked || 0) + (votes.important || 0);
      const negative = (votes.negative || 0) + (votes.disliked || 0) + (votes.toxic || 0);
      for (const cur of post.currencies || []) {
        const code = (cur.code || '').toUpperCase();
        if (!code) continue;
        const e = agg.get(code) || { posts: 0, pos: 0, neg: 0, recentPosts: 0, olderPosts: 0 };
        e.posts += 1;
        e.pos += positive;
        e.neg += negative;
        if (idx < half) e.recentPosts += 1; else e.olderPosts += 1;
        agg.set(code, e);
      }
    });

    const result = new Map<string, CryptoPanicAggregate>();
    for (const [code, e] of agg) {
      const totalVotes = e.pos + e.neg;
      // If a post has no votes (common in slow news cycles), treat as neutral
      // so we don't penalize coins for low engagement.
      const sentiment = totalVotes > 0 ? (e.pos - e.neg) / totalVotes : 0;
      const olderRate = e.olderPosts || 1;
      const delta = Math.max(-1, Math.min(1, (e.recentPosts - e.olderPosts) / olderRate));
      result.set(code, {
        posts: e.posts,
        sentiment: Number(sentiment.toFixed(3)),
        delta: Number(delta.toFixed(2)),
      });
    }
    cpCache = { data: result, ts: now };
    return result;
  } catch {
    return new Map();
  }
}

/**
 * Builds the Social Pulse leaderboard. When CRYPTOPANIC_API_KEY is set, each
 * tracked symbol gets a real-news-derived row; coins with no recent coverage
 * fall back to the synthetic generator so the table is never sparse. The
 * `source` field tells the UI which rows are real vs filled-in.
 */
export async function getSocialPulse(): Promise<SocialPulseRow[]> {
  const cp = await loadCryptoPanic();
  if (cp.size === 0) return getSocialPulseSynthetic();

  return PULSE_SYMBOLS.map((sym) => {
    const base = sym.replace('USDT', '').toUpperCase();
    const real = cp.get(base);
    if (real) {
      // Scale post count to look like "mentions" — CryptoPanic posts are
      // articles, not tweets, so multiply by a plausible factor (~250
      // mentions per article on social media) to stay in the same order of
      // magnitude as the previous synthetic numbers.
      const mentions24h = Math.round(real.posts * 250 + 800);
      return {
        symbol: sym,
        mentions24h,
        sentiment: real.sentiment,
        delta: real.delta,
        momentum: momentumFromDelta(real.delta),
        source: 'cryptopanic' as const,
      };
    }
    // No coverage in this batch — fall back per coin.
    const s = getSentiment(sym);
    const delta = Number(((Math.random() - 0.5) * 0.5).toFixed(2));
    return {
      symbol: sym,
      mentions24h: s.mentions24h,
      sentiment: s.score,
      delta,
      momentum: momentumFromDelta(delta),
      source: 'synthetic' as const,
    };
  }).sort((a, b) => b.mentions24h - a.mentions24h);
}

export function signalFromSentiment(
  sentiment: number,
  change24h: number,
): 'BUY' | 'HOLD' | 'SELL' | 'NEUTRAL' {
  const blended = sentiment * 0.6 + (change24h / 10) * 0.4;
  if (blended > 0.35) return 'BUY';
  if (blended < -0.35) return 'SELL';
  if (Math.abs(blended) < 0.08) return 'NEUTRAL';
  return 'HOLD';
}
