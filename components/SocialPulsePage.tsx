import React, { useEffect, useMemo, useState } from 'react';
import {
  apiSocialPulse,
  apiFearGreedFull,
  SocialPulseRow,
  FearGreedFull,
  FgPoint,
} from '../services/coinwiseApi';

const classBand = (v: number) =>
  v < 25 ? 'Extreme Fear' :
  v < 45 ? 'Fear' :
  v < 55 ? 'Neutral' :
  v < 75 ? 'Greed' : 'Extreme Greed';
const bandTone = (v: number) =>
  v < 25 ? { hex: '#dc2626', text: 'text-rose-400' } :
  v < 45 ? { hex: '#f97316', text: 'text-orange-400' } :
  v < 55 ? { hex: '#eab308', text: 'text-yellow-400' } :
  v < 75 ? { hex: '#22c55e', text: 'text-emerald-400' } :
           { hex: '#10b981', text: 'text-emerald-300' };

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

// ─── Semi-circle gauge ───
const Gauge: React.FC<{ value: number }> = ({ value }) => {
  const cx = 180, cy = 175, r = 130, thickness = 22;
  const segments = [
    { from: 0,  to: 25, color: '#7f1d1d' },
    { from: 25, to: 45, color: '#dc2626' },
    { from: 45, to: 55, color: '#eab308' },
    { from: 55, to: 75, color: '#22c55e' },
    { from: 75, to: 100, color: '#15803d' },
  ];
  const polar = (pct: number) => {
    const ang = Math.PI - (pct / 100) * Math.PI;
    return { x: cx + r * Math.cos(ang), y: cy - r * Math.sin(ang) };
  };
  const arcPath = (from: number, to: number) => {
    const p0 = polar(from);
    const p1 = polar(to);
    const large = to - from > 50 ? 1 : 0;
    return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y}`;
  };
  const dot = polar(Math.min(Math.max(value, 0), 100));
  const tone = bandTone(value);

  return (
    <svg viewBox="0 0 360 200" className="w-full max-w-[360px] mx-auto">
      {segments.map((s) => (
        <path
          key={s.from}
          d={arcPath(s.from + 1, s.to - 1)}
          fill="none"
          stroke={s.color}
          strokeWidth={thickness}
          strokeLinecap="round"
          opacity={0.85}
        />
      ))}
      <circle cx={dot.x} cy={dot.y} r={11} fill="#fff" stroke="#04060c" strokeWidth={3} />
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="64" fontWeight="700" fill="#fff" fontFamily="ui-sans-serif">
        {Math.round(value)}
      </text>
      <text x={cx} y={cy + 24} textAnchor="middle" fontSize="18" fontWeight="600" fill={tone.hex}>
        {classBand(value)}
      </text>
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
        return <line key={`g${i}`} x1={padL} x2={w - padR} y1={y} y2={y} stroke="#1f2937" strokeWidth={0.5} />;
      })}
      <path d={btcPath} fill="none" stroke="#cbd5e1" strokeWidth={1.4} opacity={0.7} />
      {fgSegs.map((s, i) => (
        <line key={`fg${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.color} strokeWidth={1.8} />
      ))}
      {vols.map((p, i) => {
        const idx = fg.findIndex((f) => f.date === p.date);
        const x = xFor(idx >= 0 ? idx : i * volSample);
        const yTop = yVol(p.volumeUsd);
        const yBot = h - padB;
        return <line key={`v${i}`} x1={x} y1={yTop} x2={x} y2={yBot} stroke="#64748b" strokeWidth={1.2} opacity={0.45} />;
      })}
      {Array.from({ length: priceTicks + 1 }).map((_, i) => {
        const y = padT + (i / priceTicks) * innerH * 0.78;
        const v = priceMax - (i / priceTicks) * (priceMax - priceMin);
        return (
          <text key={`pl${i}`} x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">
            {Math.round(v / 1000)}K
          </text>
        );
      })}
      {Array.from({ length: fgTicks + 1 }).map((_, i) => {
        const y = padT + (i / fgTicks) * innerH * 0.78;
        const v = 100 - (i / fgTicks) * 100;
        return (
          <text key={`fr${i}`} x={w - padR + 8} y={y + 4} textAnchor="start" fontSize="10" fill="#64748b">
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
          <text key={`xd${i}`} x={x} y={h - padB + 18} textAnchor="middle" fontSize="10" fill="#64748b">
            {label}
          </text>
        );
      })}
      {fg.length > 0 && (
        <g transform={`translate(${w - padR - 90}, ${padT})`}>
          <rect width="80" height="22" rx="6" fill="#1e293b" stroke="#334155" />
          <text x="40" y="15" textAnchor="middle" fontSize="11" fill="#cbd5e1">
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
    <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
      <span className="text-slate-400 text-[15px]">{label}</span>
      <span className={`inline-flex items-center gap-2 text-[15px] font-semibold ${tone.text}`}>
        <span className="w-1 h-4 rounded" style={{ background: tone.hex }} />
        {classBand(pt.value)} {Math.round(pt.value)}
      </span>
    </div>
  );
};

