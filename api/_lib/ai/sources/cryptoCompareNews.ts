/**
 * REAL data source — CryptoCompare News API (free public).
 *
 * Endpoint: https://min-api.cryptocompare.com/data/v2/news/?lang=EN
 * Optionally filter per-coin via &categories=BTC,ETH,...
 *
 * Returns aggregated crypto news from Cointelegraph, CoinDesk, U.Today,
 * Decrypt, etc. — i.e. exactly the web-scraped + social-adjacent text
 * corpus the assignment calls for. Each item carries a `votes` count we
 * use as the corpus weight, mirroring how we'd use Reddit upvotes.
 *
 * Used as the primary text source because Reddit's public JSON now
 * blocks non-OAuth bots aggressively (403s from data-center IPs).
 */

export interface NewsItem {
  id: string;
  title: string;
  body: string;
  source: string;
  url: string;
  publishedAt: number; // unix seconds
  votes: number;
  categories: string[];
}

interface CacheEntry { ts: number; data: NewsItem[] }
const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 10 * 60 * 1000;

const USER_AGENT = 'CoinWiseAI/1.0';

const COIN_TO_CATEGORY: Record<string, string> = {
  BTC: 'BTC', ETH: 'ETH', SOL: 'Solana', BNB: 'BNB', XRP: 'XRP',
  DOGE: 'Doge', ADA: 'ADA', AVAX: 'Avax', LINK: 'Chainlink',
  DOT: 'Polkadot', SHIB: 'SHIB', NEAR: 'Near', ARB: 'Arbitrum', OP: 'OP',
};

async function fetchPage(category?: string): Promise<NewsItem[]> {
  const url = new URL('https://min-api.cryptocompare.com/data/v2/news/');
  url.searchParams.set('lang', 'EN');
  if (category) url.searchParams.set('categories', category);
  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`cryptocompare_${res.status}`);
  const json = (await res.json()) as { Data?: any[] };
  return (json.Data || []).map((d): NewsItem => ({
    id: String(d.id),
    title: d.title || '',
    body: (d.body || '').slice(0, 400),
    source: d.source_info?.name || d.source || 'unknown',
    url: d.url || d.guid || '',
    publishedAt: Number(d.published_on) || 0,
    votes: Number(d.upvotes) || 0,
    categories: typeof d.categories === 'string' ? d.categories.split('|').filter(Boolean) : [],
  }));
}

export async function collectNewsForSymbol(symbol: string): Promise<{
  posts: NewsItem[];
  sources: string[];
  errors: string[];
}> {
  const base = symbol.replace(/USDT$|USD$/i, '').toUpperCase();
  const category = COIN_TO_CATEGORY[base];
  const errors: string[] = [];
  const sources: string[] = [];

  // 1. Per-coin filtered feed (when supported).
  let coinSpecific: NewsItem[] = [];
  if (category) {
    const key = `cc:cat:${category}`;
    const hit = CACHE.get(key);
    if (hit && Date.now() - hit.ts < TTL_MS) coinSpecific = hit.data;
    else {
      try {
        coinSpecific = await fetchPage(category);
        CACHE.set(key, { ts: Date.now(), data: coinSpecific });
        sources.push(`cryptocompare/news?categories=${category} (n=${coinSpecific.length})`);
      } catch (e) {
        errors.push(`cryptocompare:${category}: ${(e as Error).message}`);
      }
    }
    if (coinSpecific.length && !sources.length) {
      sources.push(`cryptocompare/news?categories=${category} (n=${coinSpecific.length}, cached)`);
    }
  }

  // 2. General feed, post-filtered by symbol mention.
  let general: NewsItem[] = [];
  const key = 'cc:general';
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS) general = hit.data;
  else {
    try {
      general = await fetchPage();
      CACHE.set(key, { ts: Date.now(), data: general });
    } catch (e) {
      errors.push(`cryptocompare:general: ${(e as Error).message}`);
    }
  }
  const re = new RegExp(`\\b${base}\\b|\\$${base}\\b|${COIN_TO_CATEGORY[base] || '__nope__'}`, 'i');
  const generalMatched = general.filter((p) => re.test(p.title) || re.test(p.body));
  if (generalMatched.length) {
    sources.push(`cryptocompare/news (general filtered=${generalMatched.length}/${general.length})`);
  }

  // Merge + dedupe by id, sort by votes-then-recency.
  const dedup = new Map<string, NewsItem>();
  for (const p of [...coinSpecific, ...generalMatched]) dedup.set(p.id, p);
  const posts = Array.from(dedup.values()).sort((a, b) =>
    b.votes - a.votes || b.publishedAt - a.publishedAt,
  );

  return { posts, sources, errors };
}

export async function pingCryptoCompareNews(): Promise<{ ok: boolean; latencyMs: number; sample?: number; error?: string }> {
  const t0 = Date.now();
  try {
    const items = await fetchPage();
    return { ok: items.length > 0, latencyMs: Date.now() - t0, sample: items.length };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - t0, error: (e as Error).message };
  }
}
