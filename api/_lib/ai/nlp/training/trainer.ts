/**
 * Multinomial Naive Bayes — train / evaluate / persist.
 *
 * Reference: Manning, Raghavan & Schütze, "Introduction to Information
 * Retrieval", Ch. 13 (the standard university-course NLP classifier).
 *
 * The model assumes that for a document d in class c, the probability is:
 *   P(c | d) ∝ P(c) · Π_{t in d} P(t | c)^{f(t,d)}
 *
 * With add-α Laplace smoothing:
 *   P(t | c) = (count(t, c) + α) / (Σ_{t'} count(t', c) + α · |V|)
 *
 * We work in log space to avoid float underflow on long documents:
 *   log P(c | d) = log P(c) + Σ_t f(t, d) · log P(t | c)
 *
 * Pre-processing (the "feature pipeline" the assignment asks you to name):
 *   1. lowercase + URL strip
 *   2. tokenize on word boundaries (keep crypto tickers and rocket emoji)
 *   3. drop English stopwords  (40 words, standard NLTK-lite list)
 *   4. drop tokens of length < 2 or length > 20
 *
 * No external ML library is used — the algorithm is implemented from
 * scratch in pure TypeScript to match the course curriculum.
 */

import { DATASET, LabeledDoc, SentimentClass } from './dataset';

export type { SentimentClass, LabeledDoc };

// ─── Pre-processing ───────────────────────────────────────────────

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall',
  'should', 'can', 'could', 'may', 'might', 'must', 'and', 'or', 'but',
  'if', 'then', 'else', 'when', 'while', 'as', 'of', 'in', 'on', 'at',
  'to', 'for', 'from', 'by', 'with', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
  'we', 'they', 'them', 'their', 'my', 'your', 'his', 'her', 'its',
  'our', 'us', 'me', 'him', 'who', 'what', 'which', 'whom', 'whose',
]);

