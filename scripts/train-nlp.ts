#!/usr/bin/env node
/**
 * DEPRECATED — the production model is now trained in Python (scikit-learn) so
 * we can compare several algorithms and pick the best, then export the winner
 * into the TS log-linear runtime.
 *
 *   npm run train:nlp     → python scripts/build_dataset.py
 *                           python scripts/train_model.py   (writes model.ts + model-metrics.ts)
 *   npm run verify:nlp    → npx tsx scripts/verify-model.ts (TS reproduces Python exactly)
 *
 * This legacy TypeScript Naive-Bayes trainer is kept only for reference. It is
 * intentionally a no-op so it can never clobber the Python-exported model.ts
 * with the old unigram-only format.
 */
console.log(
  '[train-nlp] DEPRECATED. The model is trained in Python now:\n' +
  '  npm run train:nlp   (runs scripts/build_dataset.py + scripts/train_model.py)\n' +
  '  npm run verify:nlp  (checks the TS runtime matches the Python model)\n' +
  'See notebooks/train_sentiment_model.ipynb for the full comparison.',
);
