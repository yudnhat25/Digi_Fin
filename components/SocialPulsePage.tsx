import React, { useEffect, useMemo, useState } from 'react';
import {
  apiSocialPulse,
  apiFearGreedFull,
  SocialPulseRow,
  FearGreedFull,
  FgPoint,
} from '../services/coinwiseApi';

// ─── F&G band classification ───
const classBand = (v: number) =>
  v < 25 ? 'Extreme Fear' :
  v < 45 ? 'Fear' :
  v < 55 ? 'Neutral' :
  v < 75 ? 'Greed' : 'Extreme Greed';
const bandTone = (v: number) =>
  v < 25 ? { hex: '#dc2626', text: 'text-rose-400', glow: 'bg-rose-500/10' } :
  v < 45 ? { hex: '#f97316', text: 'text-orange-400', glow: 'bg-orange-500/10' } :
  v < 55 ? { hex: '#eab308', text: 'text-amber-400', glow: 'bg-amber-500/10' } :
  v < 75 ? { hex: '#22c55e', text: 'text-emerald-400', glow: 'bg-emerald-500/10' } :
           { hex: '#10b981', text: 'text-emerald-300', glow: 'bg-emerald-500/15' };

const fmtBig = (n: number) => {
  if (n >= 1e12) return (n / 1e12).toFixed(2).replace(/\.?0+$/, '') + 'T';
  if (n >= 1e9)  return (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
  if (n >= 1e6)  return (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (n >= 1e3)  return (n / 1e3).toFixed(2).replace(/\.?0+$/, '') + 'K';
  return n.toFixed(2);
};
const fmtUsd = (n: number) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 });
const fmtDate = (s: string) => {
  const d = new Date(s);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};
const fmtPct = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';

