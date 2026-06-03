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
  source?: 'coingecko' | 'synthetic';
}

const PULSE_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT',
  'ADAUSDT', 'AVAXUSDT', 'LINKUSDT', 'DOTUSDT', 'SHIBUSDT', 'NEARUSDT',
  'WIFUSDT', 'PEPEUSDT', 'TIAUSDT', 'INJUSDT', 'ARBUSDT', 'OPUSDT'
];

// Binance ticker symbol → CoinGecko coin ID. CoinGecko's API is keyed on the
// canonical project slug, not the trading pair.
const COINGECKO_ID_MAP: Record<string, string> = {
  BTCUSDT: 'bitcoin', ETHUSDT: 'ethereum', SOLUSDT: 'solana',
  BNBUSDT: 'binancecoin', XRPUSDT: 'ripple', DOGEUSDT: 'dogecoin',
  ADAUSDT: 'cardano', AVAXUSDT: 'avalanche-2', LINKUSDT: 'chainlink',
  DOTUSDT: 'polkadot', SHIBUSDT: 'shiba-inu', NEARUSDT: 'near',
  WIFUSDT: 'dogwifcoin', PEPEUSDT: 'pepe', TIAUSDT: 'celestia',
  INJUSDT: 'injective-protocol', ARBUSDT: 'arbitrum', OPUSDT: 'optimism',
};

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

export interface CoinGeckoSnapshot {
  sentiment: number;     // [-1, 1] from sentiment_votes_up - down
  mentions24h: number;   // composite of Reddit posts/comments + Twitter followers
  delta: number;         // [-1, 1] derived from 24h price change as momentum proxy
}

const CG_CACHE_TTL_MS = 15 * 60 * 1000;
let cgCache: { data: Map<string, CoinGeckoSnapshot>; ts: number } | null = null;

/**
 * Fetches per-coin community + sentiment data from CoinGecko's free Public
 * API (no key required). For each tracked symbol we hit:
 *
 *   GET /api/v3/coins/{id}?community_data=true&market_data=true&...
 *
 * and extract:
 *   - sentiment_votes_up_percentage / down_percentage → sentiment in [-1, 1]
 *   - community_data.reddit_average_posts_48h + reddit_average_comments_48h
 *     + twitter_followers/5000 → "mentions24h" composite engagement score
 *   - market_data.price_change_percentage_24h / 20 → momentum delta proxy
 *
 * 18 requests are fired in parallel with a 4s per-call timeout; failures
 * (rate-limit, network, schema drift) drop to per-coin synthetic fallback.
 * Result cached 15 minutes — CoinGecko free tier permits ~10-30 calls/min,
 * so one full refresh every quarter-hour is well below the limit.
 */
export async function loadCoinGecko(): Promise<Map<string, CoinGeckoSnapshot>> {
  const now = Date.now();
  if (cgCache && now - cgCache.ts < CG_CACHE_TTL_MS) return cgCache.data;

  const fetchOne = async (sym: string, id: string): Promise<[string, CoinGeckoSnapshot] | null> => {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4500);
      const url =
        `https://api.coingecko.com/api/v3/coins/${id}` +
        `?localization=false&tickers=false&market_data=true` +
        `&community_data=true&developer_data=false&sparkline=false`;
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { 'accept': 'application/json' },
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`http ${res.status}`);
      const json = (await res.json()) as {
        sentiment_votes_up_percentage?: number;
        sentiment_votes_down_percentage?: number;
        community_data?: {
          twitter_followers?: number;
          reddit_average_posts_48h?: number;
          reddit_average_comments_48h?: number;
          reddit_subscribers?: number;
        };
        market_data?: {
          price_change_percentage_24h?: number;
        };
      };
      const up = Number(json.sentiment_votes_up_percentage || 0);
      const down = Number(json.sentiment_votes_down_percentage || 0);
      const sentiment = up + down > 0 ? (up - down) / 100 : 0;
      const cd = json.community_data || {};
      const posts = Number(cd.reddit_average_posts_48h || 0);
      const comments = Number(cd.reddit_average_comments_48h || 0);
      const twitter = Number(cd.twitter_followers || 0);
      // Composite engagement score. Reddit posts/comments are the most
      // dynamic signal; Twitter followers add a (heavily-dampened) baseline
      // so high-profile coins still rank above obscure ones. +800 floor
      // keeps everything visible on the bar chart.
      const mentions24h = Math.round((posts + comments) * 18 + twitter / 4000 + 800);
      const priceChange = Number(json.market_data?.price_change_percentage_24h || 0);
      // Use price change as a momentum proxy; clamped to [-1, 1] at ±20%.
      const delta = Math.max(-1, Math.min(1, priceChange / 20));
      return [sym, {
        sentiment: Number(sentiment.toFixed(3)),
        mentions24h,
        delta: Number(delta.toFixed(2)),
      }];
    } catch {
      return null;
    }
  };

  const results = await Promise.all(
    Object.entries(COINGECKO_ID_MAP).map(([sym, id]) => fetchOne(sym, id))
  );
  const map = new Map<string, CoinGeckoSnapshot>();
  for (const r of results) {
    if (r) map.set(r[0], r[1]);
  }
  // Only cache if at least some calls succeeded — otherwise the next request
  // will retry instead of being stuck with an empty cache for 15 min.
  if (map.size > 0) cgCache = { data: map, ts: now };
  return map;
}

/**
 * Builds the Social Pulse leaderboard. Each tracked symbol gets a real row
 * from CoinGecko when available; coins whose call failed (rate-limit,
 * timeout, etc.) fall back to the synthetic generator so the table is never
 * sparse. The `source` field tells the UI which rows are live.
 */
export async function getSocialPulse(): Promise<SocialPulseRow[]> {
  const cg = await loadCoinGecko();
  if (cg.size === 0) return getSocialPulseSynthetic();

  return PULSE_SYMBOLS.map((sym) => {
    const real = cg.get(sym);
    if (real) {
      return {
        symbol: sym,
        mentions24h: real.mentions24h,
        sentiment: real.sentiment,
        delta: real.delta,
        momentum: momentumFromDelta(real.delta),
        source: 'coingecko' as const,
      };
    }
    // Per-coin fallback — keeps the leaderboard full even if one symbol's
    // CoinGecko fetch hit a 429.
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
