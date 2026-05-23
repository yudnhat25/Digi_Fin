import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { apiFxRates } from './coinwiseApi';

export type Currency = 'USD' | 'VND';

interface CurrencyCtx {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  usdVnd: number;        // live rate (1 USD = X VND)
  format: (usd: number, opts?: { decimals?: number; compact?: boolean }) => string;
  formatVND: (vnd: number) => string;
  formatUSD: (usd: number, decimals?: number) => string;
  toDisplay: (usd: number) => number; // value in current display currency
}

const CurrencyContext = createContext<CurrencyCtx | null>(null);

const KEY = 'coinwise.currency';

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(KEY) : null;
    return (stored as Currency) || 'USD';
  });
  const [usdVnd, setUsdVnd] = useState<number>(24850);

  useEffect(() => {
    let alive = true;
    const fetchRates = async () => {
      try {
        const r = await apiFxRates();
        if (alive && r.rates.VND) setUsdVnd(r.rates.VND);
      } catch {
        /* keep last known rate */
      }
    };
    fetchRates();
    const interval = setInterval(fetchRates, 60_000);
    return () => { alive = false; clearInterval(interval); };
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    if (typeof window !== 'undefined') localStorage.setItem(KEY, c);
  };

  const value = useMemo<CurrencyCtx>(() => {
    const formatUSD = (usd: number, decimals = 2) =>
      `$${usd.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    const formatVND = (vnd: number) => `${Math.round(vnd).toLocaleString('vi-VN')} ₫`;
    const toDisplay = (usd: number) => (currency === 'VND' ? usd * usdVnd : usd);
    const format = (usd: number, opts?: { decimals?: number; compact?: boolean }) => {
      const decimals = opts?.decimals ?? (currency === 'VND' ? 0 : 2);
      if (currency === 'VND') {
        const vnd = usd * usdVnd;
        if (opts?.compact && Math.abs(vnd) >= 1_000_000_000)
          return `${(vnd / 1_000_000_000).toFixed(2)} tỷ ₫`;
        if (opts?.compact && Math.abs(vnd) >= 1_000_000)
          return `${(vnd / 1_000_000).toFixed(2)} tr ₫`;
        return formatVND(vnd);
      }
      if (opts?.compact && Math.abs(usd) >= 1_000_000)
        return `$${(usd / 1_000_000).toFixed(2)}M`;
      if (opts?.compact && Math.abs(usd) >= 1_000)
        return `$${(usd / 1_000).toFixed(2)}K`;
      return formatUSD(usd, decimals);
    };
    return { currency, setCurrency, usdVnd, format, formatVND, formatUSD, toDisplay };
  }, [currency, usdVnd]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export function useCurrency(): CurrencyCtx {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside <CurrencyProvider>');
  return ctx;
}

export const CurrencyToggle: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { currency, setCurrency, usdVnd } = useCurrency();
  return (
    <div className={`inline-flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 ${compact ? '' : 'shadow-lg'}`}>
      {(['USD', 'VND'] as Currency[]).map((c) => (
        <button
          key={c}
          onClick={() => setCurrency(c)}
          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition ${
            currency === c
              ? c === 'VND'
                ? 'bg-rose-500/20 text-rose-300 shadow-inner'
                : 'bg-emerald-500/20 text-emerald-300 shadow-inner'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {c === 'VND' ? '🇻🇳 VND' : '🇺🇸 USD'}
        </button>
      ))}
      {!compact && (
        <span className="hidden md:inline text-[9px] text-slate-600 font-bold ml-1 mr-1">
          1$ ≈ {usdVnd.toLocaleString('vi-VN')}₫
        </span>
      )}
    </div>
  );
};
