import React, { useEffect, useMemo, useState } from 'react';
import { MarketData, UserState } from '../types';
import { apiMarketNews, MarketNewsItem } from '../services/coinwiseApi';

interface WidgetsProps {
  marketData: MarketData[];
  user: UserState;
  onSelectAsset: (symbol: string) => void;
}

// Fallback shown only if the live news API is unreachable (e.g. offline demo).
const FALLBACK_NEWS: MarketNewsItem[] = [
  { id: 'f1', tag: 'BTC', tagColor: 'amber', title: 'Bitcoin breaks $68K resistance as ETF inflows hit record', source: 'CoinDesk', url: '#', publishedAt: 0 },
  { id: 'f2', tag: 'ETH', tagColor: 'blue', title: 'Ethereum L2 fees drop 40% after Dencun upgrade rollout', source: 'The Block', url: '#', publishedAt: 0 },
  { id: 'f3', tag: 'DEFI', tagColor: 'violet', title: 'Aave V4 launches with new modular architecture', source: 'Cointelegraph', url: '#', publishedAt: 0 },
  { id: 'f4', tag: 'MACRO', tagColor: 'emerald', title: 'Fed signals possible 25bps cut at next FOMC meeting', source: 'Reuters', url: '#', publishedAt: 0 },
  { id: 'f5', tag: 'SOL', tagColor: 'cyan', title: 'Solana memecoin volume up 230% week-over-week', source: 'DLNews', url: '#', publishedAt: 0 },
];

function relativeTime(unixSeconds: number): string {
  if (!unixSeconds) return '';
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

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

const NEWS_POLL_MS = 3 * 60 * 1000; // re-fetch every 3 min so the feed stays live

export const NewsWidget: React.FC = () => {
  const [items, setItems] = useState<MarketNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number>(0);

  useEffect(() => {
    let active = true;

    const load = () =>
      apiMarketNews(6)
        .then((res) => {
          if (!active) return;
          if (res.items?.length) { setItems(res.items); setLive(!res.degraded); setUpdatedAt(Date.now()); }
          else if (!items.length) { setItems(FALLBACK_NEWS); setLive(false); }
        })
        .catch(() => { if (active && !items.length) { setItems(FALLBACK_NEWS); setLive(false); } })
        .finally(() => { if (active) setLoading(false); });

    load(); // initial
    const id = setInterval(load, NEWS_POLL_MS); // continuous refresh
    // Refresh immediately when the user comes back to the tab.
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      active = false;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
          Market News
          {live && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live RSS feed — auto-refreshes every 3 min" />}
          {live && updatedAt > 0 && (
            <span className="text-[9px] font-medium normal-case tracking-normal text-slate-500">
              {relativeTime(Math.floor(updatedAt / 1000))}
            </span>
          )}
        </h3>
        <a
          href="https://cointelegraph.com/"
          target="_blank"
          rel="noreferrer"
          className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest"
        >
          All News
        </a>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <span className="w-10 h-5 rounded bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded bg-slate-800 w-full" />
                <div className="h-2 rounded bg-slate-800 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((n) => {
            const time = relativeTime(n.publishedAt);
            const clickable = n.url && n.url !== '#';
            const Wrapper: any = clickable ? 'a' : 'div';
            const wrapperProps = clickable ? { href: n.url, target: '_blank', rel: 'noreferrer' } : {};
            return (
              <Wrapper key={n.id} {...wrapperProps} className="flex gap-3 group cursor-pointer">
                <span className={`text-[9px] font-black uppercase tracking-widest bg-${n.tagColor}-500/15 text-${n.tagColor}-400 px-2 py-1 rounded h-fit shrink-0`}>{n.tag}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-relaxed text-slate-200 group-hover:text-white transition line-clamp-2">{n.title}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{n.source}{time ? ` · ${time}` : ''}</p>
                </div>
              </Wrapper>
            );
          })}
        </div>
      )}
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
