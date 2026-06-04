/**
 * REAL data source — StockTwits (crypto-native social sentiment).
 *
 * StockTwits is a trader-focused social network. Each crypto has its own
 * symbol stream (BTC.X, ETH.X, SOL.X …) of short, opinionated messages — far
 * more on-topic for sentiment than general Hacker News tech stories, and users
 * frequently SELF-TAG each post Bullish/Bearish, giving a human ground-truth
 * label alongside the text we run through VADER/NB.
 *
 * Endpoint: https://api.stocktwits.com/api/2/streams/symbol/{SYMBOL}.json
 * Public, no API key. ~200 req/hour/IP unauthenticated, so we cache 10 min.
 *
 * We reuse the HnHit shape so StockTwits drops straight into the pipeline's
 * existing social-text slot (with platform='StockTwits').
 */
import type { HnHit } from './hackerNews';

// Base symbol → StockTwits ticker. Crypto tickers use the `.X` suffix.
const ST_SYMBOLS: Record<string, string> = {
  BTC: 'BTC.X', ETH: 'ETH.X', SOL: 'SOL.X', BNB: 'BNB.X', XRP: 'XRP.X',
  DOGE: 'DOGE.X', ADA: 'ADA.X', AVAX: 'AVAX.X', LINK: 'LINK.X', DOT: 'DOT.X',
  SHIB: 'SHIB.X', NEAR: 'NEAR.X', ARB: 'ARB.X', OP: 'OP.X', PEPE: 'PEPE.X',
  INJ: 'INJ.X', TIA: 'TIA.X', WIF: 'WIF.X',
};

interface CacheEntry { ts: number; data: HnHit[] }
const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 10 * 60 * 1000;

const USER_AGENT =
  'Mozilla/5.0 (compatible; CoinWiseAI/1.0; +https://coinwise.ai)';

interface StMessage {
  id: number;
  body: string;
  created_at: string;
  user?: { username?: string; followers?: number };
  entities?: { sentiment?: { basic?: 'Bullish' | 'Bearish' } | null };
  likes?: { total?: number };
}

export async function collectStockTwits(symbol: string): Promise<{
  posts: HnHit[]; sources: string[]; errors: string[];
}> {
  const base = symbol.replace(/USDT$|USD$/i, '').toUpperCase();
  const ticker = ST_SYMBOLS[base] || `${base}.X`;
  const cacheKey = `st:${ticker}`;
  const hit = CACHE.get(cacheKey);
  if (hit && Date.now() - hit.ts < TTL_MS) {
    return { posts: hit.data, sources: [`stocktwits ${ticker} (n=${hit.data.length})`], errors: [] };
  }

  try {
    const url = `https://api.stocktwits.com/api/2/streams/symbol/${encodeURIComponent(ticker)}.json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`stocktwits_${res.status}`);
    const json = (await res.json()) as { messages?: StMessage[] };
    const messages = json.messages || [];
    const posts: HnHit[] = messages
      .filter((m) => m.body)
      .map((m) => {
        const username = m.user?.username || 'anon';
        // Fold the user's own Bullish/Bearish tag into the text so VADER/NB
        // pick up the explicit signal too (e.g. "Bullish. …").
        const tag = m.entities?.sentiment?.basic;
        const body = tag ? `${tag}. ${m.body}` : m.body;
        return {
          id: `st:${m.id}`,
          title: body,
          author: username,
          points: Number(m.likes?.total) || 0,
          numComments: 0,
          createdUtc: m.created_at ? Math.floor(new Date(m.created_at).getTime() / 1000) : 0,
          url: `https://stocktwits.com/${username}/message/${m.id}`,
          hnUrl: `https://stocktwits.com/symbol/${ticker}`,
          platform: 'StockTwits',
        } as HnHit;
      });
    CACHE.set(cacheKey, { ts: Date.now(), data: posts });
    return { posts, sources: [`stocktwits ${ticker} (n=${posts.length})`], errors: [] };
  } catch (e) {
    return { posts: [], sources: [], errors: [`stocktwits:${ticker}: ${(e as Error).message}`] };
  }
}

export async function pingStockTwits(): Promise<{ ok: boolean; latencyMs: number; sample?: number; error?: string }> {
  const t0 = Date.now();
  try {
    const { posts, errors } = await collectStockTwits('BTC');
    if (errors.length && posts.length === 0) throw new Error(errors[0]);
    return { ok: posts.length > 0, latencyMs: Date.now() - t0, sample: posts.length };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - t0, error: (e as Error).message };
  }
}
