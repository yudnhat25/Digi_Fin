import { StakePosition, MarketData } from '../types';

/**
 * USD value of a user's Earn stakes, for net-worth totals.
 *
 * Coin-native staking: BTC/ETH/SOL/BNB stake principals are in COIN units and
 * are priced via the `{SYMBOL}USDT` pair; USDT stakes are already in USD. Without
 * this, staking made the portfolio/leaderboard value appear to drop by the staked
 * amount until unstake — this folds the locked principal back into net worth.
 *
 * Defensive: tolerates Firebase serializing arrays as objects/null and missing
 * prices (an unpriced coin contributes 0 rather than NaN).
 */
export function stakedValueUsd(
  stakes: StakePosition[] | undefined | null,
  prices: MarketData[] | undefined | null,
): number {
  const list = Array.isArray(stakes) ? stakes : [];
  const px = Array.isArray(prices) ? prices : [];
  return list.reduce((sum, st) => {
    if (!st || typeof st.amount !== 'number') return sum;
    if (st.symbol === 'USDT') return sum + st.amount;
    const price = px.find((m) => m?.symbol === `${st.symbol}USDT`)?.price || 0;
    return sum + st.amount * price;
  }, 0);
}
