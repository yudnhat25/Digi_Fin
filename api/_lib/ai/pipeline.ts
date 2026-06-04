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
 *     - feeds into Fraud Shield (sentiment-contradiction rule)
 *     - feeds into AI Advisor (sentiment tilt)
 */

import { collectCorpusForSymbol, RedditPost } from './sources/reddit';
import { collectHnForSymbol, HnHit } from './sources/hackerNews';
import { fetchFearGreedReal, FearGreedReal } from './sources/fearGreed';
import { fetchCoinGecko, CoinGeckoSignals } from './sources/coingecko';
import { fetchLatestNews } from './sources/cryptoNewsRss';
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

  // Stage 2b' — news tone (separate channel: event-tone, not crowd mood)
  newsTone: {
    technique: 'VADER + Naive Bayes on RSS headlines';
    headlineCount: number;
    matchedCount: number;
    tone: number;                 // [-1, 1]
    label: SentimentLabel;
    topHeadlines: { title: string; source: string; url: string; ageMin: number; compound: number }[];
  };

  // Stage 2c — fusion
  fusion: {
    vaderWeight: number;
    naiveBayesWeight: number;
    redditWeight: number;          // legacy field kept for the UI bar chart
    newsWeight: number;
    coinGeckoWeight: number;
    fearGreedWeight: number;
    compositeScore: number;       // [-1, 1]
    composite0to100: number;      // for UI
    label: SentimentLabel;
    confidence: number;           // 0–1
    signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' | 'NEUTRAL';
  };

  // Stage 4 — fintech application
  application: {
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

  return { fraudRule, advisorTilt };
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

  // STAGE 1d — crypto-news RSS (separate "event-tone" channel: fresh + dated)
  const t1d = Date.now();
  const allNews = await fetchLatestNews(50).catch(() => []);
  // Relevant = tagged to this coin, or MACRO (market-wide events move every
  // coin), and within the 1-year recency floor.
  const newsCutoffSec = Date.now() / 1000 - 365 * 24 * 3600;
  const coinNews = allNews.filter(
    (h) => (h.tag === base || h.tag === 'MACRO') && (!h.publishedAt || h.publishedAt >= newsCutoffSec),
  );
  stages.push({
    name: 'collect.news',
    status: coinNews.length > 0 ? 'ok' : 'partial',
    message: `${coinNews.length} headlines (of ${allNews.length}) for ${base} + MACRO`,
    latencyMs: Date.now() - t1d,
  });

  // STAGE 2a — VADER NLP on Reddit + News corpus (union)
  const t2a = Date.now();
  // Recency decay: HN's relevance search surfaces all-time-popular crypto
  // stories, many years old, which don't reflect CURRENT sentiment. Fold an
  // exponential time decay (180-day half-life) into each post's weight so fresh
  // posts dominate the aggregate while old ones still count (floored at 1) —
  // "prefer recent, keep volume". A 6-month-old post counts ½, a year ¼, etc.
  const RECENCY_HALF_LIFE_DAYS = 180;
  const nowSec = Date.now() / 1000;
  // Hard recency floor: drop any post older than 1 year so the sentiment
  // reflects the current market cycle, not stale headlines. Applied to BOTH
  // sources uniformly (HN is also filtered at the API; this also covers Reddit).
  const freshCutoff = nowSec - 365 * 24 * 3600;
  reddit.posts = reddit.posts.filter((p) => p.createdUtc >= freshCutoff);
  news.posts = news.posts.filter((n) => n.createdUtc >= freshCutoff);
  const recencyDecay = (createdUtcSec: number) =>
    Math.pow(0.5, Math.max(0, (nowSec - createdUtcSec) / 86400) / RECENCY_HALF_LIFE_DAYS);
  const recencyOf = (ageMin: number) =>
    Math.pow(0.5, Math.max(0, ageMin / 1440) / RECENCY_HALF_LIFE_DAYS);
  const docs = [
    ...reddit.posts.map((p) => ({
      kind: 'reddit' as const, src: p,
      text: `${p.title}\n${p.selftext.slice(0, 300)}`,
      weight: Math.max(1, p.ups * recencyDecay(p.createdUtc)),
    })),
    ...news.posts.map((n) => ({
      kind: 'news' as const, src: n,
      text: n.title,
      weight: Math.max(1, (n.points + 1) * recencyDecay(n.createdUtc)),
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
  // Rank top cards by compound × engagement × recency so fresh posts surface
  // instead of decade-old viral stories.
  const topPositive = perPost
    .filter((p) => p.matchedTerms.length > 0 && p.compound > 0.05)
    .sort((a, b) => b.compound * Math.log10(b.ups + 2) * recencyOf(b.ageMin) - a.compound * Math.log10(a.ups + 2) * recencyOf(a.ageMin))
    .slice(0, 5);
  const topNegative = perPost
    .filter((p) => p.matchedTerms.length > 0 && p.compound < -0.05)
    .sort((a, b) => a.compound * Math.log10(a.ups + 2) * recencyOf(a.ageMin) - b.compound * Math.log10(b.ups + 2) * recencyOf(b.ageMin))
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

  // STAGE 2b' — News tone: run the SAME NLP stack (VADER + NB) on headlines.
  // Kept as its own channel because news measures EVENT tone, not crowd mood.
  const t2bPrime = Date.now();
  const newsDocs = coinNews.map((h) => ({ text: h.title, weight: 1 }));
  const newsVader = aggregateCorpus(newsDocs);
  const newsNb = classifyCorpus(newsDocs);
  const newsHasSignal = newsVader.corpus.matchedDocCount + newsNb.matchedDocCount > 0;
  const topHeadlines = coinNews
    .map((h, i) => ({
      title: h.title, source: h.source, url: h.url,
      ageMin: h.publishedAt ? Math.round((Date.now() / 1000 - h.publishedAt) / 60) : 0,
      compound: newsVader.perDoc[i]?.sentiment.compound ?? 0,
    }))
    .filter((h) => Math.abs(h.compound) > 0.05)
    .sort((a, b) => Math.abs(b.compound) - Math.abs(a.compound))
    .slice(0, 6);
  stages.push({
    name: 'analyse.newsTone',
    status: newsHasSignal ? 'ok' : 'partial',
    message: `news VADER=${newsVader.corpus.weightedCompound} NB=${newsNb.weightedCompound} (matched ${Math.max(newsVader.corpus.matchedDocCount, newsNb.matchedDocCount)}/${coinNews.length})`,
    latencyMs: Date.now() - t2bPrime,
  });

  // STAGE 2c — multi-source signal fusion
  const t2c = Date.now();
  // Inner blend: VADER (lexicon) and Naive Bayes (trained) on the SAME
  // social-text corpus. NB carries more weight because it is trained from
  // labeled data; VADER is the lexicon baseline.
  // Inner text blend (used for BOTH social and news): VADER (lexicon) + NB (trained).
  const wVader = 0.4, wNB = 0.6;
  const socialAlive = corpus.corpus.matchedDocCount + nbCorpus.matchedDocCount > 0;
  const socialTextScore = socialAlive
    ? corpus.corpus.weightedCompound * wVader + nbCorpus.weightedCompound * wNB
    : 0;
  const newsTone = newsHasSignal
    ? Number((newsVader.corpus.weightedCompound * wVader + newsNb.weightedCompound * wNB).toFixed(4))
    : 0;

  // Outer blend: social mood + news tone (event channel) + CoinGecko + F&G.
  // Base weights — news kept moderate (it's event tone, not crowd mood, and
  // headlines are written neutrally so they read muted). Dead channels drop to
  // 0 and the survivors are renormalised to sum 1.
  let wSocial = socialAlive ? 0.30 : 0;
  let wNews = newsHasSignal ? 0.20 : 0;
  let wCg = cg.ok ? 0.25 : 0;
  let wFg = fg.ok ? 0.25 : 0;
  const wTotal = wSocial + wNews + wCg + wFg || 1;
  wSocial /= wTotal; wNews /= wTotal; wCg /= wTotal; wFg /= wTotal;

  const cgScore = cg.ok ? (cg.voteUpPct - cg.voteDownPct) / 100 : 0;        // [-1,1]
  const fgScore = fg.ok ? (fg.current.value - 50) / 50 : 0;                 // [-1,1]

  const composite = Number(
    (socialTextScore * wSocial + newsTone * wNews + cgScore * wCg + fgScore * wFg).toFixed(4),
  );
  const composite0to100 = Math.round((composite + 1) * 50);
  const confidence = Math.min(
    0.97,
    0.30 +
      (corpus.corpus.matchedDocCount > 0 ? 0.20 : 0) +
      (newsHasSignal ? 0.10 : 0) +
      (cg.ok ? 0.20 : 0) +
      (fg.ok ? 0.12 : 0) +
      (Math.abs(composite) > 0.4 ? 0.08 : 0),
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
    newsTone: {
      technique: 'VADER + Naive Bayes on RSS headlines',
      headlineCount: coinNews.length,
      matchedCount: Math.max(newsVader.corpus.matchedDocCount, newsNb.matchedDocCount),
      tone: newsTone,
      label:
        newsTone >= 0.5 ? 'Euphoric' :
        newsTone >= 0.05 ? 'Bullish' :
        newsTone > -0.05 ? 'Neutral' :
        newsTone > -0.5 ? 'Bearish' : 'Capitulation',
      topHeadlines,
    },
    fusion: {
      vaderWeight: wVader,
      naiveBayesWeight: wNB,
      redditWeight: Number(wSocial.toFixed(2)),
      newsWeight: Number(wNews.toFixed(2)),
      coinGeckoWeight: Number(wCg.toFixed(2)),
      fearGreedWeight: Number(wFg.toFixed(2)),
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
 * Cheaper variant used by /fraud-check & /advisor that only needs the scalar
 * composite + label, no per-post breakdown.
 *
 * The full pipeline (Reddit + HN + CoinGecko + F&G + NLP) is expensive, and
 * callers like the Fraud Shield page scan ~15 transactions in parallel — many
 * for the same asset. We cache the RESULT PROMISE per symbol (10-min TTL) so
 * concurrent calls for one symbol share a single pipeline run (in-flight
 * dedup) and repeated scans are free. A rejected run is evicted so the next
 * call retries instead of caching the failure.
 */
type RealSentiment = { score: number; label: SentimentLabel; spike: boolean };
const SENTIMENT_CACHE_TTL_MS = 10 * 60 * 1000;
const sentimentCache = new Map<string, { p: Promise<RealSentiment>; ts: number }>();

export async function getRealSentimentScore(symbol: string): Promise<RealSentiment> {
  const key = symbol.toUpperCase();
  const now = Date.now();
  const hit = sentimentCache.get(key);
  if (hit && now - hit.ts < SENTIMENT_CACHE_TTL_MS) return hit.p;

  const p = runAltDataPipeline(symbol).then((r) => ({
    score: r.fusion.compositeScore,
    label: r.fusion.label,
    spike: r.anomaly.spike,
  }));
  sentimentCache.set(key, { p, ts: now });
  p.catch(() => {
    if (sentimentCache.get(key)?.p === p) sentimentCache.delete(key);
  });
  return p;
}
