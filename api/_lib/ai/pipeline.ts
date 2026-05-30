/**
 * ALT-DATA PIPELINE — the assignment's full chain in one module.
 *
 *   STAGE 1 — COLLECT
 *     real Reddit JSON  (social media sentiment, web-scraped text)
 *   + real alternative.me Fear & Greed Index (market-wide mood composite)
 *   + real CoinGecko community signals (votes, engagement, dev activity)
 *
 *   STAGE 2 — ANALYSE (AI techniques learned in course)
 *     • NLP / lexicon-based sentiment analysis (VADER-style) on Reddit text
 *     • Z-score anomaly detection on mention volume (spike alerts)
 *     • Multi-source signal fusion (weighted blend) → composite signal
 *     • Rule-based classification → BUY / HOLD / SELL with confidence
 *
 *   STAGE 3 — OUTPUT
 *     RealSentimentResult: compound ∈ [-1,1], label, drivers, spike flag,
 *     full provenance (which post drove which delta).
 *
 *   STAGE 4 — FINTECH APPLICATION
 *     - feeds into Credit Score (alt-data factor, weighted ≤120)
 *     - feeds into Fraud Shield (sentiment-contradiction rule)
 *     - feeds into AI Advisor (sentiment tilt)
 */

import { collectCorpusForSymbol, RedditPost } from './sources/reddit';
import { collectHnForSymbol, HnHit } from './sources/hackerNews';
import { fetchFearGreedReal, FearGreedReal } from './sources/fearGreed';
import { fetchCoinGecko, CoinGeckoSignals } from './sources/coingecko';
import { aggregateCorpus, analyzeText, DocumentSentiment, SentimentLabel } from './nlp/vader';
import { classifyCorpus, classify as classifyTrained, MODEL_METRICS, getModelInfo } from './nlp/classifier';

// ─── Z-score historical baseline (in-memory ring buffer per coin) ───
interface MentionSample { ts: number; count: number }
const MENTION_HISTORY = new Map<string, MentionSample[]>();
const HISTORY_MAX = 24; // last 24 samples ≈ 24 hours if hit hourly

function pushMentionSample(coin: string, count: number) {
  const arr = MENTION_HISTORY.get(coin) || [];
  arr.push({ ts: Date.now(), count });
  if (arr.length > HISTORY_MAX) arr.shift();
  MENTION_HISTORY.set(coin, arr);
}

function zScore(coin: string, current: number): { z: number; mean: number; std: number; n: number } {
  const arr = MENTION_HISTORY.get(coin) || [];
  if (arr.length < 3) return { z: 0, mean: current, std: 0, n: arr.length };
  const values = arr.map((s) => s.count);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  const z = std > 0 ? (current - mean) / std : 0;
  return { z: Number(z.toFixed(2)), mean: Math.round(mean), std: Math.round(std), n: arr.length };
}

// ─── Public types ───

export interface PerPostAnalysis {
  id: string;
  title: string;
  subreddit: string;
  ups: number;
  numComments: number;
  ageMin: number;
  url: string;
  compound: number;        // [-1, 1]
  label: SentimentLabel;
  matchedTerms: { token: string; valence: number }[];
}

export interface PipelineStage {
  name: string;
  status: 'ok' | 'partial' | 'failed';
  message: string;
  latencyMs: number;
}

export interface RealSentimentResult {
  symbol: string;
  base: string;

  // Stage 1 — provenance
  sources: { reddit: string[]; news: string[]; coinGecko: string | null; fearGreed: string | null };
  collected: {
    redditPosts: number;
    newsPosts: number;
    totalDocs: number;
    coinGeckoOk: boolean;
    fearGreedOk: boolean;
  };

  // Stage 2 — NLP
  nlp: {
    technique: 'VADER-style lexicon analyzer';
    docCount: number;
    matchedDocCount: number;
    weightedCompound: number;
    posShare: number;
    negShare: number;
    neuShare: number;
    topPositive: PerPostAnalysis[];
    topNegative: PerPostAnalysis[];
  };

