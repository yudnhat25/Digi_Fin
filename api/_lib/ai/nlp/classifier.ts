/**
 * Production classifier.
 *
 * Loads the trained Multinomial Naive Bayes model from model.ts (generated
 * by `npm run train:nlp`) and exposes:
 *
 *   classify(text)            — single-document inference
 *   classifyCorpus(docs)      — corpus inference, returns aggregate sentiment
 *   getModelInfo()            — metadata + eval metrics for UI display
 *
 * The aggregate "compound" score is the corpus-level analog of VADER's
 * compound: it maps the trained model's probability distribution into a
 * scalar in [-1, +1] so it slots directly into the existing fusion stage of
 * the pipeline.
 *
 *   compound = P(positive) − P(negative)   (per-doc)
 *
 * For a corpus we take the weight-by-engagement mean of per-doc compound.
 */

import { MODEL } from './model';
import { MODEL_METRICS } from './model-metrics';
import { predict, type Prediction, type SentimentClass } from './training/trainer';

export { MODEL, MODEL_METRICS };
export type { Prediction, SentimentClass };

export interface DocClassification {
  label: SentimentClass;
  confidence: number;
  compound: number;       // ∈ [-1, +1]: P(pos) − P(neg)
  perClassProb: Record<SentimentClass, number>;
  matchedFeatures: Prediction['matchedFeatures'];
}

export function classify(text: string): DocClassification {
  const p = predict(MODEL, text);
  return {
    label: p.label,
    confidence: p.confidence,
    compound: Number((p.perClassProb.positive - p.perClassProb.negative).toFixed(4)),
    perClassProb: p.perClassProb,
    matchedFeatures: p.matchedFeatures,
  };
}

export interface CorpusClassification {
  docCount: number;
  matchedDocCount: number; // docs that triggered at least one lexicon-token match
  weightedCompound: number;
  perClassShare: Record<SentimentClass, number>;
  label: SentimentClass;
  perDoc: DocClassification[];
}

export function classifyCorpus(
  docs: { text: string; weight?: number }[],
): CorpusClassification {
  if (docs.length === 0) {
    return {
      docCount: 0, matchedDocCount: 0, weightedCompound: 0,
      perClassShare: { positive: 0, negative: 0, neutral: 1 },
      label: 'neutral', perDoc: [],
    };
  }
  const perDoc = docs.map((d) => classify(d.text));
  const matched = perDoc.filter((d) => d.matchedFeatures.length > 0);
  const wSum = docs.reduce((s, d, i) => s + (matched.includes(perDoc[i]) ? Math.max(1, d.weight ?? 1) : 0), 0) || 1;
  const weightedCompound = docs.reduce(
    (s, d, i) => matched.includes(perDoc[i]) ? s + perDoc[i].compound * Math.max(1, d.weight ?? 1) : s,
    0,
  ) / wSum;

  const counts = { positive: 0, negative: 0, neutral: 0 } as Record<SentimentClass, number>;
  for (const d of matched.length ? matched : perDoc) counts[d.label]++;
  const total = (matched.length || perDoc.length);
  const perClassShare: Record<SentimentClass, number> = {
    positive: Number((counts.positive / total).toFixed(3)),
    negative: Number((counts.negative / total).toFixed(3)),
    neutral: Number((counts.neutral / total).toFixed(3)),
  };
  const label: SentimentClass = (Object.keys(counts) as SentimentClass[])
    .reduce((a, b) => (counts[a] >= counts[b] ? a : b));

  return {
    docCount: docs.length,
    matchedDocCount: matched.length,
    weightedCompound: Number(weightedCompound.toFixed(4)),
    perClassShare,
    label,
    perDoc,
  };
}

export function getModelInfo() {
  return {
    algorithm: MODEL.algorithm,
    version: MODEL.version,
    smoothingAlpha: MODEL.smoothingAlpha,
    classes: MODEL.classes,
    vocabSize: MODEL.vocabulary.length,
    trainSize: MODEL.trainSize,
    testSize: MODEL.testSize,
    trainedAt: MODEL.trainedAt,
    classDistribution: MODEL.classDocCount,
    metrics: MODEL_METRICS,
  };
}
