import React, { useEffect, useState } from 'react';
import { UserState } from '../types';
import { apiAdvisor, AdvisorResult } from '../services/coinwiseApi';
import { useCurrency } from '../services/currency';

type Profile = 'CONSERVATIVE' | 'BALANCED' | 'GROWTH' | 'AGGRESSIVE';

const PROFILES: { key: Profile; label: string; desc: string; color: string }[] = [
  { key: 'CONSERVATIVE', label: 'Conservative', desc: 'Capital preservation, BTC-heavy', color: 'blue' },
  { key: 'BALANCED', label: 'Balanced', desc: '60/40 BTC/ETH + sat tilt', color: 'emerald' },
  { key: 'GROWTH', label: 'Growth', desc: 'L1/L2 + DeFi rotation', color: 'amber' },
  { key: 'AGGRESSIVE', label: 'Aggressive', desc: 'High-beta, mid-cap heavy', color: 'rose' },
];

const COLOR_PALETTE = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#f43f5e', '#06b6d4', '#ec4899', '#84cc16'];

const AIAdvisorPage: React.FC<{ user: UserState }> = ({ user }) => {
  const { format } = useCurrency();
  const [profile, setProfile] = useState<Profile>('BALANCED');
  const [advisor, setAdvisor] = useState<AdvisorResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiAdvisor(user.accountId, profile)
      .then((r) => { if (alive) setAdvisor(r); })
      .catch(console.error)
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [user.accountId, profile]);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-full text-fuchsia-300 text-[10px] font-black uppercase tracking-widest mb-3">
          AI Portfolio Advisor · Alt-data tilted
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2">Smart Allocation Studio</h1>
        <p className="text-slate-400 text-sm max-w-3xl">
          The AI advisor reads social sentiment + on-chain whale flow + market mood, then tilts a target allocation
          against your risk profile. Every recommendation is sourced from the custom OpenAPI <code className="text-fuchsia-300">/api/v1/ai/advisor</code> endpoint.
        </p>
      </div>

      {/* Profile selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {PROFILES.map((p) => (
          <button
            key={p.key}
            onClick={() => setProfile(p.key)}
            className={`p-4 rounded-2xl border text-left transition ${
              profile === p.key
                ? `border-${p.color}-500/60 bg-${p.color}-500/10 shadow-lg`
                : 'border-slate-800 bg-slate-900 hover:border-slate-700'
            }`}
          >
            <p className={`text-xs font-black uppercase tracking-widest text-${p.color}-400 mb-1`}>{p.label}</p>
            <p className="text-[11px] text-slate-400">{p.desc}</p>
          </button>
        ))}
      </div>

      {loading || !advisor ? (
        <div className="text-slate-400 animate-pulse">Crunching alt-data signals…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Donut */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Target Allocation</p>
            <DonutAllocation allocations={advisor.targetAllocation} cashBufferPct={advisor.cashBufferPct} />
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Expected Return / yr</p>
                <p className="text-2xl font-black text-emerald-400">{advisor.expectedReturnPct.toFixed(1)}%</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Volatility</p>
                <p className="text-2xl font-black text-amber-400">{advisor.volatilityPct.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Narrative + Allocation table */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-300 mb-2">AI Narrative</p>
              <p className="text-sm text-slate-200 leading-relaxed">{advisor.narrative}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Holdings &amp; Rationale</p>
              <div className="space-y-2">
                {advisor.targetAllocation.map((a, i) => (
                  <div key={a.symbol} className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black"
                          style={{ backgroundColor: COLOR_PALETTE[i % COLOR_PALETTE.length] + '33', color: COLOR_PALETTE[i % COLOR_PALETTE.length] }}>
                      {a.symbol.replace('USDT', '').slice(0, 3)}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-black">{a.symbol.replace('USDT', '')}</p>
                      <p className="text-[10px] text-slate-500">{a.rationale}</p>
                    </div>
                    <p className="text-lg font-black w-16 text-right">{(a.weight * 100).toFixed(1)}%</p>
                  </div>
                ))}
                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <span className="w-8 h-8 rounded-lg bg-slate-700/50 text-slate-300 flex items-center justify-center text-[10px] font-black">$</span>
                  <div className="flex-1">
                    <p className="text-sm font-black">Cash buffer</p>
                    <p className="text-[10px] text-slate-500">Kept for dip-buy opportunities</p>
                  </div>
                  <p className="text-lg font-black w-16 text-right">{advisor.cashBufferPct.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Rebalance Actions</p>
              <ul className="space-y-2">
                {advisor.rebalanceActions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-fuchsia-400">→</span>
                    <span className="text-slate-300">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DonutAllocation: React.FC<{ allocations: AdvisorResult['targetAllocation']; cashBufferPct: number }> = ({ allocations, cashBufferPct }) => {
  const slices = [
    ...allocations.map((a) => ({ label: a.symbol.replace('USDT', ''), value: a.weight * 100 })),
    { label: 'Cash', value: cashBufferPct },
  ];
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const R = 80;
  return (
    <div className="relative w-full max-w-xs mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-auto">
        {slices.map((s, i) => {
          const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
          acc += s.value;
          const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
          const x1 = 100 + R * Math.cos(start);
          const y1 = 100 + R * Math.sin(start);
          const x2 = 100 + R * Math.cos(end);
          const y2 = 100 + R * Math.sin(end);
          const largeArc = end - start > Math.PI ? 1 : 0;
          const d = `M 100 100 L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          const color = s.label === 'Cash' ? '#475569' : COLOR_PALETTE[i % COLOR_PALETTE.length];
          return <path key={s.label} d={d} fill={color} opacity={0.85} />;
        })}
        <circle cx="100" cy="100" r="45" fill="#0f172a" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Total</p>
        <p className="text-lg font-black">{total.toFixed(1)}%</p>
      </div>
    </div>
  );
};

export default AIAdvisorPage;
