import React, { useEffect, useState } from 'react';
import { UserState } from '../types';
import { apiFraudCheck, FraudCheck } from '../services/coinwiseApi';
import { useCurrency } from '../services/currency';

interface Scanned {
  id: string;
  asset: string;
  total: number;
  type: string;
  timestamp: number;
  check: FraudCheck;
}

const verdictBadge = (v: FraudCheck['verdict']) => {
  switch (v) {
    case 'BLOCK': return { color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', label: 'BLOCKED', icon: '🚫' };
    case 'REVIEW': return { color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', label: 'REVIEW', icon: '⚠️' };
    default: return { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'SAFE', icon: '✅' };
  }
};

const FraudShieldPage: React.FC<{ user: UserState }> = ({ user }) => {
  const { format } = useCurrency();
  const [scans, setScans] = useState<Scanned[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const recent = user.transactions.slice(-15).reverse();
    Promise.all(
      recent.map(async (tx) => {
        const check = await apiFraudCheck(user.accountId, {
          type: tx.type,
          asset: tx.asset,
          amount: tx.amount,
          price: tx.price,
          total: tx.total,
          timestamp: tx.timestamp,
        });
        return {
          id: tx.id,
          asset: tx.asset,
          total: Math.abs(tx.total),
          type: tx.type,
          timestamp: tx.timestamp,
          check,
        } as Scanned;
      }),
    )
      .then((arr) => { if (alive) setScans(arr); })
      .catch(console.error)
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [user.accountId, user.transactions]);

  const stats = scans.reduce(
    (acc, s) => {
      acc[s.check.verdict] = (acc[s.check.verdict] || 0) + 1;
      acc.avgRisk += s.check.riskScore;
      return acc;
    },
    { SAFE: 0, REVIEW: 0, BLOCK: 0, avgRisk: 0 } as Record<string, number>,
  );
  if (scans.length) stats.avgRisk = stats.avgRisk / scans.length;

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-full text-fuchsia-300 text-[10px] font-black uppercase tracking-widest mb-3">
          AI Fraud Shield · Real-time risk
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2">Anomaly &amp; Fraud Detection</h1>
        <p className="text-slate-400 text-sm max-w-3xl">
          Every transaction is run through the CoinWise OpenAPI <code className="text-fuchsia-300">/api/v1/ai/fraud-check</code> endpoint —
          a behavioural anomaly detector that uses velocity, notional, cash-burst and sentiment contradiction signals.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Avg risk score', value: `${(stats.avgRisk * 100).toFixed(0)}%`, color: 'text-amber-400' },
          { label: 'Safe', value: stats.SAFE, color: 'text-emerald-400' },
          { label: 'Review', value: stats.REVIEW, color: 'text-amber-400' },
          { label: 'Blocked', value: stats.BLOCK, color: 'text-rose-400' },
        ].map((s) => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <h3 className="text-lg font-black mb-4">Recent transaction scans</h3>
        {loading && <p className="text-slate-400 animate-pulse">Scanning your transactions…</p>}
        {!loading && scans.length === 0 && (
          <p className="text-slate-500 text-sm">No transactions yet — execute a trade to see the fraud shield in action.</p>
        )}
        <div className="space-y-2">
          {scans.map((s) => {
            const b = verdictBadge(s.check.verdict);
            return (
              <div key={s.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{b.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm font-black">
                      {s.type} {s.asset.replace('USDT', '')} · {format(s.total)}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold">{new Date(s.timestamp).toLocaleString()}</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest border px-2 py-1 rounded ${b.color}`}>
                    {b.label}
                  </span>
                  <div className="w-24">
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${s.check.riskScore > 0.7 ? 'bg-rose-500' : s.check.riskScore > 0.4 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${s.check.riskScore * 100}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-slate-500 font-bold mt-1 text-right">
                      Risk {(s.check.riskScore * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                {s.check.reasons.length > 0 && (
                  <div className="mt-3 pl-12 space-y-1">
                    {s.check.reasons.map((r, i) => (
                      <p key={i} className="text-[11px] text-slate-400 flex items-start gap-2">
                        <span className="text-fuchsia-400">•</span> {r}
                      </p>
                    ))}
                    <p className="text-[10px] text-slate-500 italic mt-1">→ {s.check.recommendedAction}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FraudShieldPage;
