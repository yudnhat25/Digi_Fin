import React, { useMemo } from 'react';
import { UserState, MarketData } from '../types';
import { useCurrency } from '../services/currency';
import PortfolioChart from './PortfolioChart';

interface PortfolioSummaryProps {
  userState: UserState;
  marketPrices: MarketData[];
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ userState, marketPrices }) => {
  const { format, currency, formatUSD } = useCurrency();
  // Firebase Realtime DB can serialize empty arrays as objects/null when written
  // from a different client — coerce defensively before any .reduce() / .find().
  const assets = Array.isArray(userState?.assets) ? userState.assets : [];
  const prices = Array.isArray(marketPrices) ? marketPrices : [];
  const balance = typeof userState?.balance === 'number' ? userState.balance : 0;

  const assetValue = useMemo(() => assets.reduce((acc, asset) => {
    const marketPrice = prices.find(m => m.symbol === asset.symbol)?.price || 0;
    return acc + (asset.amount * marketPrice);
  }, 0), [assets, prices]);

  const totalValue = balance + assetValue;
  const initialValue = 1_000_000;
  const pnlAbs = totalValue - initialValue;
  const pnlPercent = (pnlAbs / initialValue) * 100;
  const isGain = pnlAbs >= 0;

  const todayPnl = useMemo(() => assets.reduce((acc, a) => {
    const m = prices.find(x => x.symbol === a.symbol);
    if (!m) return acc;
    return acc + (a.amount * m.price * m.change24h / 100);
  }, 0), [assets, prices]);

  return (
    <div className="space-y-5">
      {/* Hero card: headline + interactive chart */}
      <section className="rounded-2xl border border-white/[0.06] bg-[#070b15] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Headline column */}
          <div className="lg:col-span-4 p-6 md:p-7 lg:border-r border-white/[0.06] flex flex-col justify-between gap-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Total Portfolio Value
              </p>
              <p className="mt-3 text-[34px] md:text-[40px] font-semibold tabular-nums tracking-[-0.02em] leading-none break-all">
                {format(totalValue)}
              </p>
              {currency === 'VND' && (
                <p className="mt-2 text-[12.5px] text-slate-500 tabular-nums">
                  ≈ {formatUSD(totalValue, 0)}
                </p>
              )}

              <div className="mt-4 flex items-baseline gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-semibold tabular-nums ${
                    isGain
                      ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20'
                      : 'text-rose-300 bg-rose-500/10 border border-rose-500/20'
                  }`}
                >
                  <Arrow up={isGain} />
                  {isGain ? '+' : ''}{pnlPercent.toFixed(2)}%
                </span>
                <span className={`text-[12.5px] tabular-nums ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isGain ? '+' : '-'}{format(Math.abs(pnlAbs))}
                </span>
                <span className="text-[11px] text-slate-500">all time</span>
              </div>
            </div>

            {/* Mini stats row */}
            <div className="grid grid-cols-3 gap-4 pt-5 border-t border-white/[0.05]">
              <MiniStat
                label="Cash"
                value={format(balance, { compact: true })}
                tone="neutral"
              />
              <MiniStat
                label="Positions"
                value={format(assetValue, { compact: true })}
                sub={`${assets.length} held`}
                tone="neutral"
              />
              <MiniStat
                label="Today"
                value={`${todayPnl >= 0 ? '+' : '-'}${format(Math.abs(todayPnl), { compact: true })}`}
                tone={todayPnl >= 0 ? 'gain' : 'loss'}
              />
            </div>
          </div>

          {/* Chart column */}
          <div className="lg:col-span-8 p-4 md:p-5 lg:p-6 min-h-[280px] flex">
            <PortfolioChart totalValueUsd={totalValue} initialValueUsd={initialValue} format={format} />
          </div>
        </div>
      </section>
    </div>
  );
};

const Arrow: React.FC<{ up: boolean }> = ({ up }) => (
  <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
    {up ? (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l3-3 3 3" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4l3 3 3-3" />
    )}
  </svg>
);

const MiniStat: React.FC<{
  label: string;
  value: string;
  sub?: string;
  tone: 'neutral' | 'gain' | 'loss';
}> = ({ label, value, sub, tone }) => {
  const color =
    tone === 'gain' ? 'text-emerald-400' :
    tone === 'loss' ? 'text-rose-400' : 'text-slate-100';
  return (
    <div>
      <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={`mt-1.5 text-[14.5px] font-semibold tabular-nums ${color}`}>{value}</p>
      {sub && <p className="text-[10.5px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
};

export default PortfolioSummary;
