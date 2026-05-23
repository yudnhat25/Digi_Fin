import React, { useEffect, useState } from 'react';
import { UserState } from '../types';
import { apiCreditScore, CreditScore } from '../services/coinwiseApi';
import { useCurrency } from '../services/currency';

const bandColor: Record<CreditScore['band'], string> = {
  Excellent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  Good: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  Fair: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  Poor: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  Subprime: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
};

const ScoreDial: React.FC<{ score: number; band: CreditScore['band'] }> = ({ score, band }) => {
  const pct = Math.min(1, score / 1000);
  const stroke = 2 * Math.PI * 84;
  const dash = pct * stroke;
  const color =
    band === 'Excellent' ? '#10b981' :
    band === 'Good' ? '#3b82f6' :
    band === 'Fair' ? '#f59e0b' :
    band === 'Poor' ? '#f97316' : '#f43f5e';
  return (
    <div className="relative w-56 h-56 mx-auto">
      <svg viewBox="0 0 200 200" className="-rotate-90">
        <circle cx="100" cy="100" r="84" fill="none" stroke="#1e293b" strokeWidth="14" />
        <circle
          cx="100" cy="100" r="84"
          fill="none" stroke={color} strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${stroke}`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">AI Credit Score</p>
        <p className="text-6xl font-black" style={{ color }}>{score}</p>
        <p className="text-xs font-black uppercase tracking-widest mt-1" style={{ color }}>{band}</p>
        <p className="text-[10px] text-slate-500 mt-1">out of 1000</p>
      </div>
    </div>
  );
};

const CreditScorePage: React.FC<{ user: UserState; onUpgradeClick?: () => void }> = ({ user, onUpgradeClick }) => {
  const { format, formatVND, currency } = useCurrency();
  const [score, setScore] = useState<CreditScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    apiCreditScore(user.accountId)
      .then((r) => { if (alive) setScore(r); })
      .catch((e) => console.error(e))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [user.accountId]);

  if (loading || !score) {
    return <div className="text-slate-400 animate-pulse">Computing your alternative-data credit profile…</div>;
  }

  const factors = [...score.factors].sort((a, b) => b.impact - a.impact);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-full text-fuchsia-300 text-[10px] font-black uppercase tracking-widest mb-3">
          AI Alternative Data · Credit Underwriting
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2">Your CoinWise Credit Score</h1>
        <p className="text-slate-400 text-sm max-w-3xl">
          Built from <span className="text-fuchsia-300 font-bold">non-traditional data</span> — mobile-usage regularity,
          utility-bill payments, trading footprint, deposit cadence and on-chain sentiment exposure. This is the kind of
          underwriting Vietnamese banks still can&apos;t do — unlocking credit for the under-banked.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center">
          <ScoreDial score={score.score} band={score.band} />
          <p className="mt-4 text-sm text-center text-slate-300 max-w-xs">{score.recommendation}</p>
        </div>

        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Lending eligibility</p>
              <h3 className="text-lg font-black">Margin facility unlocked</h3>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest border px-2 py-1 rounded ${bandColor[score.band]}`}>
              {score.band} band
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Max margin loan</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {currency === 'VND' ? formatVND(score.eligibility.marginLoanVnd) : format(score.eligibility.marginLoanVnd / 24850)}
              </p>
              <p className="text-[10px] text-slate-500 font-bold">
                {currency === 'VND'
                  ? `≈ $${(score.eligibility.marginLoanVnd / 24850).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                  : `≈ ${score.eligibility.marginLoanVnd.toLocaleString('vi-VN')} ₫`}
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Premium products</p>
              <p className={`text-2xl font-black mt-1 ${score.eligibility.premiumProducts ? 'text-emerald-400' : 'text-rose-400'}`}>
                {score.eligibility.premiumProducts ? 'Unlocked' : 'Locked'}
              </p>
              <p className="text-[10px] text-slate-500 font-bold">VIP yield, dual-investment</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Updated</p>
              <p className="text-sm font-black mt-1">{new Date(score.asOf).toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 font-bold">Recomputed every session</p>
            </div>
          </div>

          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Factors driving your score</p>
          <div className="space-y-2">
            {factors.map((f) => (
              <div key={f.key} className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
                <div className="flex-1">
                  <p className="text-sm font-bold">{f.label}</p>
                  <p className="text-[10px] text-slate-500">{f.value}</p>
                </div>
                <div className="w-40 h-2 bg-slate-800 rounded-full overflow-hidden relative">
                  <div
                    className={`absolute inset-y-0 left-1/2 ${f.impact >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{
                      width: `${Math.min(50, Math.abs(f.impact) / 4)}%`,
                      transform: f.impact < 0 ? 'translateX(-100%)' : 'none',
                    }}
                  />
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-600" />
                </div>
                <span className={`text-xs font-black w-12 text-right ${f.impact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {f.impact >= 0 ? '+' : ''}{f.impact}
                </span>
              </div>
            ))}
          </div>

          {!score.eligibility.premiumProducts && (
            <button
              onClick={onUpgradeClick}
              className="mt-5 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase tracking-widest text-xs px-4 py-3 rounded-xl transition"
            >
              Upgrade to Pro to unlock premium yield →
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <h3 className="text-lg font-black mb-1">Why alternative data unlocks Vietnam&apos;s under-banked</h3>
        <p className="text-slate-400 text-sm max-w-3xl">
          Traditional credit bureaus see only ~35% of Vietnamese adults. By blending mobile usage, utility-payment regularity,
          and behavioural finance signals from our paper-trading platform, CoinWise can underwrite the other 65% — exactly
          the gap UII incubator targets.
        </p>
      </div>
    </div>
  );
};

export default CreditScorePage;