// ─── Clean semi-circle gauge with smooth gradient + needle ───
const Gauge: React.FC<{ value: number }> = ({ value }) => {
  const cx = 180, cy = 175, r = 130, thickness = 22;
  const v = Math.min(Math.max(value, 0), 100);
  const ang = Math.PI - (v / 100) * Math.PI;
  // Needle is shorter than the arc so the tip sits inside the band, not on it.
  const needleLen = r - 18;
  const tipX = cx + needleLen * Math.cos(ang);
  const tipY = cy - needleLen * Math.sin(ang);

  // Full-arc gradient path.
  const startX = cx - r, startY = cy;
  const endX = cx + r, endY = cy;
  const arcPath = `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;

  return (
    <svg viewBox="0 0 360 210" className="w-full max-w-[360px]">
      <defs>
        <linearGradient id="fgArcGradient" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%"   stopColor="#dc2626" />
          <stop offset="22%"  stopColor="#ef4444" />
          <stop offset="42%"  stopColor="#f59e0b" />
          <stop offset="55%"  stopColor="#fbbf24" />
          <stop offset="72%"  stopColor="#84cc16" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      {/* track */}
      <path d={arcPath} fill="none" stroke="#1e293b" strokeWidth={thickness + 2} strokeLinecap="round" opacity={0.6} />
      {/* gradient arc */}
      <path d={arcPath} fill="none" stroke="url(#fgArcGradient)" strokeWidth={thickness} strokeLinecap="round" />
      {/* needle drop shadow */}
      <line
        x1={cx} y1={cy} x2={tipX} y2={tipY}
        stroke="#000" strokeWidth={6} strokeLinecap="round" opacity={0.4}
        filter="url(#needleGlow)"
      />
      {/* needle */}
      <line
        x1={cx} y1={cy} x2={tipX} y2={tipY}
        stroke="#f8fafc" strokeWidth={4} strokeLinecap="round"
      />
      {/* needle tip cap */}
      <circle cx={tipX} cy={tipY} r={5} fill="#f8fafc" />
      {/* pivot — outer dark ring + white cap */}
      <circle cx={cx} cy={cy} r={11} fill="#0f172a" stroke="#1e293b" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={6} fill="#f8fafc" />
    </svg>
  );
};

// ─── F&G + BTC overlay chart ───
const OverlayChart: React.FC<{
  fg: FgPoint[];
  btc: { date: string; priceUsd: number; volumeUsd: number }[];
}> = ({ fg, btc }) => {
  const w = 880, h = 360, padL = 56, padR = 56, padT = 24, padB = 56;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const fgByDate = new Map(fg.map((p) => [p.date, p]));
  const aligned = btc.filter((b) => fgByDate.has(b.date));
  const n = Math.max(fg.length, aligned.length, 1);

  const priceMin = aligned.length ? Math.min(...aligned.map((p) => p.priceUsd)) * 0.92 : 0;
  const priceMax = aligned.length ? Math.max(...aligned.map((p) => p.priceUsd)) * 1.05 : 1;
  const volMax = aligned.length ? Math.max(...aligned.map((p) => p.volumeUsd)) : 1;

  const xFor = (i: number) => padL + (i / Math.max(n - 1, 1)) * innerW;
  const yFg = (v: number) => padT + (1 - v / 100) * (innerH * 0.78);
  const yBtc = (v: number) => padT + (1 - (v - priceMin) / Math.max(priceMax - priceMin, 1)) * (innerH * 0.78);
  const yVol = (v: number) => padT + innerH * 0.78 + (1 - v / Math.max(volMax, 1)) * (innerH * 0.22);

  const fgSegs: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
  for (let i = 1; i < fg.length; i++) {
    const a = fg[i - 1];
    const b = fg[i];
    fgSegs.push({
      x1: xFor(i - 1), y1: yFg(a.value),
      x2: xFor(i),     y2: yFg(b.value),
      color: bandTone(b.value).hex,
    });
  }
  const btcPath = aligned.map((p, i) => {
    const idx = fg.findIndex((f) => f.date === p.date);
    const x = xFor(idx >= 0 ? idx : i);
    const y = yBtc(p.priceUsd);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  const volSample = Math.max(1, Math.floor(aligned.length / 120));
  const vols = aligned.filter((_, i) => i % volSample === 0);

  const priceTicks = 5;
  const fgTicks = 5;
  const dateLabelStep = Math.max(1, Math.floor(fg.length / 6));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      {Array.from({ length: priceTicks + 1 }).map((_, i) => {
        const y = padT + (i / priceTicks) * innerH * 0.78;
        return <line key={`g${i}`} x1={padL} x2={w - padR} y1={y} y2={y} stroke="#1e293b" strokeWidth={0.5} />;
      })}
      <path d={btcPath} fill="none" stroke="#e2e8f0" strokeWidth={1.6} opacity={0.75} />
      {fgSegs.map((s, i) => (
        <line key={`fg${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.color} strokeWidth={2} />
      ))}
      {vols.map((p, i) => {
        const idx = fg.findIndex((f) => f.date === p.date);
        const x = xFor(idx >= 0 ? idx : i * volSample);
        const yTop = yVol(p.volumeUsd);
        const yBot = h - padB;
        return <line key={`v${i}`} x1={x} y1={yTop} x2={x} y2={yBot} stroke="#a855f7" strokeWidth={1.5} opacity={0.4} />;
      })}
      {Array.from({ length: priceTicks + 1 }).map((_, i) => {
        const y = padT + (i / priceTicks) * innerH * 0.78;
        const v = priceMax - (i / priceTicks) * (priceMax - priceMin);
        return (
          <text key={`pl${i}`} x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fontWeight="700" fill="#64748b">
            {Math.round(v / 1000)}K
          </text>
        );
      })}
      {Array.from({ length: fgTicks + 1 }).map((_, i) => {
        const y = padT + (i / fgTicks) * innerH * 0.78;
        const v = 100 - (i / fgTicks) * 100;
        return (
          <text key={`fr${i}`} x={w - padR + 8} y={y + 4} textAnchor="start" fontSize="10" fontWeight="700" fill="#64748b">
            {Math.round(v)}
          </text>
        );
      })}
      {fg.filter((_, i) => i % dateLabelStep === 0).map((p, i) => {
        const idx = i * dateLabelStep;
        const x = xFor(idx);
        const d = new Date(p.date);
        const label = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
        return (
          <text key={`xd${i}`} x={x} y={h - padB + 18} textAnchor="middle" fontSize="10" fontWeight="700" fill="#64748b">
            {label}
          </text>
        );
      })}
      {fg.length > 0 && (
        <g transform={`translate(${w - padR - 100}, ${padT})`}>
          <rect width="90" height="24" rx="8" fill="#0f172a" stroke="#334155" />
          <text x="45" y="16" textAnchor="middle" fontSize="11" fontWeight="800" fill="#cbd5e1" letterSpacing="0.05em">
            {fmtDate(fg[fg.length - 1].date)}
          </text>
        </g>
      )}
    </svg>
  );
};