  // Stage 2' — Trained Naive Bayes classifier (the AI model the assignment wants)
  mlClassifier: {
    technique: 'Multinomial Naive Bayes (trained from scratch)';
    modelTrainedAt: string;
    modelAccuracy: number;
    modelMacroF1: number;
    docCount: number;
    matchedDocCount: number;
    weightedCompound: number;
    perClassShare: { positive: number; negative: number; neutral: number };
    label: 'positive' | 'negative' | 'neutral';
    // Top examples + decisive feature tokens per class
    topPositive: { id: string; title: string; subreddit: string; ups: number; numComments: number; ageMin: number; url: string; compound: number; confidence: number; topFeatures: { token: string; positiveLogProb: number; negativeLogProb: number }[] }[];
    topNegative: { id: string; title: string; subreddit: string; ups: number; numComments: number; ageMin: number; url: string; compound: number; confidence: number; topFeatures: { token: string; positiveLogProb: number; negativeLogProb: number }[] }[];
    // Agreement with VADER (how often the two NLP techniques agree on the same doc).
    agreementWithVader: number;
  };

  // Stage 2b — anomaly
  anomaly: {
    technique: 'Z-score on mention volume';
    currentMentions: number;
    zScore: number;
    baselineMean: number;
    baselineStd: number;
    historyN: number;
    spike: boolean;
  };

  // Stage 2c — fusion
  fusion: {
    vaderWeight: number;
    naiveBayesWeight: number;
    redditWeight: number;          // legacy field kept for the UI bar chart
    coinGeckoWeight: number;
    fearGreedWeight: number;
    compositeScore: number;       // [-1, 1]
    composite0to100: number;      // for credit / UI
    label: SentimentLabel;
    confidence: number;           // 0–1
    signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' | 'NEUTRAL';
  };

  // Stage 4 — fintech application
  application: {
    creditScoreFactor: { label: string; impact: number; rationale: string };
    fraudRule: { label: string; triggered: boolean; rationale: string };
    advisorTilt: { label: string; tiltPct: number; rationale: string };
  };

  // Raw signals for transparency
  raw: {
    fearGreed: FearGreedReal | null;
    coinGecko: CoinGeckoSignals | null;
  };

  // Pipeline observability
  stages: PipelineStage[];
  generatedAt: string;
  totalLatencyMs: number;
}

// ─── Helpers ───

function compositeSignal(compound: number, confidence: number): RealSentimentResult['fusion']['signal'] {
  if (confidence < 0.3) return 'NEUTRAL';
  if (compound >= 0.5) return 'STRONG_BUY';
  if (compound >= 0.15) return 'BUY';
  if (compound <= -0.5) return 'STRONG_SELL';
  if (compound <= -0.15) return 'SELL';
  return 'HOLD';
}

function buildApplication(
  composite: number,
  spike: boolean,
  signal: RealSentimentResult['fusion']['signal'],
): RealSentimentResult['application'] {
  // Credit Score factor (alt-data): consistent positive sentiment is a
  // weak proxy for prudent behavior. Range -40 .. +60.
  const creditImpact = Math.round(Math.max(-40, Math.min(60, composite * 60)));
  const creditScoreFactor = {
    label: 'Social sentiment (alt-data, VADER NLP on HN+Reddit)',
    impact: creditImpact,
    rationale: composite > 0.2
      ? 'Sustained bullish discourse — borrower is engaging with healthy market context.'
      : composite < -0.2
      ? 'Capitulation discourse around held assets — flag for over-leverage risk.'
      : 'Neutral social context — no adjustment.',
  };

  // Fraud rule: BUY orders during capitulation or sentiment spike are
  // momentum-chasing; raise flag.
  const fraudTriggered = composite < -0.4 || (spike && composite < 0);
  const fraudRule = {
    label: 'Sentiment-contradiction & FOMO-spike rule',
    triggered: fraudTriggered,
    rationale: fraudTriggered
      ? 'Buy intent contradicts bearish sentiment OR mention spike suggests retail FOMO. Require confirmation.'
      : 'No sentiment-driven anomaly detected on this transaction context.',
  };

  // Advisor tilt: portfolio allocation tilt in [-25%, +25%].
  const tiltPct = Math.round(composite * 25);
  const advisorTilt = {
    label: 'Sentiment-weighted allocation tilt',
    tiltPct,
    rationale: signal === 'STRONG_BUY'
      ? `Tilt target weight up ${tiltPct}% — strong real-time social signal.`
      : signal === 'STRONG_SELL'
      ? `Tilt target weight down ${Math.abs(tiltPct)}% — capitulation detected, reduce exposure.`
      : 'Hold base allocation — no actionable tilt.',
  };

  return { creditScoreFactor, fraudRule, advisorTilt };
}

