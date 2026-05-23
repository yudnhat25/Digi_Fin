/**
 * AI Portfolio Advisor — uses alternative-data signals (sentiment + fear/greed
 * + whale flow) to build a target allocation tailored to the user's risk
 * profile, plus a narrative rationale.
 */
import { getAccount } from '../state.js';
import { getSentiment, getFearGreed, getWhaleFlow, signalFromSentiment } from './altdata.js';

export type RiskProfile = 'CONSERVATIVE' | 'BALANCED' | 'GROWTH' | 'AGGRESSIVE';

const UNIVERSE: { symbol: string; defaultWeight: Record<RiskProfile, number> }[] = [
  { symbol: 'BTCUSDT',  defaultWeight: { CONSERVATIVE: 0.45, BALANCED: 0.35, GROWTH: 0.25, AGGRESSIVE: 0.18 } },
  { symbol: 'ETHUSDT',  defaultWeight: { CONSERVATIVE: 0.25, BALANCED: 0.25, GROWTH: 0.22, AGGRESSIVE: 0.18 } },
  { symbol: 'SOLUSDT',  defaultWeight: { CONSERVATIVE: 0.05, BALANCED: 0.10, GROWTH: 0.15, AGGRESSIVE: 0.18 } },
  { symbol: 'BNBUSDT',  defaultWeight: { CONSERVATIVE: 0.05, BALANCED: 0.08, GROWTH: 0.10, AGGRESSIVE: 0.10 } },
  { symbol: 'LINKUSDT', defaultWeight: { CONSERVATIVE: 0.00, BALANCED: 0.05, GROWTH: 0.08, AGGRESSIVE: 0.10 } },
  { symbol: 'AVAXUSDT', defaultWeight: { CONSERVATIVE: 0.00, BALANCED: 0.03, GROWTH: 0.08, AGGRESSIVE: 0.10 } },
  { symbol: 'INJUSDT',  defaultWeight: { CONSERVATIVE: 0.00, BALANCED: 0.02, GROWTH: 0.06, AGGRESSIVE: 0.08 } },
  { symbol: 'ARBUSDT',  defaultWeight: { CONSERVATIVE: 0.00, BALANCED: 0.02, GROWTH: 0.06, AGGRESSIVE: 0.08 } },
];

export interface AdvisorAllocation {
  symbol: string;
  weight: number;
  rationale: string;
}

export interface AdvisorResult {
  riskProfile: RiskProfile;
  targetAllocation: AdvisorAllocation[];
  cashBufferPct: number;
  expectedReturnPct: number;
  volatilityPct: number;
  rebalanceActions: string[];
  narrative: string;
}

const EXPECTED_RETURN: Record<RiskProfile, number> = {
  CONSERVATIVE: 8, BALANCED: 14, GROWTH: 22, AGGRESSIVE: 35,
};
const VOL: Record<RiskProfile, number> = {
  CONSERVATIVE: 12, BALANCED: 22, GROWTH: 38, AGGRESSIVE: 60,
};
const CASH_BUFFER: Record<RiskProfile, number> = {
  CONSERVATIVE: 0.20, BALANCED: 0.10, GROWTH: 0.05, AGGRESSIVE: 0.02,
};

export function buildAdvisor(accountId: string, profile: RiskProfile = 'BALANCED'): AdvisorResult {
  const acc = getAccount(accountId);
  const fg = getFearGreed();

  // Sentiment-tilted weights (boost weight when AI signal is BUY, dampen when SELL).
  const raw = UNIVERSE.map((u) => {
    const sent = getSentiment(u.symbol);
    const whale = getWhaleFlow(u.symbol);
    const tilt =
      (sent.score * 0.35) +
      (whale.netFlow24hUsd > 0 ? 0.15 : -0.1) +
      (fg.value > 60 ? -0.05 : fg.value < 40 ? 0.07 : 0);
    const base = u.defaultWeight[profile];
    const adjusted = Math.max(0, base * (1 + tilt));
    const signal = signalFromSentiment(sent.score, 0);
    const rationale =
      signal === 'BUY'
        ? `AI BUY — sentiment ${sent.label} (${sent.score.toFixed(2)}), whales accumulating.`
        : signal === 'SELL'
        ? `Reduced from base — sentiment ${sent.label}, whales distributing.`
        : `Neutral tilt — sentiment ${sent.label}, holding base allocation.`;
    return { symbol: u.symbol, weight: adjusted, rationale };
  });
  const sum = raw.reduce((s, r) => s + r.weight, 0) || 1;
  const cashBuffer = CASH_BUFFER[profile];
  const investable = 1 - cashBuffer;
  const targetAllocation: AdvisorAllocation[] = raw.map((r) => ({
    symbol: r.symbol,
    weight: Number(((r.weight / sum) * investable).toFixed(4)),
    rationale: r.rationale,
  })).filter((r) => r.weight > 0.01);

  // Build rebalance actions vs current positions.
  const currentValueBySymbol: Record<string, number> = {};
  let netWorth = acc.cashUsd;
  for (const p of acc.positions) {
    const v = p.amount * 1000; // pseudo price proxy (server doesn't hit Binance here)
    currentValueBySymbol[p.symbol] = v;
    netWorth += v;
  }
  const actions = targetAllocation.slice(0, 5).map((t) => {
    const targetUsd = t.weight * netWorth;
    const currentUsd = currentValueBySymbol[t.symbol] || 0;
    const delta = targetUsd - currentUsd;
    if (Math.abs(delta) < 50) return `${t.symbol}: hold (within band)`;
    return delta > 0
      ? `${t.symbol}: BUY +$${delta.toFixed(0)} to reach target weight ${(t.weight * 100).toFixed(1)}%`
      : `${t.symbol}: SELL -$${Math.abs(delta).toFixed(0)} to trim`;
  });

  return {
    riskProfile: profile,
    targetAllocation,
    cashBufferPct: cashBuffer * 100,
    expectedReturnPct: EXPECTED_RETURN[profile],
    volatilityPct: VOL[profile],
    rebalanceActions: actions,
    narrative:
      `For a ${profile.toLowerCase()} investor, the AI advisor tilts the portfolio using ` +
      `live alternative-data signals — Fear & Greed ${fg.value} (${fg.classification}), social sentiment, and on-chain whale flow. ` +
      `Expected 12-month return ~${EXPECTED_RETURN[profile]}% with ~${VOL[profile]}% volatility. ` +
      `Cash buffer ${(cashBuffer * 100).toFixed(0)}% kept for dip-buy opportunities.`,
  };
}
