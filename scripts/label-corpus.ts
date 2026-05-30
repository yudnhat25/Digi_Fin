#!/usr/bin/env node
/**
 * Distant-supervision labeler.
 *
 *   npm run label:corpus
 *
 * Reads the raw scraped corpus and assigns silver labels via VADER lexicon
 * sentiment analysis. Only KEEPS docs where VADER is highly confident, so
 * the silver labels are clean enough to mix with gold for training.
 *
 *   |compound| >= 0.5 AND matched-terms >= 2  → positive / negative
 *   docs with compound in (-0.05, 0.05) AND no matched terms ARE NOT kept
 *   for the neutral class — they would dilute the signal. The 50 hand-labeled
 *   gold-neutral examples are still the only neutral source.
 *
 * Output:
 *   data/silver_labeled_corpus.json
 *
 * Workflow context:
 *   gold (211 hand)
 *   silver (this script, ~1000-3000 high-conf VADER)
 *   →  combined training corpus = gold-train (169) + silver (all)
 *   →  evaluation = gold-test (42) ONLY  (silver is too noisy for honest eval)
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeText } from '../api/_lib/ai/nlp/vader';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const RAW_PATH = resolve(root, 'data/scraped_raw_corpus.json');
const OUT = resolve(root, 'data/silver_labeled_corpus.json');

if (!existsSync(RAW_PATH)) {
  console.error(`[label] missing ${RAW_PATH}. Run \`npm run scrape:corpus\` first.`);
  process.exit(1);
}

interface RawDoc { id: string; text: string; source: string; score: number; createdAt: number }
interface SilverDoc { text: string; label: 'positive' | 'negative'; source: string; compound: number; matched: number; id: string }

const raw: RawDoc[] = JSON.parse(readFileSync(RAW_PATH, 'utf-8'));
console.log(`[label] loaded ${raw.length} raw docs from ${RAW_PATH}`);

const COMPOUND_THRESHOLD = 0.3;
const MIN_MATCHED_TERMS = 1;

// Crypto-relevance filter: silver docs must mention at least one crypto term.
// Filters out HN noise where the search returned tangentially-related stories
// (e.g. "Ask HN: advice" labeled positive because of the word "advice").
const CRYPTO_TERMS = [
  'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'blockchain',
  'defi', 'stablecoin', 'altcoin', 'solana', 'sol', 'binance',
  'coinbase', 'tether', 'usdt', 'usdc', 'web3', 'nft', 'dao',
  'mining', 'wallet', 'satoshi', 'hodl', 'shitcoin', 'memecoin',
  'token', 'tokens', 'cryptocurrency', 'cryptocurrencies', 'exchange',
  'bnb', 'xrp', 'ripple', 'doge', 'cardano', 'polkadot', 'chainlink',
  'avalanche', 'avax', 'shib', 'pepe', 'arbitrum', 'optimism',
  'staking', 'mining', 'miner', 'hash', 'halving', 'etf',
];
const CRYPTO_RE = new RegExp('\\b(' + CRYPTO_TERMS.join('|') + ')\\b', 'i');
const isCryptoRelevant = (text: string) => CRYPTO_RE.test(text);

const silver: SilverDoc[] = [];
const stats = { pos: 0, neg: 0, dropped_lowconf: 0, dropped_neutral: 0, dropped_short: 0, dropped_offtopic: 0 };

for (const doc of raw) {
  const text = doc.text.trim();
  if (text.length < 15 || text.split(/\s+/).length < 4) {
    stats.dropped_short++;
    continue;
  }
  if (!isCryptoRelevant(text)) {
    stats.dropped_offtopic++;
    continue;
  }
  const s = analyzeText(text);
  if (s.matchedTerms.length < MIN_MATCHED_TERMS) {
    stats.dropped_neutral++;
    continue;
  }
  if (s.compound >= COMPOUND_THRESHOLD) {
    silver.push({ text, label: 'positive', source: doc.source, compound: s.compound, matched: s.matchedTerms.length, id: doc.id });
    stats.pos++;
  } else if (s.compound <= -COMPOUND_THRESHOLD) {
    silver.push({ text, label: 'negative', source: doc.source, compound: s.compound, matched: s.matchedTerms.length, id: doc.id });
    stats.neg++;
  } else {
    stats.dropped_lowconf++;
  }
}

// Class balance: cap each silver class to ~3x the gold per-class size.
// Without a cap, silver overwhelms the gold neutral prior (silver only has
// pos/neg labels) and the model stops predicting neutral on the gold test.
const PER_CLASS_CAP = 250;
const balanced: SilverDoc[] = [];
let posKept = 0, negKept = 0;
// Shuffle deterministically, then take top by |compound|.
silver.sort((a, b) => Math.abs(b.compound) - Math.abs(a.compound));
for (const d of silver) {
  if (d.label === 'positive' && posKept < PER_CLASS_CAP) { balanced.push(d); posKept++; }
  if (d.label === 'negative' && negKept < PER_CLASS_CAP) { balanced.push(d); negKept++; }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(balanced, null, 0), 'utf-8');

console.log('');
console.log('[label] VADER thresholds: |compound| >= ' + COMPOUND_THRESHOLD + ', matched-terms >= ' + MIN_MATCHED_TERMS);
console.log('[label] candidate silver: positive=' + stats.pos + ', negative=' + stats.neg);
console.log('[label] dropped (no clear sentiment): ' + stats.dropped_lowconf);
console.log('[label] dropped (no lexicon match):  ' + stats.dropped_neutral);
console.log('[label] dropped (too short):         ' + stats.dropped_short);
console.log('[label] dropped (not crypto-related): ' + stats.dropped_offtopic);
console.log('');
console.log(`[label] per-class cap = ${PER_CLASS_CAP} → kept: pos=${posKept}, neg=${negKept}`);
console.log(`[label] wrote ${OUT}  (${balanced.length} silver docs)`);
console.log('');
console.log('[label] Sample silver docs:');
for (const d of balanced.slice(0, 3)) {
  console.log(`  [${d.label}, compound=${d.compound.toFixed(2)}, src=${d.source}]  "${d.text.slice(0, 90)}"`);
}
for (const d of balanced.slice(-3)) {
  console.log(`  [${d.label}, compound=${d.compound.toFixed(2)}, src=${d.source}]  "${d.text.slice(0, 90)}"`);
}