// ─── Main pipeline ───

export async function runAltDataPipeline(symbol: string): Promise<RealSentimentResult> {
  const base = symbol.replace(/USDT$|USD$/i, '').toUpperCase();
  const startedAt = Date.now();
  const stages: PipelineStage[] = [];

  // STAGE 1a — Reddit collect (best-effort; Reddit blocks bot IPs heavily)
  const t1a = Date.now();
  const reddit = await collectCorpusForSymbol(symbol).catch((e) => ({
    posts: [] as RedditPost[], sources: [] as string[], errors: [(e as Error).message],
  }));
  stages.push({
    name: 'collect.reddit',
    status: reddit.posts.length > 0 ? 'ok' : reddit.errors.length === 0 ? 'partial' : 'failed',
    message: reddit.posts.length > 0
      ? `${reddit.posts.length} posts from ${reddit.sources.length} subreddits`
      : `Reddit blocked (${reddit.errors[0] || 'no data'}). News API used instead.`,
    latencyMs: Date.now() - t1a,
  });

  // STAGE 1a' — Hacker News via Algolia (primary social-text source)
  const t1aPrime = Date.now();
  const news = await collectHnForSymbol(symbol).catch((e) => ({
    posts: [] as HnHit[], sources: [] as string[], errors: [(e as Error).message],
  }));
  stages.push({
    name: 'collect.hackerNews',
    status: news.errors.length === 0 ? 'ok' : news.posts.length > 0 ? 'partial' : 'failed',
    message: `${news.posts.length} HN stories from ${news.sources.length} queries` +
      (news.errors.length ? ` (errors: ${news.errors.length})` : ''),
    latencyMs: Date.now() - t1aPrime,
  });

  // STAGE 1b — alternative.me Fear & Greed
  const t1b = Date.now();
  const fg = await fetchFearGreedReal();
  const fgMsg = fg.ok
    ? `value=${fg.current.value} (${fg.current.classification})`
    : ('error' in fg ? fg.error : 'fail');
  stages.push({
    name: 'collect.fearGreed',
    status: fg.ok ? 'ok' : 'failed',
    message: fgMsg,
    latencyMs: Date.now() - t1b,
  });

  // STAGE 1c — CoinGecko
  const t1c = Date.now();
  const cg = await fetchCoinGecko(symbol);
  const cgMsg = cg.ok
    ? `vote↑ ${cg.voteUpPct.toFixed(1)}% | community ${cg.communityScore.toFixed(1)}`
    : ('error' in cg ? cg.error : 'fail');
  stages.push({
    name: 'collect.coinGecko',
    status: cg.ok ? 'ok' : 'failed',
    message: cgMsg,
    latencyMs: Date.now() - t1c,
  });

  // STAGE 2a — VADER NLP on Reddit + News corpus (union)
  const t2a = Date.now();
  const docs = [
    ...reddit.posts.map((p) => ({
      kind: 'reddit' as const, src: p,
      text: `${p.title}\n${p.selftext.slice(0, 300)}`,
      weight: Math.max(1, p.ups),
    })),
    ...news.posts.map((n) => ({
      kind: 'news' as const, src: n,
      text: n.title,
      weight: Math.max(1, n.points + 1),
    })),
  ];
  const corpus = aggregateCorpus(docs.map((d) => ({ text: d.text, weight: d.weight })));
  // Map per-doc results back to PerPostAnalysis (unified shape).
  const perPost: PerPostAnalysis[] = docs.map((d, idx) => {
    const ds = corpus.perDoc[idx]?.sentiment ?? analyzeText(d.text);
    if (d.kind === 'reddit') {
      const p = d.src;
      return {
        id: `r:${p.id}`, title: p.title, subreddit: `r/${p.subreddit}`,
        ups: p.ups, numComments: p.numComments,
        ageMin: Math.round((Date.now() / 1000 - p.createdUtc) / 60),
        url: p.url, compound: ds.compound, label: ds.label, matchedTerms: ds.matchedTerms,
      };
    }
    const n = d.src;
    return {
      id: `n:${n.id}`, title: n.title, subreddit: `HN/${n.author}`,
      ups: n.points, numComments: n.numComments,
      ageMin: Math.round((Date.now() / 1000 - n.createdUtc) / 60),
      url: n.hnUrl, compound: ds.compound, label: ds.label, matchedTerms: ds.matchedTerms,
    };
  });
  const topPositive = perPost
    .filter((p) => p.matchedTerms.length > 0 && p.compound > 0.05)
    .sort((a, b) => b.compound * Math.log10(b.ups + 2) - a.compound * Math.log10(a.ups + 2))
    .slice(0, 5);
  const topNegative = perPost
    .filter((p) => p.matchedTerms.length > 0 && p.compound < -0.05)
    .sort((a, b) => a.compound * Math.log10(a.ups + 2) - b.compound * Math.log10(b.ups + 2))
    .slice(0, 5);
  stages.push({
    name: 'analyse.nlp.vader',
    status: corpus.corpus.matchedDocCount > 0 ? 'ok' : 'partial',
    message: `VADER (lexicon) matched ${corpus.corpus.matchedDocCount}/${corpus.corpus.docCount}, weighted=${corpus.corpus.weightedCompound}`,
    latencyMs: Date.now() - t2a,
  });

  // STAGE 2a' — Trained Naive Bayes classifier on the SAME corpus
  const t2aPrime = Date.now();
  const nbCorpus = classifyCorpus(docs.map((d) => ({ text: d.text, weight: d.weight })));
  // Per-doc NB classifications
  const nbPerDoc = nbCorpus.perDoc;
  // Compute VADER vs NB agreement (same direction on the same doc).
  const vaderLabels = corpus.perDoc.map((d) => d.sentiment.compound >= 0.05 ? 'positive' : d.sentiment.compound <= -0.05 ? 'negative' : 'neutral');
  let agreed = 0, comparable = 0;
  for (let i = 0; i < Math.min(vaderLabels.length, nbPerDoc.length); i++) {
    if (corpus.perDoc[i]?.sentiment.matchedTerms.length || nbPerDoc[i]?.matchedFeatures.length) {
      comparable++;
      if (vaderLabels[i] === nbPerDoc[i].label) agreed++;
    }
  }
  const agreement = comparable > 0 ? agreed / comparable : 0;
  // Top examples per class with feature attributions
  const nbTopPositive = docs
    .map((d, i) => ({ d, nb: nbPerDoc[i], idx: i }))
    .filter((x) => x.nb.label === 'positive' && x.nb.matchedFeatures.length > 0)
    .sort((a, b) => b.nb.confidence * Math.log10(a.d.weight + 2) - a.nb.confidence * Math.log10(b.d.weight + 2))
    .slice(0, 5)
    .map((x) => {
      const post = perPost[x.idx];
      return {
        id: post.id, title: post.title, subreddit: post.subreddit, ups: post.ups,
        numComments: post.numComments, ageMin: post.ageMin, url: post.url,
        compound: x.nb.compound, confidence: x.nb.confidence,
        topFeatures: x.nb.matchedFeatures.slice(0, 5).map((f) => ({
          token: f.token,
          positiveLogProb: f.contributions.positive,
          negativeLogProb: f.contributions.negative,
        })),
      };
    });
  const nbTopNegative = docs
    .map((d, i) => ({ d, nb: nbPerDoc[i], idx: i }))
    .filter((x) => x.nb.label === 'negative' && x.nb.matchedFeatures.length > 0)
    .sort((a, b) => b.nb.confidence * Math.log10(b.d.weight + 2) - a.nb.confidence * Math.log10(a.d.weight + 2))
    .slice(0, 5)
    .map((x) => {
      const post = perPost[x.idx];
      return {
        id: post.id, title: post.title, subreddit: post.subreddit, ups: post.ups,
        numComments: post.numComments, ageMin: post.ageMin, url: post.url,
        compound: x.nb.compound, confidence: x.nb.confidence,
        topFeatures: x.nb.matchedFeatures.slice(0, 5).map((f) => ({
          token: f.token,
          positiveLogProb: f.contributions.positive,
          negativeLogProb: f.contributions.negative,
        })),
      };
    });
  stages.push({
    name: 'analyse.nlp.naiveBayes',
    status: nbCorpus.matchedDocCount > 0 ? 'ok' : 'partial',
    message: `NB classifier weighted=${nbCorpus.weightedCompound} (matched ${nbCorpus.matchedDocCount}/${nbCorpus.docCount}, agree-w-VADER ${(agreement * 100).toFixed(0)}%)`,
    latencyMs: Date.now() - t2aPrime,
  });

  // STAGE 2b — Z-score anomaly detection (total social-text mentions)
  const t2b = Date.now();
  const mentions = reddit.posts.length + news.posts.length;
  pushMentionSample(base, mentions);
  const zs = zScore(base, mentions);
  const spike = zs.z > 1.5 && zs.n >= 5; // 1.5σ over 5+ historical samples
  stages.push({
    name: 'analyse.anomaly',
    status: 'ok',
    message: `z=${zs.z} (history n=${zs.n}, μ=${zs.mean}, σ=${zs.std}) → ${spike ? 'SPIKE' : 'normal'}`,
    latencyMs: Date.now() - t2b,
  });

  // STAGE 2c — multi-source signal fusion
  const t2c = Date.now();
  // Inner blend: VADER (lexicon) and Naive Bayes (trained) on the SAME
  // social-text corpus. NB carries more weight because it is trained from
  // labeled data; VADER is the lexicon baseline.
  const wVader = 0.4, wNB = 0.6;
  const socialTextScore =
    corpus.corpus.matchedDocCount + nbCorpus.matchedDocCount > 0
      ? corpus.corpus.weightedCompound * wVader + nbCorpus.weightedCompound * wNB
      : 0;
  // Outer blend with non-text alt-data signals.
  // Weights (sum to 1). When a source fails, redistribute proportionally.
  let w = { socialText: 0.50, coinGecko: 0.25, fearGreed: 0.25 };
  if (!cg.ok) { w.socialText += w.coinGecko * 0.7; w.fearGreed += w.coinGecko * 0.3; w.coinGecko = 0; }
  if (!fg.ok) { w.socialText += w.fearGreed * 0.7; w.coinGecko += w.fearGreed * 0.3; w.fearGreed = 0; }
  if (corpus.corpus.matchedDocCount + nbCorpus.matchedDocCount === 0) {
    w.coinGecko += w.socialText * 0.5; w.fearGreed += w.socialText * 0.5; w.socialText = 0;
  }

  const cgScore = cg.ok ? (cg.voteUpPct - cg.voteDownPct) / 100 : 0;        // [-1,1]
  const fgScore = fg.ok ? (fg.current.value - 50) / 50 : 0;                 // [-1,1]

  const composite = Number(
    (socialTextScore * w.socialText + cgScore * w.coinGecko + fgScore * w.fearGreed).toFixed(4),
  );
  const composite0to100 = Math.round((composite + 1) * 50);
  const confidence = Math.min(
    0.97,
    0.30 +
      (corpus.corpus.matchedDocCount > 0 ? 0.25 : 0) +
      (cg.ok ? 0.20 : 0) +
      (fg.ok ? 0.15 : 0) +
      (Math.abs(composite) > 0.4 ? 0.10 : 0),
  );
  const signal = compositeSignal(composite, confidence);
  const label: SentimentLabel =
    composite >= 0.5 ? 'Euphoric' :
    composite >= 0.05 ? 'Bullish' :
    composite > -0.05 ? 'Neutral' :
    composite > -0.5 ? 'Bearish' : 'Capitulation';
  stages.push({
    name: 'analyse.fusion',
    status: 'ok',
    message: `composite=${composite} (signal=${signal}, conf=${(confidence * 100).toFixed(0)}%, VADER:NB blend ${wVader}:${wNB})`,
    latencyMs: Date.now() - t2c,
  });

  // STAGE 4 — fintech application
  const application = buildApplication(composite, spike, signal);

  return {
    symbol,
    base,
    sources: {
      reddit: reddit.sources,
      news: news.sources,
      coinGecko: cg.ok ? `coingecko.com/coins/${cg.coinId}` : null,
      fearGreed: fg.ok ? 'alternative.me/fng' : null,
    },
    collected: {
      redditPosts: reddit.posts.length,
      newsPosts: news.posts.length,
      totalDocs: reddit.posts.length + news.posts.length,
      coinGeckoOk: cg.ok,
      fearGreedOk: fg.ok,
    },
    nlp: {
      technique: 'VADER-style lexicon analyzer',
      docCount: corpus.corpus.docCount,
      matchedDocCount: corpus.corpus.matchedDocCount,
      weightedCompound: corpus.corpus.weightedCompound,
      posShare: corpus.corpus.posShare,
      negShare: corpus.corpus.negShare,
      neuShare: corpus.corpus.neuShare,
      topPositive,
      topNegative,
    },
    mlClassifier: {
      technique: 'Multinomial Naive Bayes (trained from scratch)',
      modelTrainedAt: MODEL_METRICS.trainedAt,
      modelAccuracy: MODEL_METRICS.accuracy,
      modelMacroF1: MODEL_METRICS.macroF1,
      docCount: nbCorpus.docCount,
      matchedDocCount: nbCorpus.matchedDocCount,
      weightedCompound: nbCorpus.weightedCompound,
      perClassShare: {
        positive: nbCorpus.perClassShare.positive,
        negative: nbCorpus.perClassShare.negative,
        neutral: nbCorpus.perClassShare.neutral,
      },
      label: nbCorpus.label,
      topPositive: nbTopPositive,
      topNegative: nbTopNegative,
      agreementWithVader: Number(agreement.toFixed(3)),
    },
    anomaly: {
      technique: 'Z-score on mention volume',
      currentMentions: mentions,
      zScore: zs.z,
      baselineMean: zs.mean,
      baselineStd: zs.std,
      historyN: zs.n,
      spike,
    },
    fusion: {
      vaderWeight: wVader,
      naiveBayesWeight: wNB,
      redditWeight: Number(w.socialText.toFixed(2)),
      coinGeckoWeight: Number(w.coinGecko.toFixed(2)),
      fearGreedWeight: Number(w.fearGreed.toFixed(2)),
      compositeScore: composite,
      composite0to100,
      label,
      confidence: Number(confidence.toFixed(3)),
      signal,
    },
    application,
    raw: {
      fearGreed: fg.ok ? fg : null,
      coinGecko: cg.ok ? cg : null,
    },
    stages,
    generatedAt: new Date().toISOString(),
    totalLatencyMs: Date.now() - startedAt,
  };
}

/**
 * Cheaper variant used by /credit-score and /fraud-check that only needs the
 * scalar composite + label, no per-post breakdown. Backed by the same fetch
 * cache so it's free after the first run.
 */
export async function getRealSentimentScore(symbol: string): Promise<{ score: number; label: SentimentLabel; spike: boolean }> {
  const r = await runAltDataPipeline(symbol);
  return { score: r.fusion.compositeScore, label: r.fusion.label, spike: r.anomaly.spike };
}