export function preprocess(text: string): string[] {
  if (!text) return [];
  const cleaned = text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[*_`>#~]/g, ' ');
  const tokens = cleaned.match(/[a-z']+|🚀|💎|\$[a-z]{2,8}/g) || [];
  return tokens.filter((t) => t.length >= 2 && t.length <= 20 && !STOPWORDS.has(t));
}

// ─── Model shape ──────────────────────────────────────────────────

export interface NbModel {
  version: string;
  algorithm: 'multinomial-naive-bayes';
  smoothingAlpha: number;
  classes: SentimentClass[];
  classDocCount: Record<SentimentClass, number>; // for priors
  classTokenCount: Record<SentimentClass, number>; // Σ counts(t, c)
  // logLikelihood[token][class] = log P(t | c) (smoothed)
  // We persist counts and recompute log-probs at load time — but for inference speed
  // we also store the pre-computed log likelihoods so the runtime needs no math.
  logPrior: Record<SentimentClass, number>;
  logLikelihood: Record<string, Partial<Record<SentimentClass, number>>>;
  // For tokens unseen in a class, fall back to the class-specific OOV log-prob.
  oovLogLikelihood: Record<SentimentClass, number>;
  vocabulary: string[];
  trainedAt: string;
  trainSize: number;
  testSize: number;
}

// ─── Trainer ──────────────────────────────────────────────────────

export interface TrainOptions {
  alpha?: number;
  classes?: SentimentClass[];
}

export function train(trainSet: LabeledDoc[], opts: TrainOptions = {}): NbModel {
  const alpha = opts.alpha ?? 1.0;
  const classes = opts.classes ?? (['positive', 'negative', 'neutral'] as SentimentClass[]);

  const classDocCount: Record<SentimentClass, number> = { positive: 0, negative: 0, neutral: 0 };
  const counts: Record<string, Record<SentimentClass, number>> = Object.create(null);
  const classTokenCount: Record<SentimentClass, number> = { positive: 0, negative: 0, neutral: 0 };
  const vocab = new Set<string>();

  for (const d of trainSet) {
    classDocCount[d.label]++;
    const toks = preprocess(d.text);
    for (const t of toks) {
      if (!counts[t]) counts[t] = { positive: 0, negative: 0, neutral: 0 };
      counts[t][d.label]++;
      classTokenCount[d.label]++;
      vocab.add(t);
    }
  }

  const vocabSize = vocab.size;
  const totalDocs = trainSet.length;

  // Log priors P(c)
  const logPrior: Record<SentimentClass, number> = { positive: 0, negative: 0, neutral: 0 };
  for (const c of classes) {
    logPrior[c] = Math.log(classDocCount[c] / Math.max(1, totalDocs));
  }

  // Log likelihoods log P(t | c) with Laplace smoothing
  const logLikelihood: NbModel['logLikelihood'] = Object.create(null);
  for (const t of vocab) {
    const row: Partial<Record<SentimentClass, number>> = {};
    for (const c of classes) {
      const num = counts[t][c] + alpha;
      const den = classTokenCount[c] + alpha * vocabSize;
      row[c] = Math.log(num / den);
    }
    logLikelihood[t] = row;
  }
  // OOV: for a token never seen in class c at all, the smoothed prob is α / (N_c + α|V|).
  const oovLogLikelihood: Record<SentimentClass, number> = { positive: 0, negative: 0, neutral: 0 };
  for (const c of classes) {
    oovLogLikelihood[c] = Math.log(alpha / (classTokenCount[c] + alpha * vocabSize));
  }

  return {
    version: '1.0.0',
    algorithm: 'multinomial-naive-bayes',
    smoothingAlpha: alpha,
    classes,
    classDocCount,
    classTokenCount,
    logPrior,
    logLikelihood,
    oovLogLikelihood,
    vocabulary: Array.from(vocab).sort(),
    trainedAt: new Date().toISOString(),
    trainSize: trainSet.length,
    testSize: 0,
  };
}

// ─── Inference ────────────────────────────────────────────────────

export interface Prediction {
  label: SentimentClass;
  perClassLogProb: Record<SentimentClass, number>;
  perClassProb: Record<SentimentClass, number>; // normalized via softmax
  confidence: number;
  matchedFeatures: { token: string; contributions: Record<SentimentClass, number> }[];
}

export function predict(model: NbModel, text: string): Prediction {
  const tokens = preprocess(text);
  const logScore: Record<SentimentClass, number> = {
    positive: model.logPrior.positive,
    negative: model.logPrior.negative,
    neutral: model.logPrior.neutral,
  };
  const featureContribs: { token: string; contributions: Record<SentimentClass, number> }[] = [];
  for (const t of tokens) {
    const row = model.logLikelihood[t];
    const contrib: Record<SentimentClass, number> = {
      positive: row?.positive ?? model.oovLogLikelihood.positive,
      negative: row?.negative ?? model.oovLogLikelihood.negative,
      neutral: row?.neutral ?? model.oovLogLikelihood.neutral,
    };
    logScore.positive += contrib.positive;
    logScore.negative += contrib.negative;
    logScore.neutral += contrib.neutral;
    if (row) {
      // Discriminative power = max - min log-prob across classes for this token
      const vals = [contrib.positive, contrib.negative, contrib.neutral];
      const span = Math.max(...vals) - Math.min(...vals);
      featureContribs.push({ token: t, contributions: contrib });
      (featureContribs as any).__lastSpan = span;
    }
  }

  // Softmax → normalized class probabilities (numerically stable).
  const maxLog = Math.max(logScore.positive, logScore.negative, logScore.neutral);
  const expScores = {
    positive: Math.exp(logScore.positive - maxLog),
    negative: Math.exp(logScore.negative - maxLog),
    neutral: Math.exp(logScore.neutral - maxLog),
  };
  const Z = expScores.positive + expScores.negative + expScores.neutral;
  const perClassProb: Record<SentimentClass, number> = {
    positive: expScores.positive / Z,
    negative: expScores.negative / Z,
    neutral: expScores.neutral / Z,
  };
  const label: SentimentClass = (Object.keys(perClassProb) as SentimentClass[])
    .reduce((a, b) => (perClassProb[a] >= perClassProb[b] ? a : b));
  const confidence = perClassProb[label];

  // Rank features by absolute discriminative power for the predicted class.
  const topFeatures = featureContribs
    .map((f) => ({
      token: f.token,
      contributions: {
        positive: Number(f.contributions.positive.toFixed(3)),
        negative: Number(f.contributions.negative.toFixed(3)),
        neutral: Number(f.contributions.neutral.toFixed(3)),
      },
      // Boost the winning class score for ranking purposes.
      _score: f.contributions[label] - (
        label === 'positive'
          ? Math.max(f.contributions.negative, f.contributions.neutral)
          : label === 'negative'
            ? Math.max(f.contributions.positive, f.contributions.neutral)
            : Math.max(f.contributions.positive, f.contributions.negative)
      ),
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 8)
    .map(({ token, contributions }) => ({ token, contributions }));

  return {
    label,
    perClassLogProb: {
      positive: Number(logScore.positive.toFixed(4)),
      negative: Number(logScore.negative.toFixed(4)),
      neutral: Number(logScore.neutral.toFixed(4)),
    },
    perClassProb: {
      positive: Number(perClassProb.positive.toFixed(4)),
      negative: Number(perClassProb.negative.toFixed(4)),
      neutral: Number(perClassProb.neutral.toFixed(4)),
    },
    confidence: Number(confidence.toFixed(4)),
    matchedFeatures: topFeatures,
  };
}

// ─── Evaluation ───────────────────────────────────────────────────

export interface EvalMetrics {
  accuracy: number;
  perClass: Record<SentimentClass, {
    precision: number;
    recall: number;
    f1: number;
    support: number; // ground-truth docs in this class
  }>;
  macroF1: number;
  confusion: Record<SentimentClass, Record<SentimentClass, number>>; // confusion[true][pred]
  testSize: number;
  errors: { text: string; trueLabel: SentimentClass; predicted: SentimentClass; confidence: number }[];
}

export function evaluate(model: NbModel, testSet: LabeledDoc[]): EvalMetrics {
  const classes: SentimentClass[] = ['positive', 'negative', 'neutral'];
  const confusion: EvalMetrics['confusion'] = {
    positive: { positive: 0, negative: 0, neutral: 0 },
    negative: { positive: 0, negative: 0, neutral: 0 },
    neutral: { positive: 0, negative: 0, neutral: 0 },
  };
  let correct = 0;
  const errors: EvalMetrics['errors'] = [];

  for (const d of testSet) {
    const p = predict(model, d.text);
    confusion[d.label][p.label]++;
    if (p.label === d.label) correct++;
    else errors.push({ text: d.text, trueLabel: d.label, predicted: p.label, confidence: p.confidence });
  }

  const perClass: EvalMetrics['perClass'] = {
    positive: { precision: 0, recall: 0, f1: 0, support: 0 },
    negative: { precision: 0, recall: 0, f1: 0, support: 0 },
    neutral: { precision: 0, recall: 0, f1: 0, support: 0 },
  };
  let macroF1Sum = 0;
  for (const c of classes) {
    const tp = confusion[c][c];
    const fp = classes.reduce((s, c2) => s + (c2 === c ? 0 : confusion[c2][c]), 0);
    const fn = classes.reduce((s, c2) => s + (c2 === c ? 0 : confusion[c][c2]), 0);
    const support = tp + fn;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = support > 0 ? tp / support : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    perClass[c] = {
      precision: Number(precision.toFixed(4)),
      recall: Number(recall.toFixed(4)),
      f1: Number(f1.toFixed(4)),
      support,
    };
    macroF1Sum += f1;
  }

  return {
    accuracy: Number((correct / Math.max(1, testSet.length)).toFixed(4)),
    perClass,
    macroF1: Number((macroF1Sum / classes.length).toFixed(4)),
    confusion,
    testSize: testSet.length,
    errors,
  };
}

// ─── Stratified split ─────────────────────────────────────────────

/**
 * Deterministic stratified shuffle-split. Within each class, shuffle with a
 * seeded RNG so the same dataset always yields the same train/test buckets
 * — important for reproducible eval metrics across reruns.
 */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function stratifiedSplit(
  data: LabeledDoc[],
  testFrac = 0.2,
  seed = 42,
): { train: LabeledDoc[]; test: LabeledDoc[] } {
  const rnd = mulberry32(seed);
  const byClass: Record<SentimentClass, LabeledDoc[]> = { positive: [], negative: [], neutral: [] };
  for (const d of data) byClass[d.label].push(d);
  const train: LabeledDoc[] = [];
  const test: LabeledDoc[] = [];
  for (const c of Object.keys(byClass) as SentimentClass[]) {
    const arr = byClass[c].slice();
    // Fisher-Yates with seeded RNG
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const cut = Math.max(1, Math.round(arr.length * testFrac));
    test.push(...arr.slice(0, cut));
    train.push(...arr.slice(cut));
  }
  return { train, test };
}

// ─── Convenience: full training pipeline ──────────────────────────

export function trainAndEvaluate(
  data: LabeledDoc[] = DATASET,
  opts: { alpha?: number; testFrac?: number; seed?: number } = {},
): { model: NbModel; metrics: EvalMetrics; trainSet: LabeledDoc[]; testSet: LabeledDoc[] } {
  const { train: trainSet, test: testSet } = stratifiedSplit(
    data, opts.testFrac ?? 0.2, opts.seed ?? 42,
  );
  const model = train(trainSet, { alpha: opts.alpha ?? 1.0 });
  model.testSize = testSet.length;
  const metrics = evaluate(model, testSet);
  return { model, metrics, trainSet, testSet };
}