// ─── Sentiment bar for movers table ───
const SentimentBar: React.FC<{ score: number }> = ({ score }) => {
  const pct = Math.abs(score) * 50;
  const color = score > 0.4 ? 'bg-emerald-500' : score > 0 ? 'bg-emerald-400/70' : score > -0.4 ? 'bg-amber-400/70' : 'bg-rose-500';
  return (
    <div className="w-28 h-1.5 bg-white/[0.04] rounded-full overflow-hidden relative">
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/20" />
      <div className={`absolute inset-y-0 ${color}`} style={{ width: `${pct}%`, left: score < 0 ? `${50 - pct}%` : '50%' }} />
    </div>
  );
};

const momentumTone: Record<SocialPulseRow['momentum'], string> = {
  Spike: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
  Rising: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  Stable: 'text-slate-400 bg-white/[0.04] border-white/[0.08]',
  Cooling: 'text-blue-300 bg-blue-500/10 border-blue-500/30',
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
      return `Market stable in the ${bandCur} zone (${Math.round(cur)}/100) — no major sentiment swings.`;
    }
    return `Sentiment oscillating between ${bandWeek} and ${bandCur}. Market balanced, avoiding extreme readings.`;
  }, [fgData]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-8 animate-in fade-in duration-500">
      {/* ──── Header ──── */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-300 text-[10px] font-bold uppercase tracking-widest mb-3">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          AI Alternative Data · Live
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Social Pulse</h1>
        <p className="text-slate-400 text-sm mt-2 max-w-2xl">
          Aggregated market sentiment — Fear & Greed Index, social mentions, community signals. Refreshed every 60 seconds.
        </p>
      </div>

      {err && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/[0.04] p-4 text-sm text-rose-200">
          Failed to load data: {err}
        </div>
      )}

      {/* ──── Fear & Greed section ──── */}
      {fgData ? (
        <section className="space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
                Fear & Greed Index
                <span className="text-slate-600 text-sm">ⓘ</span>
              </h2>
              <div className="mt-2 flex items-start gap-2 max-w-2xl">
                <svg viewBox="0 0 24 24" className="w-4 h-4 mt-0.5 text-violet-400 shrink-0" fill="currentColor">
                  <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zm6 11l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
                </svg>
                <p className="text-slate-300 text-sm leading-relaxed">
                  <span className="text-violet-400 font-semibold">AI Insight · </span>
                  {summary}
                </p>
              </div>
            </div>
            <div className="inline-flex rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 shrink-0">
              <button
                onClick={() => setTab('overview')}
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition ${
                  tab === 'overview' ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setTab('chart')}
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition ${
                  tab === 'chart' ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Chart
              </button>
            </div>
          </div>

          {tab === 'overview' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Gauge — span 5 */}
              <div className="lg:col-span-5 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-6 md:p-8 flex items-center justify-center">
                <Gauge value={fgData.fearGreed.current.value} />
              </div>

              {/* History — span 7 */}
              <div className="lg:col-span-7 space-y-5">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <h3 className="text-sm font-bold text-slate-200 mb-1 flex items-center gap-1">
                    Historical Data <span className="text-slate-600">ⓘ</span>
                  </h3>
                  <div className="mt-2">
                    <HistRow label="Yesterday" pt={fgData.fearGreed.periods.yesterday} />
                    <HistRow label="Last week" pt={fgData.fearGreed.periods.lastWeek} />
                    <HistRow label="Last month" pt={fgData.fearGreed.periods.lastMonth} />
                    <HistRow label="Last year" pt={fgData.fearGreed.periods.lastYear} />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <h3 className="text-sm font-bold text-slate-200 mb-1 flex items-center gap-1">
                    Yearly High & Low <span className="text-slate-600">ⓘ</span>
                  </h3>
                  <div className="mt-2">
                    <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                      <span className="text-slate-400 text-[15px]">
                        Yearly high <span className="text-slate-600">({fmtDate(fgData.fearGreed.yearHigh.date)})</span>
                      </span>
                      <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-emerald-400">
                        <span className="w-1 h-4 rounded bg-emerald-400" />
                        {classBand(fgData.fearGreed.yearHigh.value)} {Math.round(fgData.fearGreed.yearHigh.value)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-slate-400 text-[15px]">
                        Yearly low <span className="text-slate-600">({fmtDate(fgData.fearGreed.yearLow.date)})</span>
                      </span>
                      <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-rose-400">
                        <span className="w-1 h-4 rounded bg-rose-400" />
                        {classBand(fgData.fearGreed.yearLow.value)} {Math.round(fgData.fearGreed.yearLow.value)}
                      </span>
                    </div>
                  </div>
                </div>

                {fgData.btc && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Total Market Cap</p>
                      <p className={`mt-1.5 text-lg font-bold ${fgData.btc.marketCapChange24hPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {fmtPct(fgData.btc.marketCapChange24hPct)}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{fmtBig(fgData.btc.totalMarketCapUsd)} USD</p>
                    </div>
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">24h Volume</p>
                      <p className={`mt-1.5 text-lg font-bold ${fgData.btc.priceChange24hPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {fmtPct(fgData.btc.priceChange24hPct)}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{fmtBig(fgData.btc.totalVolume24hUsd)} USD</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-baseline flex-wrap gap-5 mb-4">
                <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wide">F&G Now</p>
                  <p className={`text-base font-bold ${bandTone(fgData.fearGreed.current.value).text}`}>
                    {classBand(fgData.fearGreed.current.value)} {Math.round(fgData.fearGreed.current.value)}
                  </p>
                </div>
                {fgData.btc && (
                  <>
                    <div>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wide">BTC Price</p>
                      <p className="text-base font-bold text-slate-100">{fmtUsd(fgData.btc.priceUsd)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wide">24h Volume</p>
                      <p className="text-base font-bold text-slate-100">${fmtBig(fgData.btc.volume24hUsd)}</p>
                    </div>
                  </>
                )}
              </div>
              <OverlayChart
                fg={fgData.fearGreed.history}
                btc={fgData.btcHistory?.points || []}
              />
              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-400">
                <span className="inline-flex items-center gap-2"><span className="w-3 h-0.5 bg-slate-300" /> BTC price</span>
                <span className="inline-flex items-center gap-2"><span className="w-3 h-0.5 bg-emerald-400" /> F&G high (greed)</span>
                <span className="inline-flex items-center gap-2"><span className="w-3 h-0.5 bg-rose-400" /> F&G low (fear)</span>
                <span className="inline-flex items-center gap-2"><span className="w-2 h-2.5 bg-slate-500/60" /> BTC volume</span>
              </div>
            </div>
          )}
        </section>
      ) : loading ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center text-slate-500 text-sm">
          Loading Fear & Greed data…
        </div>
      ) : null}

      {/* ──── Top Social Movers ──── */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Top Social Movers</h2>
            <p className="text-xs text-slate-500 mt-0.5">Coins with the loudest community over the last 24h</p>
          </div>
          <div className="flex items-center gap-2">
            {(() => {
              const live = rows.filter((r) => r.source === 'coingecko').length;
              if (loading && !rows.length) return null;
              if (live > 0) {
                return (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-md">
                    ● {live} live · coingecko
                  </span>
                );
              }
              return (
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-md">
                  Demo
                </span>
              );
            })()}
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white/[0.04] border border-white/[0.06] px-2 py-1 rounded-md">
              {loading ? 'Loading…' : `${rows.length} coins`}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left border-b border-white/[0.04]">
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
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition"
                >
                  <td className="py-3 pr-3 font-semibold">{r.symbol.replace('USDT', '')}</td>
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
                    <span className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded ${momentumTone[r.momentum]}`}>
                      {r.momentum}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ──── How alt-data works ──── */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h2 className="text-lg font-bold tracking-tight mb-1">Where the alt-data comes from</h2>
        <p className="text-xs text-slate-500 mb-4">
          Three free sources blended via <code className="text-emerald-300">/api/v1/ai/*</code>. "Live" means we hit the real upstream; "Demo" means a synthetic fallback.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
            <p className="font-bold text-sm mb-1 flex items-center gap-2">
              <span className="text-amber-400">😱</span> Fear & Greed
            </p>
            <p className="text-xs text-slate-400 leading-relaxed mb-2">
              Composite of 5 factors: volatility 25% · momentum/volume 25% · social 15% · BTC dominance 10% · Google Trends 10%.
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Source: <code className="text-emerald-300 normal-case">alternative.me/fng</code>
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
            <p className="font-bold text-sm mb-1 flex items-center gap-2">
              <span className="text-blue-400">👥</span> Community sentiment
            </p>
            <p className="text-xs text-slate-400 leading-relaxed mb-2">
              User vote ratio (sentiment_votes_up/down) plus Reddit subscribers and Twitter followers per coin.
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Source: <code className="text-emerald-300 normal-case">coingecko.com/api/v3</code>
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
            <p className="font-bold text-sm mb-1 flex items-center gap-2">
              <span className="text-emerald-400">📊</span> Market snapshot
            </p>
            <p className="text-xs text-slate-400 leading-relaxed mb-2">
              Real-time BTC price, 24h trading volume, total market cap and 24h change.
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Source: <code className="text-emerald-300 normal-case">coingecko.com/api/v3/global</code>
            </p>
          </div>
        </div>
      </section>

      {fgData && (
        <p className="text-xs text-slate-600 text-center pt-2">
          Updated {new Date(fgData.fetchedAt).toLocaleTimeString('en-US')} · alternative.me · CoinGecko
        </p>
      )}
    </div>
  );
};

export default SocialPulsePage;