const HistRow: React.FC<{ label: string; pt: FgPoint | null }> = ({ label, pt }) => {
  if (!pt) return null;
  const tone = bandTone(pt.value);
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-800/60 last:border-0">
      <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      <span className={`inline-flex items-center gap-2 text-sm font-black ${tone.text}`}>
        <span className="w-1.5 h-4 rounded-sm" style={{ background: tone.hex }} />
        {classBand(pt.value)} · {Math.round(pt.value)}
      </span>
    </div>
  );
};

// ─── Sentiment bar for movers table ───
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

const momentumColor: Record<SocialPulseRow['momentum'], string> = {
  Spike: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  Rising: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  Stable: 'text-slate-400 bg-slate-500/10 border-slate-700',
  Cooling: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
};

// ─── Main page ───
const SocialPulsePage: React.FC<{ onSelectAsset?: (symbol: string) => void }> = ({ onSelectAsset }) => {
  const [fgData, setFgData] = useState<FearGreedFull | null>(null);
  const [rows, setRows] = useState<SocialPulseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<'overview' | 'chart'>('overview');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [fg, pulse] = await Promise.all([
          apiFearGreedFull().catch(() => null),
          apiSocialPulse().catch(() => []),
        ]);
        if (!alive) return;
        setFgData(fg);
        setRows(pulse);
        setErr(null);
      } catch (e) {
        if (alive) setErr((e as Error).message);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const i = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(i); };
  }, []);

  const summary = useMemo(() => {
    if (!fgData) return '';
    const cur = fgData.fearGreed.current.value;
    const week = fgData.fearGreed.periods.lastWeek?.value ?? cur;
    const month = fgData.fearGreed.periods.lastMonth?.value ?? cur;
    const moved = Math.abs(cur - week) > 10 || Math.abs(cur - month) > 15;
    const bandCur = classBand(cur);
    const bandWeek = classBand(week);
    if (bandCur === bandWeek && !moved) {
      return `Market stable in the ${bandCur} zone at ${Math.round(cur)}/100. No major sentiment swings.`;
    }
    return `Sentiment oscillating between ${bandWeek} and ${bandCur}. Market balanced, avoiding extreme readings.`;
  }, [fgData]);

  const cur = fgData?.fearGreed.current.value ?? 0;
  const curTone = bandTone(cur);

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* ──── Header ──── */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-full text-fuchsia-300 text-[10px] font-black uppercase tracking-widest mb-3">
          <span className="w-2 h-2 bg-fuchsia-400 rounded-full animate-pulse" />
          AI Alternative Data · Live
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2">Social Pulse Dashboard</h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          AI-aggregated market mood — Fear &amp; Greed Index plus crowd sentiment from Twitter, Reddit &amp; news. Refreshed every 60s, powered by the CoinWise OpenAPI alt-data layer.
        </p>
      </div>

      {err && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.04] p-4 text-sm text-rose-200">
          Failed to load data: {err}
        </div>
      )}

      {/* ──── FEAR & GREED hero section ──── */}
      {fgData ? (
        <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 overflow-hidden">
          {/* ambient glows */}
          <div className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl ${curTone.glow}`} />
          <div className="absolute -bottom-32 -right-24 w-80 h-80 bg-fuchsia-500/[0.06] rounded-full blur-3xl" />

          <div className="relative flex items-start justify-between gap-4 flex-wrap mb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Market Mood · 1Y</p>
              <h2 className="text-2xl md:text-3xl font-black tracking-tighter">Fear &amp; Greed Index</h2>
              <p className="text-slate-400 text-xs mt-2 max-w-xl flex items-start gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4 mt-0.5 text-fuchsia-400 shrink-0" fill="currentColor">
                  <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zm6 11l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
                </svg>
                <span><span className="text-fuchsia-300 font-black uppercase tracking-widest text-[10px]">AI Insight · </span>{summary}</span>
              </p>
            </div>
            <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950/50 p-1 shrink-0">
              <button
                onClick={() => setTab('overview')}
                className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-lg transition ${
                  tab === 'overview' ? 'bg-fuchsia-500/15 text-fuchsia-200' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setTab('chart')}
                className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-lg transition ${
                  tab === 'chart' ? 'bg-fuchsia-500/15 text-fuchsia-200' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                1Y Chart
              </button>
            </div>
          </div>

          {tab === 'overview' ? (
            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Gauge + headline value — span 5 */}
              <div className="lg:col-span-5 bg-slate-950/60 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl ${curTone.glow}`} />
                <p className="relative text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Fear &amp; Greed Index</p>
                <div className="relative flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Gauge value={cur} />
                  </div>
                  <div className="shrink-0 pr-2">
                    <p className="text-6xl font-black tracking-tighter text-white leading-none">
                      {Math.round(cur)}
                    </p>
                    <p className={`mt-2 text-base font-black uppercase tracking-widest ${curTone.text}`}>
                      {classBand(cur)}
                    </p>
                    <p className={`mt-1 text-xs font-black ${fgData.fearGreed.delta24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {fgData.fearGreed.delta24h >= 0 ? '+' : ''}{fgData.fearGreed.delta24h} pts (24h)
                    </p>
                  </div>
                </div>
              </div>

              {/* Right column — history + hi/lo + cards */}
              <div className="lg:col-span-7 space-y-5">
                <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Historical Data</p>
                  <div className="mt-1">
                    <HistRow label="Yesterday" pt={fgData.fearGreed.periods.yesterday} />
                    <HistRow label="Last week" pt={fgData.fearGreed.periods.lastWeek} />
                    <HistRow label="Last month" pt={fgData.fearGreed.periods.lastMonth} />
                    <HistRow label="Last year" pt={fgData.fearGreed.periods.lastYear} />
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Yearly High &amp; Low</p>
                  <div className="flex items-center justify-between py-3.5 border-b border-slate-800/60">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                      High · <span className="text-slate-600 normal-case font-bold tracking-normal">{fmtDate(fgData.fearGreed.yearHigh.date)}</span>
                    </span>
                    <span className="inline-flex items-center gap-2 text-sm font-black text-emerald-400">
                      <span className="w-1.5 h-4 rounded-sm bg-emerald-400" />
                      {classBand(fgData.fearGreed.yearHigh.value)} · {Math.round(fgData.fearGreed.yearHigh.value)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3.5">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                      Low · <span className="text-slate-600 normal-case font-bold tracking-normal">{fmtDate(fgData.fearGreed.yearLow.date)}</span>
                    </span>
                    <span className="inline-flex items-center gap-2 text-sm font-black text-rose-400">
                      <span className="w-1.5 h-4 rounded-sm bg-rose-400" />
                      {classBand(fgData.fearGreed.yearLow.value)} · {Math.round(fgData.fearGreed.yearLow.value)}
                    </span>
                  </div>
                </div>

                {fgData.btc && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative bg-slate-950/60 border border-slate-800 rounded-3xl p-5 overflow-hidden">
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/[0.08] rounded-full blur-2xl" />
                      <p className="relative text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Total Market Cap</p>
                      <p className={`relative text-2xl font-black tracking-tighter ${fgData.btc.marketCapChange24hPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {fmtPct(fgData.btc.marketCapChange24hPct)}
                      </p>
                      <p className="relative text-[11px] font-bold text-slate-500 mt-1">${fmtBig(fgData.btc.totalMarketCapUsd)} USD</p>
                    </div>
                    <div className="relative bg-slate-950/60 border border-slate-800 rounded-3xl p-5 overflow-hidden">
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-fuchsia-500/[0.08] rounded-full blur-2xl" />
                      <p className="relative text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">24h Volume</p>
                      <p className={`relative text-2xl font-black tracking-tighter ${fgData.btc.priceChange24hPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {fmtPct(fgData.btc.priceChange24hPct)}
                      </p>
                      <p className="relative text-[11px] font-bold text-slate-500 mt-1">${fmtBig(fgData.btc.totalVolume24hUsd)} USD</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="relative bg-slate-950/60 border border-slate-800 rounded-3xl p-6">
              <div className="flex items-baseline flex-wrap gap-6 mb-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">F&amp;G Now</p>
                  <p className={`text-lg font-black tracking-tighter ${curTone.text}`}>
                    {classBand(cur)} · {Math.round(cur)}
                  </p>
                </div>
                {fgData.btc && (
                  <>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">BTC Price</p>
                      <p className="text-lg font-black tracking-tighter text-slate-100">{fmtUsd(fgData.btc.priceUsd)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">24h Volume</p>
                      <p className="text-lg font-black tracking-tighter text-slate-100">${fmtBig(fgData.btc.volume24hUsd)}</p>
                    </div>
                  </>
                )}
              </div>
              <OverlayChart
                fg={fgData.fearGreed.history}
                btc={fgData.btcHistory?.points || []}
              />
              <div className="flex flex-wrap items-center gap-4 mt-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span className="inline-flex items-center gap-2"><span className="w-3 h-0.5 bg-slate-200" /> BTC Price</span>
                <span className="inline-flex items-center gap-2"><span className="w-3 h-0.5 bg-emerald-400" /> F&amp;G High</span>
                <span className="inline-flex items-center gap-2"><span className="w-3 h-0.5 bg-rose-400" /> F&amp;G Low</span>
                <span className="inline-flex items-center gap-2"><span className="w-2 h-2.5 bg-fuchsia-500/60" /> BTC Volume</span>
              </div>
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center text-slate-500 text-sm font-bold">
          Loading Fear &amp; Greed data…
        </div>
      ) : null}

      {/* ──── Top Social Movers ──── */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-fuchsia-500/[0.08] rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Top Social Movers · 24h</p>
            <h3 className="text-lg md:text-xl font-black tracking-tighter">Coins with the loudest crowd</h3>
          </div>
          <div className="flex items-center gap-2">
            {(() => {
              const live = rows.filter((r) => r.source === 'coingecko').length;
              if (loading && !rows.length) return null;
              if (live > 0) {
                return (
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    ● {live} live · coingecko
                  </span>
                );
              }
              return (
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Demo
                </span>
              );
            })()}
            <span className="text-[10px] font-black text-fuchsia-300 bg-fuchsia-500/10 border border-fuchsia-500/20 px-2 py-1 rounded">
              {loading ? 'Loading…' : `${rows.length} tracked`}
            </span>
          </div>
        </div>

        <div className="relative overflow-x-auto">
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
                  <td className="py-3 pr-3 font-mono text-xs text-slate-300">{r.mentions24h.toLocaleString()}</td>
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

      {/* ──── How alt-data works ──── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <h3 className="text-lg font-black tracking-tighter mb-1">How we extract value from non-traditional data</h3>
        <p className="text-slate-400 text-xs mb-4">
          The CoinWise OpenAPI <code className="text-fuchsia-300">/api/v1/ai/*</code> endpoints blend three alt-data streams.
          Live badges mean we hit the real third-party source; "Demo" means a synthetic fallback so the UI never breaks.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              title: '😱 Market mood',
              desc: 'Composite of 5 factors: volatility 25% · momentum/volume 25% · social 15% · BTC dominance 10% · Google Trends 10%.',
              src: 'alternative.me/fng',
              accent: 'bg-amber-500/10',
            },
            {
              title: '👥 Community sentiment',
              desc: 'CoinGecko user vote ratio (sentiment_votes_up/down) plus Reddit subscribers + Twitter followers per coin.',
              src: 'coingecko.com/api/v3',
              accent: 'bg-blue-500/10',
            },
            {
              title: '📊 Market snapshot',
              desc: 'Real-time BTC price, 24h trading volume, total crypto market cap with 24h change.',
              src: 'coingecko.com/api/v3/global',
              accent: 'bg-emerald-500/10',
            },
          ].map((c) => (
            <div key={c.title} className="relative bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-hidden">
              <div className={`absolute -top-10 -right-10 w-32 h-32 ${c.accent} rounded-full blur-2xl`} />
              <p className="relative font-black text-sm mb-1">{c.title}</p>
              <p className="relative text-xs text-slate-400 leading-relaxed mb-2">{c.desc}</p>
              <p className="relative text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Source: <code className="text-fuchsia-300 normal-case">{c.src}</code>
              </p>
            </div>
          ))}
        </div>
      </div>

      {fgData && (
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 text-center">
          Updated {new Date(fgData.fetchedAt).toLocaleTimeString('en-US')} · alternative.me · CoinGecko
        </p>
      )}
    </div>
  );
};

export default SocialPulsePage;
