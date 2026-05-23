import React, { useEffect, useState } from 'react';
import { apiSocialPulse, apiFearGreed, SocialPulseRow, FearGreed } from '../services/coinwiseApi';

const momentumColor: Record<SocialPulseRow['momentum'], string> = {
  Spike: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  Rising: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  Stable: 'text-slate-400 bg-slate-500/10 border-slate-700',
  Cooling: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
};

const SentimentBar: React.FC<{ score: number }> = ({ score }) => {
  const pct = ((score + 1) / 2) * 100;
  const color = score > 0.4 ? 'bg-emerald-500' : score > 0 ? 'bg-emerald-400/70' : score > -0.4 ? 'bg-amber-400/70' : 'bg-rose-500';
  return (
    <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden relative">
      <div className={`absolute inset-y-0 left-1/2 ${color}`} style={{ width: `${Math.abs(pct - 50)}%`, transform: score < 0 ? 'translateX(-100%)' : 'none' }} />
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-600" />
    </div>
  );
};

const FearGreedDial: React.FC<{ fg: FearGreed }> = ({ fg }) => {
  const angle = (fg.value / 100) * 180 - 90;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Fear & Greed Index</p>
      <div className="flex items-center gap-6">
        <div className="relative w-40 h-20 overflow-hidden">
          <svg viewBox="0 0 100 50" className="w-full h-full">
            <defs>
              <linearGradient id="fgGrad" x1="0" x2="1">
                <stop offset="0" stopColor="#f43f5e" />
                <stop offset="0.5" stopColor="#fbbf24" />
                <stop offset="1" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <path d="M5 50 A45 45 0 0 1 95 50" fill="none" stroke="url(#fgGrad)" strokeWidth="6" strokeLinecap="round" />
            <line x1="50" y1="50" x2="50" y2="10" stroke="#f1f5f9" strokeWidth="2" strokeLinecap="round" transform={`rotate(${angle} 50 50)`} />
            <circle cx="50" cy="50" r="3" fill="#f1f5f9" />
          </svg>
        </div>
        <div>
          <p className="text-5xl font-black">{fg.value}</p>
          <p className="text-xs font-black uppercase tracking-widest text-amber-400">{fg.classification}</p>
          <p className={`text-[10px] font-bold mt-1 ${fg.delta24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {fg.delta24h >= 0 ? '+' : ''}{fg.delta24h} pts (24h)
          </p>
        </div>
      </div>
      <div className="mt-5">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">14-day history</p>
        <div className="flex items-end gap-1 h-12">
          {fg.history.map((r) => (
            <div key={r.date} className="flex-1 group relative">
              <div
                className={`w-full rounded-t-sm ${
                  r.value < 30 ? 'bg-rose-500/70' : r.value < 50 ? 'bg-amber-500/70' : r.value < 75 ? 'bg-emerald-400/70' : 'bg-emerald-500'
                }`}
                style={{ height: `${r.value}%` }}
              />
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-800 px-2 py-1 rounded text-[9px] font-bold opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                {r.date} · {r.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SocialPulsePage: React.FC<{ onSelectAsset?: (symbol: string) => void }> = ({ onSelectAsset }) => {
  const [rows, setRows] = useState<SocialPulseRow[]>([]);
  const [fg, setFg] = useState<FearGreed | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [p, f] = await Promise.all([apiSocialPulse(), apiFearGreed()]);
        if (!alive) return;
        setRows(p);
        setFg(f);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const i = setInterval(load, 30_000);
    return () => { alive = false; clearInterval(i); };
  }, []);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-full text-fuchsia-300 text-[10px] font-black uppercase tracking-widest mb-3">
          <span className="w-2 h-2 bg-fuchsia-400 rounded-full animate-pulse" />
          AI Alternative Data
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2">Social Pulse Dashboard</h1>
        <p className="text-slate-400 text-sm">
          AI-aggregated sentiment from Twitter, Reddit & news feeds — refreshed every 30s. Powered by the CoinWise OpenAPI alternative-data layer.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {fg && <FearGreedDial fg={fg} />}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Top Social Movers (24h)</p>
              <h3 className="text-lg font-black">Coins with the loudest crowd</h3>
            </div>
            <span className="text-[10px] font-black text-fuchsia-300 bg-fuchsia-500/10 px-2 py-1 rounded">
              {loading ? 'Loading…' : `${rows.length} tracked`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-left">
                  <th className="py-2 pr-3">Asset</th>
                  <th className="py-2 pr-3">Mentions 24h</th>
                  <th className="py-2 pr-3">Sentiment</th>
                  <th className="py-2 pr-3">Δ</th>
                  <th className="py-2 pr-3">Momentum</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 12).map((r) => (
                  <tr
                    key={r.symbol}
                    onClick={() => onSelectAsset?.(r.symbol)}
                    className="border-t border-slate-800/60 hover:bg-slate-800/30 cursor-pointer transition"
                  >
                    <td className="py-3 pr-3 font-black">{r.symbol.replace('USDT', '')}</td>
                    <td className="py-3 pr-3 font-mono text-xs">{r.mentions24h.toLocaleString()}</td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <SentimentBar score={r.sentiment} />
                        <span className={`text-xs font-bold ${r.sentiment > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {(r.sentiment * 100).toFixed(0)}
                        </span>
                      </div>
                    </td>
                    <td className={`py-3 pr-3 text-xs font-bold ${r.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {r.delta >= 0 ? '+' : ''}{(r.delta * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 pr-3">
                      <span className={`text-[9px] font-black uppercase tracking-widest border px-2 py-0.5 rounded ${momentumColor[r.momentum]}`}>
                        {r.momentum}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <h3 className="text-lg font-black mb-1">How we extract value from non-traditional data</h3>
        <p className="text-slate-400 text-xs mb-4">
          The CoinWise OpenAPI <code className="text-fuchsia-300">/api/v1/market/*</code> endpoints blend three alt-data streams:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { title: '🐦 Social mentions', desc: 'Twitter/X & Reddit volume + tone, weighted by author influence.' },
            { title: '🐋 On-chain whale flow', desc: 'Net large-wallet movement detects smart-money positioning ahead of price.' },
            { title: '😱 Market mood', desc: 'Fear & Greed composite (volatility, momentum, search trends, dominance).' },
          ].map((c) => (
            <div key={c.title} className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <p className="font-black text-sm mb-1">{c.title}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SocialPulsePage;
