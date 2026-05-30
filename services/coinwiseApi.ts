/**
 * Typed client for the CoinWise AI custom OpenAPI server.
 *
 * Mirrors the schemas declared in server/openapi.yaml. The base URL can be
 * overridden by VITE_COINWISE_API_URL — defaults to localhost:3001 for dev.
 */

function resolveBase(): string {
  const env = (import.meta as any).env || {};
  // Explicit override always wins.
  if (env.VITE_COINWISE_API_URL) return env.VITE_COINWISE_API_URL;
  // In production (build mode) same-origin: Vercel rewrites /api/* to the function.
  if (env.PROD) return typeof window !== 'undefined' ? window.location.origin : '';
  // Local dev defaults.
  return 'http://localhost:3001';
}

export const COINWISE_API_BASE = resolveBase();

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${COINWISE_API_BASE}${path}`, {
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`CoinWise API ${path} failed (${res.status}): ${text}`);
  }
  return (await res.json()) as T;
}

// ───── Health & FX ─────
export interface FxRates { base: string; asOf: string; rates: Record<string, number> }
export interface FxConvert { amount: number; from: string; to: string; rate: number; result: number; formatted: string }

export const apiHealth = () => call<{ status: string; uptimeSec: number }>('/api/v1/health');
export const apiFxRates = () => call<FxRates>('/api/v1/fx/rates');
export const apiFxConvert = (amount: number, from: string, to: string) =>
  call<FxConvert>('/api/v1/fx/convert', { method: 'POST', body: JSON.stringify({ amount, from, to }) });

// ───── Market ─────
export interface EnrichedMarket {
  symbol: string; price: number; priceVnd: number;
  change24h: number; high24h: number; low24h: number;
  aiSignal: 'BUY' | 'HOLD' | 'SELL' | 'NEUTRAL';
}
export const apiMarketPrices = (symbols?: string[]) =>
  call<EnrichedMarket[]>(
    `/api/v1/market/prices${symbols?.length ? `?symbols=${encodeURIComponent(symbols.join(','))}` : ''}`,
  );

// ───── AI / Alternative Data ─────
export interface SentimentSnapshot {
  symbol: string; score: number; label: 'Bearish' | 'Neutral' | 'Bullish' | 'Euphoric';
  mentions24h: number;
  sources: { twitter: number; reddit: number; news: number };
  topThemes: string[]; aiSummary: string; updatedAt: string;
}
export interface WhaleFlow {
  symbol: string; netFlow24hUsd: number;
  largeBuys: number; largeSells: number; biggestSingle: number;
  verdict: string;
  series: { t: string; netUsd: number }[];
}
export interface FearGreed {
  value: number; classification: string; delta24h: number;
  history: { date: string; value: number }[];
}
export interface SocialPulseRow {
  symbol: string; mentions24h: number; sentiment: number;
  delta: number; momentum: 'Spike' | 'Rising' | 'Stable' | 'Cooling';
}
export interface CreditFactor { key: string; label: string; impact: number; value: string }
export interface CreditScore {
  accountId: string; score: number;
  band: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Subprime';
  factors: CreditFactor[];
  recommendation: string;
  eligibility: { marginLoanVnd: number; premiumProducts: boolean };
  asOf: string;
}
export interface FraudCheck {
  riskScore: number;
  verdict: 'SAFE' | 'REVIEW' | 'BLOCK';
  reasons: string[];
  recommendedAction: string;
}
export interface AdvisorResult {
  riskProfile: string;
  targetAllocation: { symbol: string; weight: number; rationale: string }[];
  cashBufferPct: number;
  expectedReturnPct: number;
  volatilityPct: number;
  rebalanceActions: string[];
  narrative: string;
}
export interface CoinInsight {
  symbol: string;
  signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' | 'NEUTRAL';
  confidence: number;
  sentiment: SentimentSnapshot;
  whale: WhaleFlow;
  fearGreed: FearGreed;
  narrative: string;
}

export const apiSentiment = (symbol: string) => call<SentimentSnapshot>(`/api/v1/market/${symbol}/sentiment`);
export const apiWhaleFlow = (symbol: string) => call<WhaleFlow>(`/api/v1/market/${symbol}/whale-flow`);
export const apiFearGreed = () => call<FearGreed>('/api/v1/market/fear-greed');
export const apiSocialPulse = () => call<SocialPulseRow[]>('/api/v1/market/social-pulse');
export const apiCoinInsight = (symbol: string) =>
  call<CoinInsight>('/api/v1/ai/insight', { method: 'POST', body: JSON.stringify({ symbol }) });

export const apiCreditScore = (accountId: string) =>
  call<CreditScore>('/api/v1/ai/credit-score', { method: 'POST', body: JSON.stringify({ accountId }) });
export const apiFraudCheck = (accountId: string, transaction: any) =>
  call<FraudCheck>('/api/v1/ai/fraud-check', { method: 'POST', body: JSON.stringify({ accountId, transaction }) });
export const apiAdvisor = (accountId: string, riskProfile = 'BALANCED') =>
  call<AdvisorResult>('/api/v1/ai/advisor', { method: 'POST', body: JSON.stringify({ accountId, riskProfile }) });

// ───── REAL alt-data pipeline ─────
export interface PipelineStage { name: string; status: 'ok' | 'partial' | 'failed'; message: string; latencyMs: number }
export interface PerPostAnalysis {
  id: string; title: string; subreddit: string;
  ups: number; numComments: number; ageMin: number; url: string;
  compound: number; label: string;
  matchedTerms: { token: string; valence: number }[];
}
export interface NbPostAnalysis {
  id: string; title: string; subreddit: string;
  ups: number; numComments: number; ageMin: number; url: string;
  compound: number; confidence: number;
  topFeatures: { token: string; positiveLogProb: number; negativeLogProb: number }[];
}
export interface AltDataPipelineResult {
  symbol: string; base: string;
  sources: { reddit: string[]; news: string[]; coinGecko: string | null; fearGreed: string | null };
  collected: { redditPosts: number; newsPosts: number; totalDocs: number; coinGeckoOk: boolean; fearGreedOk: boolean };
  nlp: {
    technique: string; docCount: number; matchedDocCount: number;
    weightedCompound: number; posShare: number; negShare: number; neuShare: number;
    topPositive: PerPostAnalysis[]; topNegative: PerPostAnalysis[];
  };
  mlClassifier: {
    technique: string; modelTrainedAt: string;
    modelAccuracy: number; modelMacroF1: number;
    docCount: number; matchedDocCount: number; weightedCompound: number;
    perClassShare: { positive: number; negative: number; neutral: number };
    label: 'positive' | 'negative' | 'neutral';
    topPositive: NbPostAnalysis[]; topNegative: NbPostAnalysis[];
    agreementWithVader: number;
  };
  anomaly: {
    technique: string; currentMentions: number;
    zScore: number; baselineMean: number; baselineStd: number; historyN: number; spike: boolean;
  };
  fusion: {
    vaderWeight: number; naiveBayesWeight: number;
    redditWeight: number; coinGeckoWeight: number; fearGreedWeight: number;
    compositeScore: number; composite0to100: number;
    label: string; confidence: number; signal: string;
  };
  application: {
    creditScoreFactor: { label: string; impact: number; rationale: string };
    fraudRule: { label: string; triggered: boolean; rationale: string };
    advisorTilt: { label: string; tiltPct: number; rationale: string };
  };
  raw: {
    fearGreed: { current: { value: number; classification: string }; delta24h: number; delta7d: number; history: { date: string; value: number }[] } | null;
    coinGecko: { voteUpPct: number; voteDownPct: number; redditSubscribers: number; redditPosts48h: number; twitterFollowers: number; developerScore: number; communityScore: number } | null;
  };
  stages: PipelineStage[];
  generatedAt: string; totalLatencyMs: number;
}
export interface AltDataSourcesHealth {
  reddit: { ok: boolean; latencyMs: number; sample?: number; error?: string };
  news: { ok: boolean; latencyMs: number; sample?: number; error?: string };
  fearGreed: { ok: boolean; latencyMs: number; value?: number; error?: string };
  coinGecko: { ok: boolean; latencyMs: number; error?: string };
  overall: 'live' | 'down';
  timestamp: string;
}

export const apiAltDataPipeline = (symbol: string) =>
  call<AltDataPipelineResult>(`/api/v1/ai/alt-data/pipeline/${symbol}`);

export const apiAltDataSourcesHealth = () =>
  call<AltDataSourcesHealth>(`/api/v1/ai/alt-data/sources/health`);

export interface NbModelInfo {
  algorithm: string; version: string; smoothingAlpha: number;
  classes: ('positive' | 'negative' | 'neutral')[];
  vocabSize: number; trainSize: number; testSize: number; trainedAt: string;
  classDistribution: { positive: number; negative: number; neutral: number };
  metrics: {
    accuracy: number; macroF1: number;
    perClass: Record<'positive' | 'negative' | 'neutral', {
      precision: number; recall: number; f1: number; support: number;
    }>;
    confusion: Record<'positive' | 'negative' | 'neutral', Record<'positive' | 'negative' | 'neutral', number>>;
    testSize: number;
    errors: { text: string; trueLabel: string; predicted: string; confidence: number }[];
  };
}
export interface NbClassifyResult {
  label: 'positive' | 'negative' | 'neutral';
  perClassLogProb: { positive: number; negative: number; neutral: number };
  perClassProb: { positive: number; negative: number; neutral: number };
  confidence: number;
  matchedFeatures: { token: string; contributions: { positive: number; negative: number; neutral: number } }[];
}

export const apiNbModelInfo = () => call<NbModelInfo>('/api/v1/ai/alt-data/model/info');
export const apiNbClassify = (text: string) =>
  call<NbClassifyResult>('/api/v1/ai/alt-data/classify', {
    method: 'POST', body: JSON.stringify({ text }),
  });

// ───── Accounts ─────
export interface AccountBalance {
  accountId: string;
  cashUsd: number; cashVnd: number;
  assetsUsd: number; assetsVnd: number;
  netWorthUsd: number; netWorthVnd: number;
  positions: { symbol: string; amount: number; valueUsd: number; valueVnd: number }[];
  asOf: string;
}
export interface DepositResponse {
  accountId: string; amountVnd: number; amountUsd: number;
  rate: number; channel: string; ref: string; newBalanceUsd: number;
}
export interface TradeResponse {
  ok: boolean; txId: string; side: string; symbol: string;
  executedAmount: number; executedPriceUsd: number; feeUsd: number;
  newBalanceUsd: number; fraudCheck: FraudCheck;
  blocked?: boolean;
}

export const apiBalance = (accountId: string) => call<AccountBalance>(`/api/v1/accounts/${accountId}/balance`);
export const apiDepositVnd = (accountId: string, amountVnd: number, channel = 'VNPAY') =>
  call<DepositResponse>(`/api/v1/accounts/${accountId}/deposit-vnd`, {
    method: 'POST', body: JSON.stringify({ amountVnd, channel }),
  });
export const apiTrade = (
  accountId: string,
  payload: {
    side: 'BUY' | 'SELL'; symbol: string;
    amountUsd?: number; amountVnd?: number; amount?: number;
    priceHint?: number;
  },
) => call<TradeResponse>(`/api/v1/accounts/${accountId}/trade`, {
  method: 'POST', body: JSON.stringify(payload),
});

// ───── Agentic tool dispatcher (used by chatbot) ─────
export const apiAgentExecute = (accountId: string, tool: string, args: Record<string, any>) =>
  call<any>('/api/v1/agent/execute', {
    method: 'POST', body: JSON.stringify({ accountId, tool, args }),
  });
