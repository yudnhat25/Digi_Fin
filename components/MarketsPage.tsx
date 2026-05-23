import React, { useState, useMemo } from 'react';
import { MarketData, UserState, WatchlistItem } from '../types';

interface MarketsPageProps {
  marketData: MarketData[];
  user: UserState;
  onSelectAsset: (symbol: string) => void;
  onGoToTerminal: () => void;
  onToggleWatchlist: (symbol: string) => void;
}

type SortKey = 'symbol' | 'price' | 'change24h' | 'high24h' | 'low24h' | 'volume';
type Category = 'ALL' | 'WATCHLIST' | 'GAINERS' | 'LOSERS' | 'MAJORS' | 'DEFI' | 'MEMES' | 'L2';

const CATEGORIES: { id: Category; label: string; filter?: (s: string) => boolean }[] = [
  { id: 'ALL', label: 'All Markets' },
  { id: 'WATCHLIST', label: '★ Watchlist' },
  { id: 'GAINERS', label: 'Top Gainers' },
  { id: 'LOSERS', label: 'Top Losers' },
  { id: 'MAJORS', label: 'Majors', filter: s => ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA'].some(t => s.startsWith(t)) },
  { id: 'DEFI', label: 'DeFi', filter: s => ['UNI', 'AAVE', 'MKR', 'CRV', 'SNX', 'LDO', '1INCH', 'COMP', 'SUSHI', 'YFI', 'DYDX'].some(t => s.startsWith(t)) },
  { id: 'MEMES', label: 'Memes', filter: s => ['DOGE', 'SHIB', 'PEPE', 'BONK', 'FLOKI', 'WIF', 'BOME', 'NEIRO', 'TURBO'].some(t => s.startsWith(t)) },
  { id: 'L2', label: 'Layer 2', filter: s => ['ARB', 'OP', 'MATIC', 'STRK', 'MANTA', 'METIS', 'ZK', 'SCR'].some(t => s.startsWith(t)) }
];

const MarketsPage: React.FC<MarketsPageProps> = ({ marketData, user, onSelectAsset, onGoToTerminal, onToggleWatchlist }) => {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('change24h');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [category, setCategory] = useState<Category>('ALL');

  const watchlistSymbols = useMemo(() => new Set((user.watchlist || []).map(w => w.symbol)), [user.watchlist]);

  const enriched = useMemo(() => marketData.map(m => {
    const volume = m.price * (Math.abs(m.change24h || 0) * 1000 + 50000); // simulated
    return { ...m, volume };
  }), [marketData]);

  const filtered = useMemo(() => {
    let list = enriched;
    const cat = CATEGORIES.find(c => c.id === category);
    if (cat?.filter) list = list.filter(m => cat.filter!(m.symbol));
    if (category === 'WATCHLIST') list = list.filter(m => watchlistSymbols.has(m.symbol));
    if (category === 'GAINERS') list = [...list].sort((a, b) => b.change24h - a.change24h).slice(0, 30);
    if (category === 'LOSERS') list = [...list].sort((a, b) => a.change24h - b.change24h).slice(0, 30);
    if (search) list = list.filter(m => m.symbol.toLowerCase().includes(search.toLowerCase()));
    return [...list].sort((a, b) => {
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [enriched, category, search, sortKey, sortDir, watchlistSymbols]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  // Market overview stats
  const totalMarkets = marketData.length;
  const gainers = marketData.filter(m => m.change24h > 0).length;
  const losers = marketData.filter(m => m.change24h < 0).length;
  const avgChange = marketData.reduce((a, m) => a + m.change24h, 0) / Math.max(totalMarkets, 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter">Markets</h1>
        <p className="text-slate-400 text-sm mt-1">Live prices for {totalMarkets}+ cryptocurrencies · Updated every 10s</p>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">Total Markets</p>
          <p className="text-2xl font-black">{totalMarkets}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">Gainers / Losers</p>
          <p className="text-2xl font-black"><span className="text-emerald-400">{gainers}</span> / <span className="text-rose-500">{losers}</span></p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">Avg. 24h Change</p>
          <p className={`text-2xl font-black ${avgChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%</p>
        </div>
        <div className="bg-slate-900/50 border border-emerald-500/30 rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest font-black text-emerald-500 mb-1">Your Watchlist</p>
          <p className="text-2xl font-black text-emerald-400">{watchlistSymbols.size}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-5 shadow-2xl">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search BTC, ETH, SOL..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <p className="text-xs text-slate-500"><span className="text-white font-bold">{filtered.length}</span> markets shown</p>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(c => (
            <button
              key={c.id} onClick={() => setCategory(c.id)}
              className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl whitespace-nowrap transition ${
                category === c.id ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-5 md:-mx-6">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-slate-500 font-black border-b border-slate-800">
                <th className="px-5 md:px-6 py-3 text-left">★</th>
                <th className="px-3 py-3 text-left cursor-pointer hover:text-white" onClick={() => toggleSort('symbol')}>Pair</th>
                <th className="px-3 py-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('price')}>Price</th>
                <th className="px-3 py-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('change24h')}>24h Change</th>
                <th className="px-3 py-3 text-right hidden md:table-cell cursor-pointer hover:text-white" onClick={() => toggleSort('high24h')}>24h High</th>
                <th className="px-3 py-3 text-right hidden md:table-cell cursor-pointer hover:text-white" onClick={() => toggleSort('low24h')}>24h Low</th>
                <th className="px-3 py-3 text-right hidden lg:table-cell cursor-pointer hover:text-white" onClick={() => toggleSort('volume')}>Volume (24h)</th>
                <th className="px-5 md:px-6 py-3 text-right">Trade</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-20 text-center text-slate-500 italic">No markets match your search.</td></tr>
              ) : filtered.slice(0, 80).map(m => {
                const sym = m.symbol.replace('USDT', '');
                const isWatched = watchlistSymbols.has(m.symbol);
                return (
                  <tr key={m.symbol} className="border-b border-slate-800/40 hover:bg-slate-800/30 transition group">
                    <td className="px-5 md:px-6 py-4">
                      <button onClick={() => onToggleWatchlist(m.symbol)} className={`text-lg leading-none ${isWatched ? 'text-amber-400' : 'text-slate-700 hover:text-amber-400'} transition`}>
                        {isWatched ? '★' : '☆'}
                      </button>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-300`}>
                          {sym.substring(0, 3)}
                        </div>
                        <div>
                          <p className="font-black text-sm">{sym}<span className="text-slate-600">/USDT</span></p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">{sym}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-right font-mono font-bold">${m.price.toLocaleString(undefined, { maximumFractionDigits: m.price < 1 ? 6 : 2 })}</td>
                    <td className={`px-3 py-4 text-right font-black ${m.change24h >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {m.change24h >= 0 ? '+' : ''}{m.change24h.toFixed(2)}%
                    </td>
                    <td className="px-3 py-4 text-right font-mono text-xs text-slate-400 hidden md:table-cell">${m.high24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="px-3 py-4 text-right font-mono text-xs text-slate-400 hidden md:table-cell">${m.low24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="px-3 py-4 text-right font-mono text-xs text-slate-500 hidden lg:table-cell">${(m.volume / 1e6).toFixed(2)}M</td>
                    <td className="px-5 md:px-6 py-4 text-right">
                      <button
                        onClick={() => { onSelectAsset(m.symbol); onGoToTerminal(); }}
                        className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-black text-xs px-4 py-2 rounded-lg uppercase tracking-widest transition"
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarketsPage;
