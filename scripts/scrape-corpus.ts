#!/usr/bin/env node
/**
 * Scrape a large crypto-text corpus for distant-supervision training.
 *
 *   npm run scrape:corpus
 *
 * Sources (all public, no auth):
 *   1. Hacker News (Algolia search)  — ~17 keywords × pages
 *   2. CoinDesk RSS                    — recent headlines
 *   3. Cointelegraph RSS               — recent headlines
 *   4. Decrypt RSS                     — recent headlines
 *
 * Output:
 *   data/scraped_raw_corpus.json  — array of { id, text, source, score, createdAt }
 *
 * The next step (label-corpus.ts) applies VADER auto-labeling with a high
 * confidence threshold to produce silver-labeled training data.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const OUT = resolve(root, 'data/scraped_raw_corpus.json');

const USER_AGENT = 'CoinWiseAI/1.0 (crypto sentiment research)';

// ─── Source 1: Hacker News via Algolia ────────────────────────────

const HN_KEYWORDS = [
  'bitcoin', 'ethereum', 'crypto', 'cryptocurrency', 'blockchain',
  'defi', 'stablecoin', 'altcoin', 'solana', 'binance', 'coinbase',
  'crypto regulation', 'crypto exchange', 'crypto hack', 'bitcoin mining',
  'crypto bull', 'crypto bear', 'web3', 'nft', 'dao',
];
const HN_PAGES_PER_KW = 8;   // 50 hits/page → up to 400/kw/endpoint
const HN_ENDPOINTS: ('search' | 'search_by_date')[] = ['search', 'search_by_date'];

async function fetchHn(endpoint: string, query: string, page: number) {
  const url = `https://hn.algolia.com/api/v1/${endpoint}` +
    `?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=50&page=${page}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`HN ${res.status} on "${query}" p${page}`);
  const json = (await res.json()) as { hits?: any[] };
  return (json.hits || [])
    .filter((h) => h?.title && typeof h.title === 'string' && h.title.length >= 12)
    .map((h) => ({
      id: `hn:${h.objectID}`,
      text: String(h.title).trim(),
      source: 'hn',
      score: Number(h.points) || 0,
      numComments: Number(h.num_comments) || 0,
      createdAt: Number(h.created_at_i) || 0,
      query,
    }));
}

async function scrapeHn(): Promise<any[]> {
  const all: any[] = [];
  const errors: string[] = [];
  let tasksDone = 0;
  const totalTasks = HN_KEYWORDS.length * HN_ENDPOINTS.length * HN_PAGES_PER_KW;
  process.stdout.write(`[scrape] HN (${HN_KEYWORDS.length} keywords × ${HN_ENDPOINTS.length} endpoints × ${HN_PAGES_PER_KW} pages = ${totalTasks} requests)\n`);

  for (const kw of HN_KEYWORDS) {
    // Polite serial within a keyword; parallel across pages would tickle Algolia's rate limit on bursty traffic.
    for (const endpoint of HN_ENDPOINTS) {
      for (let page = 0; page < HN_PAGES_PER_KW; page++) {
        try {
          const items = await fetchHn(endpoint, kw, page);
          all.push(...items);
          if (items.length < 50) {
            tasksDone += (HN_PAGES_PER_KW - page);
            break; // no more results
          }
        } catch (e) {
          errors.push(`${endpoint}:${kw}:${page} → ${(e as Error).message}`);
        }
        tasksDone++;
        if (tasksDone % 25 === 0) process.stdout.write(`  ${tasksDone}/${totalTasks} (collected ${all.length})\n`);
      }
    }
  }
  process.stdout.write(`[scrape] HN done — ${all.length} hits, ${errors.length} errors\n`);
  if (errors.length) process.stdout.write(`  first error: ${errors[0]}\n`);
  return all;
}

// ─── Source 2: RSS feeds ───────────────────────────────────────────

const RSS_FEEDS: { url: string; source: string }[] = [
  { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', source: 'coindesk' },
  { url: 'https://cointelegraph.com/rss', source: 'cointelegraph' },
  { url: 'https://decrypt.co/feed', source: 'decrypt' },
  { url: 'https://bitcoinmagazine.com/.rss/full/', source: 'bitcoinmagazine' },
  { url: 'https://www.theblock.co/rss.xml', source: 'theblock' },
];

function cdata(s: string): string {
  return s.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim();
}

async function fetchRss(url: string, source: string): Promise<any[]> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/rss+xml, application/xml, text/xml, */*' },
  });
  if (!res.ok) throw new Error(`RSS ${source} ${res.status}`);
  const xml = await res.text();
  const items: any[] = [];

  // Match both <item> (RSS 2.0) and <entry> (Atom) blocks.
  const re = /<(item|entry)\b[\s\S]*?<\/\1>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const block = m[0];
    const titleM = block.match(/<title[^>]*>([\s\S]*?)<\/title>/);
    const linkM = block.match(/<link[^>]*>([\s\S]*?)<\/link>/) || block.match(/<link[^>]*href=["']([^"']+)["']/);
    const dateM = block.match(/<(?:pubDate|updated|published|dc:date)[^>]*>([\s\S]*?)<\/(?:pubDate|updated|published|dc:date)>/);
    if (!titleM) continue;
    const title = cdata(titleM[1]);
    if (title.length < 12) continue;
    const link = linkM ? cdata(linkM[1]) : '';
    const ts = dateM ? Math.floor(new Date(cdata(dateM[1])).getTime() / 1000) || 0 : 0;
    items.push({
      id: `${source}:${link || title.slice(0, 80)}`,
      text: title,
      source,
      score: 0,
      numComments: 0,
      createdAt: ts,
      query: null,
    });
  }
  return items;
}

async function scrapeRss(): Promise<any[]> {
  const all: any[] = [];
  for (const feed of RSS_FEEDS) {
    try {
      const items = await fetchRss(feed.url, feed.source);
      process.stdout.write(`[scrape] RSS ${feed.source.padEnd(16)} → ${items.length} items\n`);
      all.push(...items);
    } catch (e) {
      process.stdout.write(`[scrape] RSS ${feed.source.padEnd(16)} → FAILED (${(e as Error).message})\n`);
    }
  }
  return all;
}

// ─── Main ─────────────────────────────────────────────────────────

const t0 = Date.now();
const [hn, rss] = await Promise.all([scrapeHn(), scrapeRss()]);
const combined = [...hn, ...rss];

// Dedupe by id.
const seenIds = new Set<string>();
const seenTexts = new Set<string>();
const unique = combined.filter((d) => {
  if (seenIds.has(d.id)) return false;
  seenIds.add(d.id);
  // Also dedupe by normalized text (case-insensitive, whitespace-collapsed).
  const norm = d.text.toLowerCase().replace(/\s+/g, ' ').trim();
  if (seenTexts.has(norm)) return false;
  seenTexts.add(norm);
  return true;
});

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(unique, null, 0), 'utf-8');

const bySource = unique.reduce(
  (m: Record<string, number>, d) => ((m[d.source] = (m[d.source] || 0) + 1), m),
  {} as Record<string, number>,
);
console.log('');
console.log(`[scrape] wrote ${OUT}`);
console.log(`[scrape] total unique: ${unique.length}  (raw: ${combined.length}, dups removed: ${combined.length - unique.length})`);
console.log(`[scrape] by source: ${Object.entries(bySource).map(([k, v]) => `${k}=${v}`).join(', ')}`);
console.log(`[scrape] elapsed: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
