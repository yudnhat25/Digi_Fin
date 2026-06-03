/**
 * Live Earn yields — replaces hardcoded product APYs with REAL market data
 * from DefiLlama's free yields API (https://yields.llama.fi/pools, no key).
 *
 * We separate the two real ways to "deposit" a coin so the number reflects
 * what a user would actually earn, not a diluted average:
 *
 *   • staking  (ETH/SOL/BNB): match only the liquid-staking derivative tokens
 *     (stETH, rETH, cbETH, mSOL, jitoSOL, slisBNB…) and require apy > 1% — this
 *     excludes lending markets of those same tokens that yield ~0% and would
 *     otherwise drag the median down to nothing.
 *   • lending  (USDT/BTC): match the base token's lending pools. We keep the
 *     honest number even when it's tiny — wrapped-BTC lending genuinely earns
 *     ~0% because almost nobody borrows BTC on-chain.
 *
 * Per asset we take the MEDIAN apy of single-exposure pools with TVL ≥ $10M
 * (top 20 by TVL) so one degenerate/airdrop pool can't skew it. Cached 30 min.
 * On failure the result is flagged `degraded` and the frontend falls back to
 * the static per-product estimate.
 */
export type EarnSymbol = 'USDT' | 'BTC' | 'ETH' | 'SOL' | 'BNB';

export interface EarnYields {
  yields: Partial<Record<EarnSymbol, number>>; // fraction, e.g. 0.0271
  source: 'defillama' | 'unavailable';
  degraded: boolean;
  asOf: string;
}

interface AssetCfg { match: string[]; kind: 'staking' | 'lending' }

const ASSETS: Record<EarnSymbol, AssetCfg> = {
  USDT: { match: ['USDT'], kind: 'lending' },
  BTC:  { match: ['WBTC', 'BTCB', 'TBTC', 'CBBTC'], kind: 'lending' },
  ETH:  { match: ['STETH', 'WSTETH', 'RETH', 'CBETH'], kind: 'staking' },
  SOL:  { match: ['MSOL', 'JITOSOL', 'BSOL', 'JSOL'], kind: 'staking' },
  BNB:  { match: ['SLISBNB', 'BNBX', 'ANKRBNB'], kind: 'staking' },
};

const MIN_TVL = 10_000_000;
const STAKING_FLOOR = 1.0; // % — below this an LSD pool is a lending market, not staking
const TTL_MS = 30 * 60 * 1000;
let cache: { data: EarnYields; ts: number } | null = null;

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

interface LlamaPool { symbol?: string; apy?: number; tvlUsd?: number; exposure?: string }

export async function getEarnYields(): Promise<EarnYields> {
  const now = Date.now();
  if (cache && now - cache.ts < TTL_MS) return cache.data;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch('https://yields.llama.fi/pools', {
      signal: ctrl.signal,
      headers: { accept: 'application/json' },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`http ${res.status}`);
    const json = (await res.json()) as { data?: LlamaPool[] };
    const pools = json.data || [];
    if (!pools.length) throw new Error('empty payload');

    const out: Partial<Record<EarnSymbol, number>> = {};
    (Object.keys(ASSETS) as EarnSymbol[]).forEach((sym) => {
      const cfg = ASSETS[sym];
      const set = new Set(cfg.match);
      const floor = cfg.kind === 'staking' ? STAKING_FLOOR : 0;
      const apys = pools
        .filter((p) => p.symbol && set.has(p.symbol.toUpperCase()))
        .filter((p) => p.exposure === 'single')
        .filter((p) => Number.isFinite(p.apy) && (p.apy as number) > floor && (p.apy as number) <= 100)
        .filter((p) => Number.isFinite(p.tvlUsd) && (p.tvlUsd as number) >= MIN_TVL)
        .sort((a, b) => (b.tvlUsd as number) - (a.tvlUsd as number))
        .slice(0, 20)
        .map((p) => p.apy as number);
      if (apys.length) out[sym] = Number((median(apys) / 100).toFixed(4));
    });

    if (!Object.keys(out).length) throw new Error('no symbol matches');

    const data: EarnYields = {
      yields: out,
      source: 'defillama',
      degraded: false,
      asOf: new Date().toISOString(),
    };
    cache = { data, ts: now };
    return data;
  } catch {
    return { yields: {}, source: 'unavailable', degraded: true, asOf: new Date().toISOString() };
  }
}
