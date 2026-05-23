import React, { useMemo } from 'react';
import { UserState, MarketData } from '../types';
import { useCurrency } from '../services/currency';

interface PortfolioSummaryProps {
  userState: UserState;
  marketPrices: MarketData[];
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ userState, marketPrices }) => {
  const { format, currency } = useCurrency();
  const assets = userState.assets || [];
  const balance = typeof userState.balance === 'number' ? userState.balance : 0;

  const assetValue = useMemo(() => assets.reduce((acc, asset) => {
    const marketPrice = marketPrices.find(m => m.symbol === asset.symbol)?.price || 0;
    return acc + (asset.amount * marketPrice);
  }, 0), [assets, marketPrices]);

  const totalValue = balance + assetValue;
  const initialValue = 1000000;
  const pnlAbs = totalValue - initialValue;
  const pnlPercent = (pnlAbs / initialValue) * 100;

  // Today's PnL (simulated based on assets × change24h)
  const todayPnl = useMemo(() => assets.reduce((acc, a) => {
    const m = marketPrices.find(x => x.symbol === a.symbol);
    if (!m) return acc;
    return acc + (a.amount * m.price * m.change24h / 100);
  }, 0), [assets, marketPrices]);

  const cards = [
    {
      label: 'Net Worth',
      value: format(totalValue),
      sub: `${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}% all-time`,
      subColor: pnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400',
      iconBg: 'emerald'
    },
    {
      label: 'Available Cash',
      value: format(balance),
      sub: currency === 'VND' ? 'Ví VND/USDT' : 'USDT Wallet',
      subColor: 'text-slate-500',
      iconBg: 'blue'
    },
    {
      label: 'Portfolio Value',
      value: format(assetValue),
      sub: `${assets.length} positions`,
      subColor: 'text-slate-500',
      iconBg: 'violet'
    },
    {
      label: "Today's P&L",
      value: `${todayPnl >= 0 ? '+' : '-'}${format(Math.abs(todayPnl))}`,
      valueColor: todayPnl >= 0 ? 'text-emerald-400' : 'text-rose-400',
      sub: '24h change',
      subColor: 'text-slate-500',
      iconBg: todayPnl >= 0 ? 'emerald' : 'rose'
    }
  ];

  // Generate sparkline path (deterministic, decorative)
  const sparkPoints = useMemo(() => {
    const N = 30;
    const points: string[] = [];
    let v = 50;
    for (let i = 0; i < N; i++) {
      v += (Math.sin(i * 0.7) * 6) + (Math.random() - 0.5) * 8;
      v = Math.max(10, Math.min(90, v));
      points.push(`${(i / (N - 1)) * 100},${100 - v}`);
    }
    return points.join(' ');
  }, [totalValue]);

  return (
    <div className="space-y-4">
      {/* Hero net worth strip with sparkline */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 md:p-7 shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5 pointer-events-none" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Total Portfolio Value</p>
            <div className="flex items-baseline gap-3 flex-wrap">
              <p className="text-3xl md:text-4xl font-black">{format(totalValue)}</p>
              <span className="text-xs text-slate-500 font-bold">
                {currency === 'VND' ? `≈ $${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-sm font-black ${pnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className={`text-xs font-bold ${pnlAbs >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {pnlAbs >= 0 ? '+' : '-'}{format(Math.abs(pnlAbs))}
              </span>
              <span className="text-xs text-slate-500">all time</span>
            </div>
          </div>
          <div className="md:col-span-2 relative h-24 md:h-auto">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon
                points={`0,100 ${sparkPoints} 100,100`}
                fill="url(#sparkGrad)"
              />
              <polyline
                points={sparkPoints}
                fill="none"
                stroke="#10b981"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c, i) => (
          <div key={i} className="bg-slate-900/50 backdrop-blur border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition">
            <div className={`absolute -top-8 -right-8 w-24 h-24 bg-${c.iconBg}-500/10 rounded-full blur-2xl group-hover:bg-${c.iconBg}-500/20 transition`} />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 relative">{c.label}</p>
            <h3 className={`text-xl md:text-2xl font-black relative ${c.valueColor || 'text-white'}`}>
              {c.value}
            </h3>
            <p className={`text-[10px] mt-1 relative ${c.subColor}`}>{c.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioSummary;
