/**
 * AI Credit Score (alternative-data based)
 *
 * Combines:
 *   • Account behaviour          (cash discipline, deposit cadence)
 *   • Trading footprint          (win-rate proxy from realised P&L sign)
 *   • Social/mobile signals      (engagement & usage frequency, simulated)
 *   • Utility-bill regularity    (simulated — common alt-data in VN fintech)
 *
 * Output: 0–1000 score + band + factor breakdown + lending eligibility in VND.
 */
import { getAccount } from '../state';
import { usdToVnd } from '../fx';
import { getRealSentimentScore } from './pipeline';

export interface CreditFactor {
  key: string;
  label: string;
  impact: number;
  value: string;
}

export interface CreditScoreResult {
  accountId: string;
  score: number;
  band: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Subprime';
  factors: CreditFactor[];
  recommendation: string;
  eligibility: { marginLoanVnd: number; premiumProducts: boolean };
  asOf: string;
}

export function computeCreditScore(accountId: string): CreditScoreResult {
  const acc = getAccount(accountId);
  const txs = acc.transactions;
  const depositCount = txs.filter((t) => t.type === 'DEPOSIT').length;
  const tradeCount = txs.filter((t) => t.type === 'BUY' || t.type === 'SELL').length;
  const realisedPnl = txs
    .filter((t) => t.type === 'SELL')
    .reduce((s, t) => s + t.total, 0)
    - txs.filter((t) => t.type === 'BUY').reduce((s, t) => s + Math.abs(t.total), 0);
  const cashRatio = acc.cashUsd / Math.max(1_000_000, acc.cashUsd + acc.positions.length * 100_000);

  // Simulated alt-data signals (mobile usage + utility regularity)
  const mobileSignalSeed = (accountId.charCodeAt(0) || 65) % 30;
  const mobileEngagement = 0.55 + (mobileSignalSeed / 100);
  const utilityRegularity = 0.6 + ((accountId.length * 7) % 30) / 100;

  // Weighted factor build
  const factors: CreditFactor[] = [
    {
      key: 'deposit_cadence',
      label: 'Deposit cadence (alt-data proxy for income stability)',
      impact: Math.min(160, depositCount * 12),
      value: `${depositCount} deposits`,
    },
    {
      key: 'trading_activity',
      label: 'Trading footprint (paper-trade engagement)',
      impact: Math.min(140, tradeCount * 6),
      value: `${tradeCount} trades`,
    },
    {
      key: 'realised_pnl',
      label: 'Realised P&L signal',
      impact: Math.max(-100, Math.min(180, Math.round(realisedPnl / 5000))),
      value: `${realisedPnl >= 0 ? '+' : ''}$${realisedPnl.toFixed(0)}`,
    },
    {
      key: 'cash_discipline',
      label: 'Cash discipline ratio',
      impact: Math.round(cashRatio * 150),
      value: `${(cashRatio * 100).toFixed(0)}%`,
    },
    {
      key: 'mobile_alt',
      label: 'Mobile usage regularity (alt-data)',
      impact: Math.round(mobileEngagement * 120),
      value: `${(mobileEngagement * 100).toFixed(0)}/100`,
    },
    {
      key: 'utility_alt',
      label: 'Utility-bill payment regularity (alt-data)',
      impact: Math.round(utilityRegularity * 130),
      value: `${(utilityRegularity * 100).toFixed(0)}/100`,
    },
  ];

  const baseline = 480;
  const score = Math.max(
    280,
    Math.min(995, baseline + factors.reduce((s, f) => s + f.impact, 0)),
  );

  const band: CreditScoreResult['band'] =
    score >= 820 ? 'Excellent' :
    score >= 720 ? 'Good' :
    score >= 600 ? 'Fair' :
    score >= 480 ? 'Poor' : 'Subprime';

  const marginLoanUsd =
    band === 'Excellent' ? 25_000 :
    band === 'Good' ? 12_000 :
    band === 'Fair' ? 4_000 :
    band === 'Poor' ? 1_000 : 0;

  const recommendation =
    band === 'Excellent'
      ? 'Eligible for Elite margin facility and VIP yield products. Consider enabling 2x margin.'
      : band === 'Good'
      ? 'Solid alt-data profile — unlock Pro tier perks and 12% APY products.'
      : band === 'Fair'
      ? 'Build deposit cadence and complete 5 more trades to reach Good band (≥720).'
      : 'Increase utility-bill linkage and avoid loss-heavy trades. Education modules will lift score.';

  return {
    accountId,
    score,
    band,
    factors,
    recommendation,
    eligibility: {
      marginLoanVnd: usdToVnd(marginLoanUsd),
      premiumProducts: score >= 720,
    },
    asOf: new Date().toISOString(),
  };
}

/**
 * Async variant that augments the scorecard with the REAL alt-data sentiment
 * pipeline. Uses the dominant held asset (or BTC fallback) as the sentiment
 * proxy for the borrower's market context.
 */
export async function computeCreditScoreWithRealAltData(
  accountId: string,
  proxySymbol = 'BTCUSDT',
): Promise<CreditScoreResult & { altDataFactor: { score: number; label: string; impact: number } }> {
  const base = computeCreditScore(accountId);
  try {
    const alt = await getRealSentimentScore(proxySymbol);
    // Map composite sentiment ∈ [-1, 1] → impact ∈ [-40, 60]. Positive social
    // engagement = small positive nudge (proxy for healthy market awareness).
    const impact = Math.round(Math.max(-40, Math.min(60, alt.score * 60)));
    const altFactor: CreditFactor = {
      key: 'sentiment_alt',
      label: `Real-time sentiment context (VADER+CoinGecko on ${proxySymbol})`,
      impact,
      value: `${alt.label} (${(alt.score * 100).toFixed(0)}/100)`,
    };
    const factors = [...base.factors, altFactor];
    const baseline = 480;
    const adjustedScore = Math.max(280, Math.min(995, baseline + factors.reduce((s, f) => s + f.impact, 0)));
    const band: CreditScoreResult['band'] =
      adjustedScore >= 820 ? 'Excellent' :
      adjustedScore >= 720 ? 'Good' :
      adjustedScore >= 600 ? 'Fair' :
      adjustedScore >= 480 ? 'Poor' : 'Subprime';
    const marginLoanUsd =
      band === 'Excellent' ? 25_000 :
      band === 'Good' ? 12_000 :
      band === 'Fair' ? 4_000 :
      band === 'Poor' ? 1_000 : 0;
    return {
      ...base,
      score: adjustedScore,
      band,
      factors,
      eligibility: { marginLoanVnd: usdToVnd(marginLoanUsd), premiumProducts: adjustedScore >= 720 },
      altDataFactor: { score: alt.score, label: alt.label, impact },
    };
  } catch {
    return { ...base, altDataFactor: { score: 0, label: 'Neutral', impact: 0 } };
  }
}
