/**
 * Live Earn yields — replaces hardcoded product APYs with REAL market data
 * from DefiLlama's free yields API (https://yields.llama.fi/pools, no key).
 *
 * For each asset we take the MEDIAN apy of reputable pools (TVL ≥ $1M, apy in
 * (0, 100]%) sorted by TVL — so a single degenerate/airdrop pool can't skew
 * the number. Cached 30 min. On any failure the result is flagged `degraded`
 * and the frontend falls back to the static per-product estimate.
 *
 * Note: real on-chain yields for wrapped BTC/BNB lending are genuinely tiny
 * (often <1%). We surface the honest number rather than an invented one.
 */
export type EarnSymbol = 'USDT' | 'BTC' | 'ETH' | 'SOL' | 'BNB';

export interface EarnYields {
  yields: Partial<Record<EarnSymbol, number>>; // fraction, e.g. 0.0271
  source: 'defillama' | 'unavailable';
  degraded: boolean;
  asOf: string;
}

// Pool-symbol aliases per asset (DefiLlama keys single-asset pools by token).
const MATCH: Record<EarnSymbol, string[]> = {
  USDT: ['USDT'],
  BTC:  ['WBTC', 'BTCB', 'BTC', 'TBTC', 'CBBTC'],
  ETH:  ['WETH', 'ETH', 'STETH', 'WSTETH', 'RETH', 'CBETH'],
  SOL:  ['SOL', 'MSOL', 'JITOSOL', 'BSOL', 'JSOL'],
  BNB:  ['BNB', 'WBNB', 'BNBX', 'SLISBNB', 'ANKRBNB'],
};

const TTL_MS = 30 * 60 * 1000;
let cache: { data: EarnYields; ts: number } | null = null;

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

interface LlamaPool { symbol?: string; apy?: number; tvlUsd?: number }

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
    (Object.keys(MATCH) as EarnSymbol[]).forEach((sym) => {
      const set = new Set(MATCH[sym]);
      const apys = pools
        .filter((p) => p.symbol && set.has(p.symbol.toUpperCase()))
        .filter((p) => Number.isFinite(p.apy) && (p.apy as number) > 0 && (p.apy as number) <= 100)
        .filter((p) => Number.isFinite(p.tvlUsd) && (p.tvlUsd as number) >= 1_000_000)
        .sort((a, b) => (b.tvlUsd as number) - (a.tvlUsd as number))
        .slice(0, 30)
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
