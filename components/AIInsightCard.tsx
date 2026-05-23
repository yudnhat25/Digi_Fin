import React, { useEffect, useState } from 'react';
import { apiCoinInsight, CoinInsight } from '../services/coinwiseApi';

const signalColor: Record<CoinInsight['signal'], string> = {
  STRONG_BUY: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40',
  BUY: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  HOLD: 'text-slate-300 bg-slate-700/40 border-slate-700',
  NEUTRAL: 'text-slate-300 bg-slate-700/40 border-slate-700',
  SELL: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  STRONG_SELL: 'text-rose-400 bg-rose-500/20 border-rose-500/40',
};

const AIInsightCard: React.FC<{ symbol: string }> = ({ symbol }) => {
  const [insight, setInsight] = useState<CoinInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiCoinInsight(symbol)
      .then((r) => { if (alive) setInsight(r); })
      .catch(() => { if (alive) setInsight(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [symbol]);

  return (
    <div className="bg-gradient-to-br from-fuchsia-500/10 via-slate-900 to-slate-950 border border-fuchsia-500/20 rounded-3xl p-5 shadow-2xl">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 bg-fuchsia-400 rounded-full animate-pulse" />
        <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-300">AI Alt-Data Insight</p>
      </div>
      {loading && <p className="text-slate-400 text-sm animate-pulse">Aggregating sentiment + whale flow + market mood…</p>}
      {!loading && !insight && <p className="text-slate-500 text-sm">Insight unavailable — is the OpenAPI server running?</p>}
      {insight && (
        <>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-2xl font-black">{insight.symbol.replace('USDT', '')}</p>
              <p className="text-[10px] text-slate-500 font-bold">Composite AI signal</p>
            </div>
            <span className={`text-[11px] font-black uppercase tracking-widest border px-3 py-1.5 rounded-lg ${signalColor[insight.signal]}`}>
              {insight.signal.replace('_', ' ')}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Sentiment</p>
              <p className={`text-sm font-black ${insight.sentiment.score >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {(insight.sentiment.score * 100).toFixed(0)}
              </p>
              <p className="text-[9px] text-slate-500">{insight.sentiment.label}</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Whale 24h</p>
              <p className={`text-sm font-black ${insight.whale.netFlow24hUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {insight.whale.netFlow24hUsd >= 0 ? '+' : '-'}${(Math.abs(insight.whale.netFlow24hUsd) / 1e6).toFixed(2)}M
              </p>
              <p className="text-[9px] text-slate-500">{insight.whale.largeBuys} buys / {insight.whale.largeSells} sells</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Mood</p>
              <p className="text-sm font-black text-amber-400">{insight.fearGreed.value}</p>
              <p className="text-[9px] text-slate-500">{insight.fearGreed.classification}</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{insight.narrative}</p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
              Confidence: <span className="text-fuchsia-300">{(insight.confidence * 100).toFixed(0)}%</span>
            </p>
            <p className="text-[9px] text-slate-500">
              {insight.sentiment.mentions24h.toLocaleString()} 24h mentions
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default AIInsightCard;
