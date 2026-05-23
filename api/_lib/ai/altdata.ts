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
}

export function getFearGreed(): FearGreed {
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
  return { value, classification, delta24h: delta, history };
}

export interface SocialPulseRow {
  symbol: string;
  mentions24h: number;
  sentiment: number;
  delta: number;
  momentum: 'Spike' | 'Rising' | 'Stable' | 'Cooling';
}

const PULSE_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT',
  'ADAUSDT', 'AVAXUSDT', 'LINKUSDT', 'DOTUSDT', 'SHIBUSDT', 'NEARUSDT',
  'WIFUSDT', 'PEPEUSDT', 'TIAUSDT', 'INJUSDT', 'ARBUSDT', 'OPUSDT'
];

export function getSocialPulse(): SocialPulseRow[] {
  return PULSE_SYMBOLS.map((sym) => {
    const s = getSentiment(sym);
    const delta = Number(((Math.random() - 0.5) * 0.8).toFixed(2));
    const momentum: SocialPulseRow['momentum'] =
      delta > 0.3 ? 'Spike' : delta > 0.05 ? 'Rising' : delta < -0.2 ? 'Cooling' : 'Stable';
    return {
      symbol: sym,
      mentions24h: s.mentions24h,
      sentiment: s.score,
      delta,
      momentum,
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
