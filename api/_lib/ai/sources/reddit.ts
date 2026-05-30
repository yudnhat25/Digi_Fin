/**
 * REAL data source #1 — Reddit public JSON endpoint.
 *
 * Reddit exposes any subreddit / search results as JSON by appending `.json`
 * to the URL. No API key needed for read-only access; rate-limit is
 * ~60 req/min/IP. We respect that by caching for 5 minutes per query key.
 *
 * Endpoints used:
 *   - https://www.reddit.com/r/CryptoCurrency/hot.json?limit=100
 *   - https://www.reddit.com/r/<symbol>/hot.json?limit=50   (per-coin sub)
 *   - https://www.reddit.com/search.json?q=<sym>&restrict_sr=&sort=new
 */

export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  subreddit: string;
  author: string;
  ups: number;
  numComments: number;
  createdUtc: number;
  url: string;          // permalink
  flair?: string;
}

interface CacheEntry { ts: number; data: RedditPost[] }
const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

// Reddit requires the standard "<platform>:<appname>:<version> (by /u/<dev>)"
// format. Default Node UAs and any string containing "fetch"/"node"/"bot"
// trigger a 403 from their anti-scraping layer.
const USER_AGENT = 'web:coinwise-ai:v1.0.0 (by /u/coinwise_dev)';

async function fetchJson(url: string, attempt = 0): Promise<any> {
  // Try the primary host first, then fall back to old.reddit.com which has a
  // looser bot policy.
  const target = attempt === 0 ? url : url.replace('www.reddit.com', 'old.reddit.com');
  const res = await fetch(target, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
    },
  });
  if (!res.ok) {
    if ((res.status === 403 || res.status === 429) && attempt === 0) {
      return fetchJson(url, attempt + 1); // one retry on old.reddit.com
    }
    throw new Error(`Reddit ${res.status} on ${target}`);
  }
  return res.json();
}

function parseChildren(json: any): RedditPost[] {
  const children = json?.data?.children || [];
  return children
    .filter((c: any) => c?.kind === 't3' && c?.data)
    .map((c: any): RedditPost => ({
      id: c.data.id,
      title: c.data.title || '',
      selftext: c.data.selftext || '',
      subreddit: c.data.subreddit || '',
      author: c.data.author || '',
      ups: Number(c.data.ups) || 0,
      numComments: Number(c.data.num_comments) || 0,
      createdUtc: Number(c.data.created_utc) || 0,
      url: c.data.permalink ? `https://reddit.com${c.data.permalink}` : c.data.url || '',
      flair: c.data.link_flair_text || undefined,
    }));
}

// ─── Per-coin sub mapping ───
const PER_COIN_SUBS: Record<string, string[]> = {
  BTC: ['Bitcoin', 'BitcoinMarkets'],
  ETH: ['ethereum', 'ethfinance'],
  SOL: ['solana'],
  BNB: ['binance'],
  XRP: ['XRP', 'Ripple'],
  DOGE: ['dogecoin'],
  ADA: ['cardano'],
  AVAX: ['Avax'],
  LINK: ['Chainlink'],
  DOT: ['dot'],
  SHIB: ['SHIBArmy'],
  NEAR: ['nearprotocol'],
  ARB: ['arbitrum'],
  OP: ['optimism'],
};

export async function fetchSubredditHot(subreddit: string, limit = 50): Promise<RedditPost[]> {
  const key = `sub:${subreddit}:${limit}`;
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.data;
  const url = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/hot.json?limit=${limit}&t=day`;
  const json = await fetchJson(url);
  const posts = parseChildren(json);
  CACHE.set(key, { ts: Date.now(), data: posts });
  return posts;
}

export async function searchReddit(query: string, limit = 50): Promise<RedditPost[]> {
  const key = `search:${query}:${limit}`;
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.data;
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&t=day&limit=${limit}`;
  const json = await fetchJson(url);
  const posts = parseChildren(json);
  CACHE.set(key, { ts: Date.now(), data: posts });
  return posts;
}

/**
 * Collect a corpus of Reddit posts relevant to a crypto symbol.
 * Strategy:
 *   1. Pull `hot` from coin-specific subs if known (e.g. r/Bitcoin for BTC).
 *   2. Pull `hot` from r/CryptoCurrency and filter by symbol mentions.
 *   3. Dedupe by post id.
 */
export async function collectCorpusForSymbol(symbol: string): Promise<{
  posts: RedditPost[];
  sources: string[];
  errors: string[];
}> {
  const base = symbol.replace(/USDT$|USD$/i, '').toUpperCase();
  const sources: string[] = [];
  const errors: string[] = [];
  const all: RedditPost[] = [];

  // 1. Coin-specific subs.
  for (const sub of PER_COIN_SUBS[base] || []) {
    try {
      const posts = await fetchSubredditHot(sub, 40);
      all.push(...posts);
      sources.push(`r/${sub} (n=${posts.length})`);
    } catch (e) {
      errors.push(`r/${sub}: ${(e as Error).message}`);
    }
  }

  // 2. General crypto sub, filtered by symbol mention.
  try {
    const general = await fetchSubredditHot('CryptoCurrency', 100);
    const re = new RegExp(`\\b${base}\\b|\\$${base}\\b`, 'i');
    const matched = general.filter((p) => re.test(p.title) || re.test(p.selftext));
    all.push(...matched);
    sources.push(`r/CryptoCurrency filtered=${matched.length}/${general.length}`);
  } catch (e) {
    errors.push(`r/CryptoCurrency: ${(e as Error).message}`);
  }

  // Dedupe by post id, sort by upvote.
  const dedup = new Map<string, RedditPost>();
  for (const p of all) dedup.set(p.id, p);
  const posts = Array.from(dedup.values()).sort((a, b) => b.ups - a.ups);

  return { posts, sources, errors };
}

/**
 * Health check for the Reddit source (used by /api/v1/health & pipeline page).
 */
export async function pingReddit(): Promise<{ ok: boolean; latencyMs: number; sample?: number; error?: string }> {
  const t0 = Date.now();
  try {
    const posts = await fetchSubredditHot('CryptoCurrency', 5);
    return { ok: posts.length > 0, latencyMs: Date.now() - t0, sample: posts.length };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - t0, error: (e as Error).message };
  }
}
