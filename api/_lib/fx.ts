/**
 * FX engine — solves the "non-Vietnamese currency" gap left by Stripe / Plaid.
 *
 * Pulls live USD-base rates from open.er-api.com (free, no key, has VND) with
 * a jsdelivr CDN fallback. Cached 10 minutes, refreshed in the background on
 * stale reads. If both sources fail we fall back to a synthetic baseline so
 * the demo never hard-fails.
 */
const startedAt = Date.now();

export interface RateTable {
  base: 'USD';
  asOf: string;
  rates: Record<string, number>;
  source?: string;
}

const TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 4000;
const SUPPORTED = ['VND', 'EUR', 'JPY', 'SGD', 'GBP', 'CNY', 'KRW', 'THB'];

// Synthetic baseline used on cold start before the first real fetch resolves,
// and as a permanent fallback if both upstream APIs are unreachable.
function synthetic(): RateTable {
  const t = (Date.now() - startedAt) / 1000;
  const j = (amp: number) => Math.sin(t / 37) * amp + (Math.random() - 0.5) * amp * 0.25;
  return {
    base: 'USD',
    asOf: new Date().toISOString(),
    rates: {
      USD: 1,
      VND: Math.round(25400 + j(120)),
      EUR: Number((0.92 + j(0.004)).toFixed(4)),
      JPY: Number((156.4 + j(0.8)).toFixed(3)),
      SGD: Number((1.34 + j(0.01)).toFixed(4)),
      GBP: Number((0.79 + j(0.004)).toFixed(4)),
      CNY: Number((7.24 + j(0.02)).toFixed(4)),
      KRW: Number((1370 + j(5)).toFixed(2)),
      THB: Number((35.8 + j(0.15)).toFixed(3)),
    },
    source: 'synthetic',
  };
}

let cache: RateTable = synthetic();
let cacheTs = 0;
let inflight: Promise<void> | null = null;

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    p.then((v) => { clearTimeout(timer); resolve(v); }, (e) => { clearTimeout(timer); reject(e); });
  });
}

async function fetchPrimary(): Promise<Partial<Record<string, number>> | null> {
  try {
    const r = await withTimeout(
      fetch('https://open.er-api.com/v6/latest/USD', { headers: { Accept: 'application/json' } }),
      FETCH_TIMEOUT_MS,
    );
    if (!r.ok) return null;
    const j = (await r.json()) as { result?: string; rates?: Record<string, number> };
    if (j.result !== 'success' || !j.rates) return null;
    return j.rates;
  } catch { return null; }
}

async function fetchFallback(): Promise<Partial<Record<string, number>> | null> {
  try {
    // jsdelivr CDN of @fawazahmed0/currency-api — completely free, no key.
    // Currencies are lowercase in this dataset.
    const r = await withTimeout(
      fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json'),
      FETCH_TIMEOUT_MS,
    );
    if (!r.ok) return null;
    const j = (await r.json()) as { usd?: Record<string, number> };
    if (!j.usd) return null;
    const upper: Record<string, number> = {};
    for (const [k, v] of Object.entries(j.usd)) upper[k.toUpperCase()] = v;
    return upper;
  } catch { return null; }
}

async function refreshRates(): Promise<void> {
  const primary = await fetchPrimary();
  const raw = primary || (await fetchFallback());
  if (!raw) return; // keep last good cache; if cache was synthetic, stays synthetic

  const rates: Record<string, number> = { USD: 1 };
  for (const code of SUPPORTED) {
    const v = Number(raw[code]);
    if (Number.isFinite(v) && v > 0) {
      rates[code] = code === 'VND' || code === 'KRW' ? Math.round(v) : Number(v.toFixed(6));
    }
  }
  if (!rates.VND) return; // refuse a feed that doesn't have our anchor pair

  cache = {
    base: 'USD',
    asOf: new Date().toISOString(),
    rates,
    source: primary ? 'open.er-api.com' : 'jsdelivr-fawazahmed0',
  };
  cacheTs = Date.now();
}

function maybeRefresh(): void {
  if (Date.now() - cacheTs < TTL_MS) return;
  if (inflight) return;
  inflight = refreshRates().finally(() => { inflight = null; });
}

// Warm cache on module load so the first request after cold start usually
// gets live rates (the inflight promise resolves within ~200-400ms).
maybeRefresh();

export function getRates(): RateTable {
  maybeRefresh();
  return cache;
}

export function convert(amount: number, from: string, to: string): {
  rate: number;
  result: number;
  formatted: string;
} {
  const { rates } = getRates();
  const f = rates[from.toUpperCase()];
  const t = rates[to.toUpperCase()];
  if (!f || !t) throw new Error(`Unsupported currency pair ${from}/${to}`);
  const usd = amount / f;
  const result = usd * t;
  const rate = t / f;
  return {
    rate: Number(rate.toFixed(6)),
    result: to.toUpperCase() === 'VND' ? Math.round(result) : Number(result.toFixed(2)),
    formatted: formatCurrency(result, to.toUpperCase()),
  };
}

export function usdToVnd(usd: number): number {
  return Math.round(usd * getRates().rates.VND);
}

export function vndToUsd(vnd: number): number {
  return Number((vnd / getRates().rates.VND).toFixed(2));
}

export function formatCurrency(amount: number, currency: string): string {
  switch (currency.toUpperCase()) {
    case 'VND':
      return `${Math.round(amount).toLocaleString('vi-VN')} ₫`;
    case 'EUR':
      return `€${amount.toFixed(2)}`;
    case 'JPY':
      return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
    case 'SGD':
      return `S$${amount.toFixed(2)}`;
    case 'GBP':
      return `£${amount.toFixed(2)}`;
    case 'CNY':
      return `¥${amount.toFixed(2)}`;
    case 'KRW':
      return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
    case 'THB':
      return `฿${amount.toFixed(2)}`;
    default:
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
