#!/usr/bin/env node
/**
 * Export the TS labeled dataset to JSON so the Jupyter notebook (Python)
 * and the TypeScript trainer share a single source of truth.
 *
 *   npm run dataset:export
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DATASET } from '../api/_lib/ai/nlp/training/dataset';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const out = resolve(root, 'data/crypto_sentiment_dataset.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(DATASET, null, 2), 'utf-8');

const byClass = DATASET.reduce(
  (m: Record<string, number>, d) => ((m[d.label] = (m[d.label] || 0) + 1), m),
  {} as Record<string, number>,
);
console.log(`[export-dataset] wrote ${out}`);
console.log(`[export-dataset] ${DATASET.length} docs: pos=${byClass.positive} neg=${byClass.negative} neu=${byClass.neutral}`);
