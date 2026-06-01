/**
 * REAL data source — aggregated crypto-news RSS feeds (free, no API key).
 *
 * CryptoCompare's news endpoint started requiring an auth key, so the
 * dashboard "Market News" widget reads directly from publisher RSS feeds
 * instead. Fetching happens server-side (this module runs inside the Hono
 * OpenAPI server / Vercel function) which sidesteps browser CORS.
 *
 * Feeds are RSS 2.0 (<item><title><link><pubDate>). We parse with light
 * regex (no XML dependency), decode HTML entities, dedupe by URL, tag each
 * headline with a coin/topic, and sort newest-first. Results cached 10 min.
 */

export interface NewsHeadline {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: number; // unix seconds
  tag: string;         // BTC | ETH | SOL | DEFI | MACRO | NFT | NEWS …
  tagColor: string;    // tailwind color name (safelisted in index.html)
}

interface Feed { source: string; url: string }

// All free, no key required, verified reachable. CoinDesk is omitted because
// its feed now 308-redirects to a host that blocks server fetches.
const FEEDS: Feed[] = [
  { source: 'Cointelegraph', url: 'https://cointelegraph.com/rss' },
  { source: 'Decrypt',       url: 'https://decrypt.co/feed' },
  { source: 'CryptoSlate',   url: 'https://cryptoslate.com/feed/' },
  { source: 'Bitcoinist',    url: 'https://bitcoinist.com/feed/' },
];

const TTL_MS = 5 * 60 * 1000; // 5 min — fresh enough for a news widget, polite to feeds
let CACHE: { ts: number; data: NewsHeadline[] } | null = null;

// ─── HTML-entity decoder (covers what RSS titles actually emit) ───
function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')              // strip stray inline tags
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extract(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? m[1].trim() : '';
}

// ─── Topic tagging by keyword on the title ───
const TAG_RULES: { tag: string; tagColor: string; re: RegExp }[] = [
  { tag: 'BTC',  tagColor: 'amber',  re: /\bbitcoin\b|\bbtc\b/i },
  { tag: 'ETH',  tagColor: 'blue',   re: /\bethereum\b|\bether\b|\beth\b/i },
  { tag: 'SOL',  tagColor: 'cyan',   re: /\bsolana\b|\bsol\b/i },
  { tag: 'XRP',  tagColor: 'sky',    re: /\bxrp\b|\bripple\b/i },
  { tag: 'BNB',  tagColor: 'orange', re: /\bbinance\b|\bbnb\b/i },
  { tag: 'DOGE', tagColor: 'yellow', re: /\bdogecoin\b|\bdoge\b/i },
  { tag: 'DEFI', tagColor: 'violet', re: /\bdefi\b|\baave\b|\buniswap\b|\bdex\b|\blending\b|\bstaking\b|\byield\b/i },
  { tag: 'NFT',  tagColor: 'pink',   re: /\bnft\b/i },
  { tag: 'MACRO', tagColor: 'emerald', re: /\bfed\b|\bfomc\b|\bsec\b|\betf\b|\bregulat|\binflation\b|\brate cut\b|\binterest rate\b|\bgovernment\b|\blawsuit\b/i },
];

function tagFor(title: string): { tag: string; tagColor: string } {
  for (const r of TAG_RULES) if (r.re.test(title)) return { tag: r.tag, tagColor: r.tagColor };
  return { tag: 'NEWS', tagColor: 'slate' };
}

function parseFeed(xml: string, source: string): NewsHeadline[] {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  const out: NewsHeadline[] = [];
  for (const block of items) {
    const title = decodeEntities(extract(block, 'title'));
    const link = decodeEntities(extract(block, 'link') || extract(block, 'guid'));
    const pub = extract(block, 'pubDate');
    if (!title || !link) continue;
    const ts = pub ? Math.floor(new Date(pub).getTime() / 1000) : 0;
    const { tag, tagColor } = tagFor(title);
    out.push({ id: link, title, source, url: link, publishedAt: ts || 0, tag, tagColor });
  }
  return out;
}

async function fetchFeed(feed: Feed): Promise<NewsHeadline[]> {
  const res = await fetch(feed.url, {
    headers: { 'User-Agent': 'CoinWiseAI/1.0', Accept: 'application/rss+xml, application/xml, text/xml' },
  });
  if (!res.ok) throw new Error(`${feed.source}_${res.status}`);
  const xml = await res.text();
  return parseFeed(xml, feed.source);
}

export async function fetchLatestNews(limit = 8): Promise<NewsHeadline[]> {
  if (CACHE && Date.now() - CACHE.ts < TTL_MS) return CACHE.data.slice(0, limit);

  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const merged: NewsHeadline[] = [];
  for (const r of results) if (r.status === 'fulfilled') merged.push(...r.value);

  // Dedupe by URL, then by normalized title (different outlets, same story).
  const seen = new Set<string>();
  const deduped: NewsHeadline[] = [];
  for (const n of merged) {
    const key = n.url.toLowerCase();
    const tkey = n.title.toLowerCase().slice(0, 60);
    if (seen.has(key) || seen.has(tkey)) continue;
    seen.add(key); seen.add(tkey);
    deduped.push(n);
  }

  deduped.sort((a, b) => b.publishedAt - a.publishedAt);

  // Only cache when at least one feed succeeded — avoids caching an empty list
  // through a transient outage.
  if (deduped.length) CACHE = { ts: Date.now(), data: deduped };
  return deduped.slice(0, limit);
}

export async function pingCryptoNewsRss(): Promise<{ ok: boolean; latencyMs: number; sample?: number; error?: string }> {
  const t0 = Date.now();
  try {
    const items = await fetchLatestNews(50);
    return { ok: items.length > 0, latencyMs: Date.now() - t0, sample: items.length };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - t0, error: (e as Error).message };
  }
}
