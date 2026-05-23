/**
 * AI Fraud Detection
 *
 * Heuristic-driven risk model that flags suspicious paper-trades against the
 * user's historical pattern. Demonstrates how the same scaffold would plug into
 * a real anomaly-detection model (Isolation Forest / LSTM autoencoder) backed
 * by alternative data such as device fingerprint, geo-velocity, social signal.
 */
import { getAccount } from '../state';
import { getSentiment } from './altdata';

export interface FraudTx {
  type?: string;
  asset?: string;
  amount?: number;
  price?: number;
  total?: number;
  timestamp?: number;
}

export interface FraudResult {
  riskScore: number;
  verdict: 'SAFE' | 'REVIEW' | 'BLOCK';
  reasons: string[];
  recommendedAction: string;
}

export function checkFraud(accountId: string, tx: FraudTx): FraudResult {
  const acc = getAccount(accountId);
  const reasons: string[] = [];
  let risk = 0;

  const txTotal = Math.abs(tx.total ?? (tx.amount ?? 0) * (tx.price ?? 0));

  // 1. Velocity check: > 5 trades in last minute
  const lastMinute = acc.transactions.filter((t) => Date.now() - t.timestamp < 60_000);
  if (lastMinute.length > 5) {
    risk += 0.3;
    reasons.push(`High velocity: ${lastMinute.length} trades within the last minute.`);
  }

  // 2. Notional anomaly: > 5x user's average
  const buys = acc.transactions.filter((t) => t.type === 'BUY');
  const avg = buys.length ? buys.reduce((s, t) => s + Math.abs(t.total), 0) / buys.length : 0;
  if (avg > 0 && txTotal > avg * 5) {
    risk += 0.25;
    reasons.push(`Order size ${txTotal.toFixed(0)} USD is >5x the user's historical average.`);
  }

  // 3. Cash burst: > 30% of cash in one trade
  if (txTotal > acc.cashUsd * 0.3) {
    risk += 0.2;
    reasons.push('Trade consumes >30% of available cash — concentration risk.');
  }

  // 4. Sentiment contradiction: chasing a sharply bearish coin
  if (tx.asset) {
    const s = getSentiment(tx.asset);
    if (tx.type === 'BUY' && s.score < -0.5) {
      risk += 0.18;
      reasons.push(
        `Buying ${tx.asset} while social sentiment is ${s.label.toLowerCase()} (${s.score.toFixed(2)}).`,
      );
    }
  }

  // 5. Off-hours behaviour (3-5am UTC+7)
  const hour = new Date(tx.timestamp ?? Date.now()).getUTCHours();
  if (hour >= 19 || hour <= 22) {
    // late evening UTC = 2-5am Vietnam → mild signal
    risk += 0.05;
  }

  risk = Math.min(1, Number(risk.toFixed(3)));
  const verdict: FraudResult['verdict'] = risk > 0.7 ? 'BLOCK' : risk > 0.4 ? 'REVIEW' : 'SAFE';
  const recommendedAction =
    verdict === 'BLOCK'
      ? 'Hold transaction. Trigger step-up authentication or manual review.'
      : verdict === 'REVIEW'
      ? 'Show user a confirmation dialog and require explicit consent.'
      : 'Auto-approve transaction.';

  return { riskScore: risk, verdict, reasons, recommendedAction };
}
