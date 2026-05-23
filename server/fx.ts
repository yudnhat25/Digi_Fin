/**
 * FX engine — solves the "non-Vietnamese currency" gap left by Stripe / Plaid.
 *
 * Rates oscillate inside a realistic band so live demos look credible without
 * requiring a paid forex feed. All cross-rates derive from a single USD base.
 */
const startedAt = Date.now();

export interface RateTable {
  base: 'USD';
  asOf: string;
  rates: Record<string, number>;
}

function jitter(amplitude: number) {
  const t = (Date.now() - startedAt) / 1000;
  return Math.sin(t / 37) * amplitude + (Math.random() - 0.5) * amplitude * 0.25;
}

export function getRates(): RateTable {
  const usdVnd = 24850 + jitter(120);
  const usdEur = 0.92 + jitter(0.004);
  const usdJpy = 156.4 + jitter(0.8);
  const usdSgd = 1.34 + jitter(0.01);
  return {
    base: 'USD',
    asOf: new Date().toISOString(),
    rates: {
      USD: 1,
      VND: Math.round(usdVnd),
      EUR: Number(usdEur.toFixed(4)),
      JPY: Number(usdJpy.toFixed(3)),
      SGD: Number(usdSgd.toFixed(4)),
    },
  };
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
    default:
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
