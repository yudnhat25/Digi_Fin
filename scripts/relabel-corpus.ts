/**
 * Re-label REAL crypto text with OUR OWN sentiment engine (the production VADER),
 * deliberately IGNORING the noisy author-supplied Bullish/Bearish tags.
 *
 * Why: StockTwits self-tags reflect the poster's POSITION, not the words — e.g.
 * "Not bullish?" tagged Bullish, "$DOGE.X ?" tagged Bullish. Training on those
 * tags hurt the model. Instead we keep the real trader TEXT and assign a fresh
 * label from VADER, keeping only HIGH-CONFIDENCE calls (drop the ambiguous mid-
 * band) so the distant-supervision labels are clean.
 *
 * Sources of real text:
 *   data/stocktwits_corpus.json  (StockTwits messages — real trader language)
 *   data/scraped_raw_corpus.json (real Hacker News crypto titles)
 *
 * Output: data/relabeled_corpus.json  [{ text, label, source, compound }]
 *
 * Run: npx tsx scripts/relabel-corpus.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeText } from '../api/_lib/ai/nlp/vader';

// Raw crawls + the intermediate relabeled corpus all live under data/sources/.
const SRC = join(dirname(dirname(fileURLToPath(import.meta.url))), 'data', 'sources');
const load = (n: string) => JSON.parse(readFileSync(join(SRC, n), 'utf-8'));

// High-confidence thresholds: only commit a label when VADER is sure.
const POS_T = 0.45;   // compound >= +0.45  → positive
const NEG_T = -0.45;  // compound <= -0.45  → negative
const NEU_BAND = 0.05; // |compound| <= 0.05 → neutral (no directional valence)

function clean(text: string): string {
  return text
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/^(?:[$@][A-Za-z0-9.\-]+\s+){3,}/, '') // drop leading ticker spam
    .replace(/\s+/g, ' ')
    .trim();
}

function usable(t: string): boolean {
  const letters = (t.match(/[a-zA-Z]/g) || []).length;
  return t.length >= 12 && t.length <= 240 && letters >= 8;
}

function wordCount(t: string): number {
  return (t.toLowerCase().match(/[a-z']{2,}/g) || []).length;
}

interface Row { text: string; label: string; source: string; compound: number }

function relabel(text: string, source: string): Row | null {
  const t = clean(text);
  if (!usable(t)) return null;
  const words = wordCount(t);
  if (words < 4) return null; // need real content, not a lone ticker/emoji
  const { compound } = analyzeText(t);
  let label: string | null = null;
  if (compound >= POS_T) label = 'positive';
  else if (compound <= NEG_T) label = 'negative';
  else if (Math.abs(compound) <= NEU_BAND) {
    // neutral only if it also reads like a statement/question, not a muted opinion
    if (!/\b(buy|sell|long|short|moon|dump|pump|scam|rug|rekt)\b/i.test(t)) label = 'neutral';
  }
  if (!label) return null; // ambiguous mid-band → drop
  return { text: t, label, source, compound: Math.round(compound * 1000) / 1000 };
}

const out: Row[] = [];
const seen = new Set<string>();
function add(rows: { text?: string }[], source: string) {
  let kept = 0;
  for (const r of rows) {
    const row = relabel(r.text || '', source);
    if (!row) continue;
    const key = row.text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    kept++;
  }
  console.log(`[relabel] ${source}: kept ${kept} / ${rows.length}`);
}

add(load('stocktwits_corpus.json'), 'stocktwits-vader');
add(load('scraped_raw_corpus.json'), 'hn-vader');

const by: Record<string, number> = { positive: 0, negative: 0, neutral: 0 };
for (const r of out) by[r.label]++;
writeFileSync(join(SRC, 'relabeled_corpus.json'), JSON.stringify(out), 'utf-8');
console.log(`[relabel] wrote relabeled_corpus.json: ${out.length} rows`, by);

// ── self-test: VADER's own calls on the hard cases the model must get right ──
console.log('\n[relabel] VADER on hard probes:');
for (const t of [
  'not bullish on DOGE at all, the chart is broken',
  'dumping to buy bubble AI stocks instead',
  'this is not a scam, SOL is a solid project',
  'should I buy or wait on ETH here',
  'Bitcoin spot ETF receives official SEC approval, market rallies',
  'getting rekt, total rug pull, investors wiped out',
]) {
  const { compound, label } = analyzeText(t);
  console.log(`  ${compound >= 0 ? '+' : ''}${compound.toFixed(3)} ${label.padEnd(12)} ${t}`);
}
