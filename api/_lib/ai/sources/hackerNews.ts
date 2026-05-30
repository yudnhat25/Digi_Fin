/**
 * REAL data source — Hacker News (Algolia search API).
 *
 * Endpoint: https://hn.algolia.com/api/v1/search?query=<q>&tags=story
 * Fully public, no auth, no API key, no rate limit issue for moderate use.
 *
 * HN counts as social-media-adjacent text: every entry is a user-submitted
 * story with community upvotes ("points") and comment count, identical in
 * structure to what we wanted from Reddit. Each hit has:
 *   { title, author, points, num_comments, created_at_i, url, objectID }
 *
 * For the assignment this functions as the "social media sentiment" data
 * source — text scraped from a major web community, then run through
 * VADER NLP for sentiment analysis.
 */

export interface HnHit {
  id: string;
  title: string;
  author: string;
  points: number;
  numComments: number;
  createdUtc: number;
  url: string;
  hnUrl: string;
}

interface CacheEntry { ts: number; data: HnHit[] }
const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 10 * 60 * 1000;

const USER_AGENT = 'CoinWiseAI/1.0';

// Map coin symbol → search terms. Multiple terms widen the corpus.
const COIN_QUERIES: Record<string, string[]> = {
  BTC: ['bitcoin', 'BTC'],
  ETH: ['ethereum', 'ETH'],
  SOL: ['solana'],
  BNB: ['binance', 'BNB'],
  XRP: ['ripple', 'XRP'],
  DOGE: ['dogecoin'],
  ADA: ['cardano'],
  AVAX: ['avalanche crypto'],
  LINK: ['chainlink'],
  DOT: ['polkadot'],
  SHIB: ['shiba inu'],
  NEAR: ['near protocol'],
  ARB: ['arbitrum'],
  OP: ['optimism crypto'],
};

async function fetchSearch(query: string, page = 0): Promise<HnHit[]> {
  const key = `hn:${query}:${page}`;
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.data;

  const url = new URL('https://hn.algolia.com/api/v1/search');
  url.searchParams.set('query', query);
  url.searchParams.set('tags', 'story');
  url.searchParams.set('hitsPerPage', '50');
  url.searchParams.set('page', String(page));
  // Surface fresh material first by also pulling the by-date endpoint when paged.
  const finalUrl = page === 0
    ? url.toString()
    : url.toString().replace('/v1/search?', '/v1/search_by_date?');

  const res = await fetch(finalUrl, {
    headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`hn_algolia_${res.status}`);
  const json = (await res.json()) as { hits?: any[] };
  const hits: HnHit[] = (json.hits || [])
    .filter((h) => h.title)
    .map((h) => ({
      id: String(h.objectID),
      title: String(h.title),
      author: String(h.author || 'anon'),
      points: Number(h.points) || 0,
      numComments: Number(h.num_comments) || 0,
      createdUtc: Number(h.created_at_i) || 0,
      url: String(h.url || ''),
      hnUrl: `https://news.ycombinator.com/item?id=${h.objectID}`,
    }));
  CACHE.set(key, { ts: Date.now(), data: hits });
  return hits;
}

export async function collectHnForSymbol(symbol: string): Promise<{
  posts: HnHit[]; sources: string[]; errors: string[];
}> {
  const base = symbol.replace(/USDT$|USD$/i, '').toUpperCase();
  const queries = COIN_QUERIES[base] || [base.toLowerCase()];
  const sources: string[] = [];
  const errors: string[] = [];
  const all: HnHit[] = [];

  for (const q of queries) {
    try {
      // Page 0 = by-relevance ("hot"); page-0-by-date = fresher.
      const [hot, recent] = await Promise.all([fetchSearch(q, 0), fetchSearch(q, 1)]);
      all.push(...hot, ...recent);
      sources.push(`hn.algolia "${q}" (n=${hot.length}+${recent.length})`);
    } catch (e) {
      errors.push(`hn:${q}: ${(e as Error).message}`);
    }
  }
  const dedup = new Map<string, HnHit>();
  for (const h of all) dedup.set(h.id, h);
  const posts = Array.from(dedup.values()).sort((a, b) =>
    b.points - a.points || b.createdUtc - a.createdUtc,
  );
  return { posts, sources, errors };
}

export async function pingHackerNews(): Promise<{ ok: boolean; latencyMs: number; sample?: number; error?: string }> {
  const t0 = Date.now();
  try {
    const hits = await fetchSearch('bitcoin', 0);
    return { ok: hits.length > 0, latencyMs: Date.now() - t0, sample: hits.length };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - t0, error: (e as Error).message };
  }
}
