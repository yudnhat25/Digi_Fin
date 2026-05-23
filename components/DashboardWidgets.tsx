import React, { useMemo } from 'react';
import { MarketData, UserState } from '../types';

interface WidgetsProps {
  marketData: MarketData[];
  user: UserState;
  onSelectAsset: (symbol: string) => void;
}

const NEWS_ITEMS = [
  { tag: 'BTC', tagColor: 'amber', t: 'Bitcoin breaks $68K resistance as ETF inflows hit record', s: 'CoinDesk', time: '12m ago' },
  { tag: 'ETH', tagColor: 'blue', t: 'Ethereum L2 fees drop 40% after Dencun upgrade rollout', s: 'The Block', time: '38m ago' },
  { tag: 'DEFI', tagColor: 'violet', t: 'Aave V4 launches with new modular architecture', s: 'Cointelegraph', time: '1h ago' },
  { tag: 'MACRO', tagColor: 'emerald', t: 'Fed signals possible 25bps cut at next FOMC meeting', s: 'Reuters', time: '2h ago' },
  { tag: 'SOL', tagColor: 'cyan', t: 'Solana memecoin volume up 230% week-over-week', s: 'DLNews', time: '3h ago' }
];

export const TopMoversWidget: React.FC<WidgetsProps> = ({ marketData, onSelectAsset }) => {
  const gainers = useMemo(() => [...marketData].sort((a, b) => b.change24h - a.change24h).slice(0, 5), [marketData]);
  const losers = useMemo(() => [...marketData].sort((a, b) => a.change24h - b.change24h).slice(0, 5), [marketData]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-black text-sm uppercase tracking-widest">Top Movers · 24h</h3>
        <span className="text-[10px] font-black text-emerald-400 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-black text-emerald-400 mb-2">Gainers</p>
          <div className="space-y-1">
            {gainers.map(m => (
              <button key={m.symbol} onClick={() => onSelectAsset(m.symbol)} className="w-full flex items-center justify-between text-left px-2 py-2 rounded-lg hover:bg-slate-800/50 transition">
                <span className="text-xs font-bold">{m.symbol.replace('USDT', '')}</span>
                <span className="text-xs font-black text-emerald-400">+{m.change24h.toFixed(2)}%</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest font-black text-rose-400 mb-2">Losers</p>
          <div className="space-y-1">
            {losers.map(m => (
              <button key={m.symbol} onClick={() => onSelectAsset(m.symbol)} className="w-full flex items-center justify-between text-left px-2 py-2 rounded-lg hover:bg-slate-800/50 transition">
                <span className="text-xs font-bold">{m.symbol.replace('USDT', '')}</span>
                <span className="text-xs font-black text-rose-400">{m.change24h.toFixed(2)}%</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const WatchlistWidget: React.FC<WidgetsProps> = ({ marketData, user, onSelectAsset }) => {
  const watchlist = user.watchlist || [];
  const items = useMemo(() => {
    return watchlist.map(w => marketData.find(m => m.symbol === w.symbol)).filter(Boolean) as MarketData[];
  }, [watchlist, marketData]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-black text-sm uppercase tracking-widest">★ Watchlist</h3>
        <span className="text-[10px] text-slate-500 font-black">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-8 italic">Add markets to your watchlist from the Markets page.</p>
      ) : (
        <div className="space-y-1">
          {items.map(m => (
            <button key={m.symbol} onClick={() => onSelectAsset(m.symbol)} className="w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl hover:bg-slate-800/50 transition">
              <div>
                <p className="text-sm font-bold">{m.symbol.replace('USDT', '')}</p>
                <p className="text-[10px] text-slate-500 font-mono">${m.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
              <span className={`text-xs font-black ${m.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {m.change24h >= 0 ? '+' : ''}{m.change24h.toFixed(2)}%
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const NewsWidget: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-black text-sm uppercase tracking-widest">Market News</h3>
        <button className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest">All News</button>
      </div>
      <div className="space-y-4">
        {NEWS_ITEMS.map((n, i) => (
          <div key={i} className="flex gap-3 group cursor-pointer">
            <span className={`text-[9px] font-black uppercase tracking-widest bg-${n.tagColor}-500/15 text-${n.tagColor}-400 px-2 py-1 rounded h-fit shrink-0`}>{n.tag}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs leading-relaxed text-slate-200 group-hover:text-white transition line-clamp-2">{n.t}</p>
              <p className="text-[10px] text-slate-500 mt-1">{n.s} · {n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PortfolioBreakdownWidget: React.FC<WidgetsProps> = ({ marketData, user }) => {
  const breakdown = useMemo(() => {
    return (user.assets || []).map(a => {
      const price = marketData.find(m => m.symbol === a.symbol)?.price || 0;
      return { symbol: a.symbol.replace('USDT', ''), value: a.amount * price };
    }).filter(a => a.value > 0).sort((a, b) => b.value - a.value);
  }, [user.assets, marketData]);

  const totalValue = breakdown.reduce((s, a) => s + a.value, 0);

  const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-pink-500'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-black text-sm uppercase tracking-widest">Allocation</h3>
        <span className="text-[10px] text-slate-500 font-black font-mono">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
      </div>
      {breakdown.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-8 italic">No positions yet. Buy your first asset.</p>
      ) : (
        <>
          <div className="flex h-2 rounded-full overflow-hidden mb-5">
            {breakdown.map((a, i) => (
              <div key={a.symbol} className={colors[i % colors.length]} style={{ width: `${(a.value / totalValue) * 100}%` }} />
            ))}
          </div>
          <div className="space-y-2">
            {breakdown.slice(0, 6).map((a, i) => {
              const pct = (a.value / totalValue) * 100;
              return (
                <div key={a.symbol} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full ${colors[i % colors.length]} shrink-0`} />
                    <span className="text-xs font-bold truncate">{a.symbol}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-500 font-mono">${a.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span className="font-black w-12 text-right">{pct.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
