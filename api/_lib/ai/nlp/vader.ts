/**
 * VADER-style sentiment analyzer.
 *
 * Implementation of the Valence Aware Dictionary and sEntiment Reasoner
 * (Hutto & Gilbert, 2014) — a lexicon + grammatical-rules NLP technique
 * widely taught in fintech / social analytics courses.
 *
 * Algorithm:
 *   1. Tokenize text → tokens.
 *   2. For each token with a lexicon score:
 *        a. Apply booster multiplier from the previous 1-2 tokens.
 *        b. Apply negation flip if any negation in the previous 3 tokens.
 *        c. Apply ALL-CAPS amplification (+0.733 to magnitude).
 *        d. Apply exclamation-mark boost (+0.292 per !, capped at 4).
 *   3. Sum all valences → compound raw score.
 *   4. Normalize via VADER's formula: x / sqrt(x² + α)  with α = 15.
 *   5. Output classification:
 *        compound ≥  0.50 → 'Euphoric'
 *        compound ≥  0.05 → 'Bullish'
 *        compound > -0.05 → 'Neutral'
 *        compound > -0.50 → 'Bearish'
 *        else             → 'Capitulation'
 */

import { LEXICON, NEGATIONS, NEGATION_WINDOW, NEGATION_DAMP, BOOSTERS, tokenize } from './lexicon';

const ALPHA = 15;
const EXCL_BOOST = 0.292;
const QUESTION_DAMP = 0.18; // questions are slightly less assertive
const ALL_CAPS_INCR = 0.733;

export type SentimentLabel = 'Capitulation' | 'Bearish' | 'Neutral' | 'Bullish' | 'Euphoric';

export interface DocumentSentiment {
  compound: number;        // ∈ [-1, +1] normalized
  posValence: number;      // sum of positive valences
  negValence: number;      // sum of negative valences (positive number)
  neuTokens: number;       // count of neutral tokens
  matchedTerms: { token: string; valence: number }[]; // for explainability
  label: SentimentLabel;
}

function isAllCaps(raw: string): boolean {
  return raw.length >= 3 && raw === raw.toUpperCase() && /[A-Z]/.test(raw);
}

function classify(compound: number): SentimentLabel {
  if (compound >= 0.5) return 'Euphoric';
  if (compound >= 0.05) return 'Bullish';
  if (compound > -0.05) return 'Neutral';
  if (compound > -0.5) return 'Bearish';
  return 'Capitulation';
}

export function analyzeText(text: string): DocumentSentiment {
  if (!text) {
    return { compound: 0, posValence: 0, negValence: 0, neuTokens: 0, matchedTerms: [], label: 'Neutral' };
  }
  const tokens = tokenize(text);
  // Pre-compute uppercase positions on the ORIGINAL words for caps detection.
  const rawWords = text.split(/\s+/);
  const capsCount = rawWords.filter(isAllCaps).length;
  const isLoudDoc = capsCount >= 2 && capsCount / Math.max(1, rawWords.length) > 0.15;

  const exclCount = Math.min(4, (text.match(/!/g) || []).length);
  const exclBoostTotal = exclCount * EXCL_BOOST;
  const isQuestion = /\?\s*$/.test(text);

  let posV = 0;
  let negV = 0;
  let neutralTokens = 0;
  const matched: { token: string; valence: number }[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    let valence = LEXICON[tok];
    if (valence === undefined) { neutralTokens++; continue; }

    // Booster from the 2 preceding tokens (closer = stronger weight).
    for (let j = 1; j <= 2 && i - j >= 0; j++) {
      const prev = tokens[i - j];
      const booster = BOOSTERS[prev];
      if (booster !== undefined) {
        // Closer booster has full effect; further one half effect.
        const factor = j === 1 ? booster : 1 + (booster - 1) * 0.5;
        valence = valence > 0 ? valence * factor : valence * factor;
      }
    }

    // Negation flip — search NEGATION_WINDOW tokens back.
    let negated = false;
    for (let j = 1; j <= NEGATION_WINDOW && i - j >= 0; j++) {
      if (NEGATIONS.has(tokens[i - j])) { negated = true; break; }
    }
    if (negated) {
      valence = -valence * NEGATION_DAMP;
    }

    // ALL-CAPS amplification (only in loud documents to avoid acronyms).
    if (isLoudDoc) {
      valence += valence > 0 ? ALL_CAPS_INCR : -ALL_CAPS_INCR;
    }

    // Exclamation-mark boost: distribute across all sentiment tokens.
    if (exclBoostTotal > 0) {
      valence += valence > 0 ? exclBoostTotal / Math.max(1, tokens.length) * tokens.length / 4 : -exclBoostTotal / Math.max(1, tokens.length) * tokens.length / 4;
    }

    if (isQuestion) valence *= (1 - QUESTION_DAMP);

    matched.push({ token: tok, valence: Number(valence.toFixed(3)) });
    if (valence >= 0) posV += valence; else negV += -valence;
  }

  const sumScore = posV - negV;
  const compound = Number((sumScore / Math.sqrt(sumScore * sumScore + ALPHA)).toFixed(4));

  return {
    compound,
    posValence: Number(posV.toFixed(3)),
    negValence: Number(negV.toFixed(3)),
    neuTokens: neutralTokens,
    matchedTerms: matched.slice(0, 12),
    label: classify(compound),
  };
}

/**
 * Aggregate sentiment across N documents weighted by per-doc signal
 * (e.g. upvotes). Returns weighted-average compound + summary stats.
 */
export interface CorpusSentiment {
  docCount: number;
  matchedDocCount: number;     // docs that had at least one lexicon hit
  weightedCompound: number;
  meanCompound: number;
  posShare: number;
  negShare: number;
  neuShare: number;
  label: SentimentLabel;
}

export function aggregateCorpus(
  docs: { text: string; weight?: number }[],
): { corpus: CorpusSentiment; perDoc: { idx: number; weight: number; sentiment: DocumentSentiment }[] } {
  const perDoc = docs.map((d, idx) => ({
    idx,
    weight: Math.max(1, d.weight ?? 1),
    sentiment: analyzeText(d.text),
  }));
  const matched = perDoc.filter((d) => d.sentiment.matchedTerms.length > 0);
  if (matched.length === 0) {
    return {
      corpus: {
        docCount: docs.length, matchedDocCount: 0,
        weightedCompound: 0, meanCompound: 0,
        posShare: 0, negShare: 0, neuShare: 1, label: 'Neutral',
      },
      perDoc,
    };
  }
  const wSum = matched.reduce((s, d) => s + d.weight, 0);
  const weightedCompound = matched.reduce((s, d) => s + d.sentiment.compound * d.weight, 0) / wSum;
  const meanCompound = matched.reduce((s, d) => s + d.sentiment.compound, 0) / matched.length;
  const posDocs = matched.filter((d) => d.sentiment.compound >= 0.05).length;
  const negDocs = matched.filter((d) => d.sentiment.compound <= -0.05).length;
  const neuDocs = matched.length - posDocs - negDocs;

  return {
    corpus: {
      docCount: docs.length,
      matchedDocCount: matched.length,
      weightedCompound: Number(weightedCompound.toFixed(4)),
      meanCompound: Number(meanCompound.toFixed(4)),
      posShare: Number((posDocs / matched.length).toFixed(3)),
      negShare: Number((negDocs / matched.length).toFixed(3)),
      neuShare: Number((neuDocs / matched.length).toFixed(3)),
      label: classify(weightedCompound),
    },
    perDoc,
  };
}
