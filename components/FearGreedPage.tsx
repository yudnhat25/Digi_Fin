import React, { useEffect, useMemo, useState } from 'react';
import { apiFearGreedFull, FearGreedFull, FgPoint } from '../services/coinwiseApi';

const VI: Record<string, string> = {
  'Extreme Fear': 'Sợ hãi tột độ',
  'Fear': 'Sợ hãi',
  'Neutral': 'Bình thường',
  'Greed': 'Tham lam',
  'Extreme Greed': 'Tham lam tột độ',
};

const classBand = (v: number) =>
  v < 25 ? 'Extreme Fear' :
  v < 45 ? 'Fear' :
  v < 55 ? 'Neutral' :
  v < 75 ? 'Greed' : 'Extreme Greed';

const bandTone = (v: number) =>
  v < 25 ? { hex: '#dc2626', text: 'text-rose-400', bgChip: 'bg-rose-500/15 text-rose-300 border-rose-500/30' } :
  v < 45 ? { hex: '#f97316', text: 'text-orange-400', bgChip: 'bg-orange-500/15 text-orange-300 border-orange-500/30' } :
  v < 55 ? { hex: '#eab308', text: 'text-yellow-400', bgChip: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' } :
  v < 75 ? { hex: '#22c55e', text: 'text-emerald-400', bgChip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' } :
           { hex: '#10b981', text: 'text-emerald-300', bgChip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };

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
  // 180° arc from (cx-r, cy) sweeping over the top to (cx+r, cy)
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
      {/* needle dot */}
      <circle cx={dot.x} cy={dot.y} r={11} fill="#fff" stroke="#04060c" strokeWidth={3} />

      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="64" fontWeight="700" fill="#fff" fontFamily="ui-sans-serif">
        {Math.round(value)}
      </text>
      <text x={cx} y={cy + 24} textAnchor="middle" fontSize="18" fontWeight="600" fill={tone.hex}>
        {VI[classBand(value)]}
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

  // Align BTC by date with the F&G window
  const fgByDate = new Map(fg.map((p) => [p.date, p]));
  const aligned = btc.filter((b) => fgByDate.has(b.date));
  const n = Math.max(fg.length, aligned.length, 1);

  const fgMin = 0, fgMax = 100;
  const priceMin = aligned.length ? Math.min(...aligned.map((p) => p.priceUsd)) * 0.92 : 0;
  const priceMax = aligned.length ? Math.max(...aligned.map((p) => p.priceUsd)) * 1.05 : 1;
  const volMax = aligned.length ? Math.max(...aligned.map((p) => p.volumeUsd)) : 1;

  const xFor = (i: number) => padL + (i / Math.max(n - 1, 1)) * innerW;
  const yFg = (v: number) => padT + (1 - (v - fgMin) / (fgMax - fgMin)) * (innerH * 0.78);
  const yBtc = (v: number) => padT + (1 - (v - priceMin) / Math.max(priceMax - priceMin, 1)) * (innerH * 0.78);
  const yVol = (v: number) => padT + innerH * 0.78 + (1 - v / Math.max(volMax, 1)) * (innerH * 0.22);

  // F&G coloured polyline using per-point color
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
  // BTC line: simple polyline
  const btcPath = aligned.map((p, i) => {
    const idx = fg.findIndex((f) => f.date === p.date);
    const x = xFor(idx >= 0 ? idx : i);
    const y = yBtc(p.priceUsd);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  // Volume bars (sampled — every Nth so bars don't crush together)
  const volSample = Math.max(1, Math.floor(aligned.length / 120));
  const vols = aligned.filter((_, i) => i % volSample === 0);

  // Y-axis ticks
  const priceTicks = 5;
  const fgTicks = 5;

  // X-axis: ~6 evenly spaced date labels
  const dateLabelStep = Math.max(1, Math.floor(fg.length / 6));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      {/* gridlines */}
      {Array.from({ length: priceTicks + 1 }).map((_, i) => {
        const y = padT + (i / priceTicks) * innerH * 0.78;
        return <line key={`g${i}`} x1={padL} x2={w - padR} y1={y} y2={y} stroke="#1f2937" strokeWidth={0.5} />;
      })}

      {/* BTC line */}
      <path d={btcPath} fill="none" stroke="#cbd5e1" strokeWidth={1.4} opacity={0.7} />

      {/* F&G coloured line */}
      {fgSegs.map((s, i) => (
        <line key={`fg${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.color} strokeWidth={1.8} />
      ))}

      {/* Volume bars */}
      {vols.map((p, i) => {
        const idx = fg.findIndex((f) => f.date === p.date);
        const x = xFor(idx >= 0 ? idx : i * volSample);
        const yTop = yVol(p.volumeUsd);
        const yBot = h - padB;
        return <line key={`v${i}`} x1={x} y1={yTop} x2={x} y2={yBot} stroke="#64748b" strokeWidth={1.2} opacity={0.45} />;
      })}

      {/* Y axis labels — left: BTC price (K) */}
      {Array.from({ length: priceTicks + 1 }).map((_, i) => {
        const y = padT + (i / priceTicks) * innerH * 0.78;
        const v = priceMax - (i / priceTicks) * (priceMax - priceMin);
        return (
          <text key={`pl${i}`} x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">
            {Math.round(v / 1000)}K
          </text>
        );
      })}
      {/* Y axis right: F&G value */}
      {Array.from({ length: fgTicks + 1 }).map((_, i) => {
        const y = padT + (i / fgTicks) * innerH * 0.78;
        const v = 100 - (i / fgTicks) * 100;
        return (
          <text key={`fr${i}`} x={w - padR + 8} y={y + 4} textAnchor="start" fontSize="10" fill="#64748b">
            {Math.round(v)}
          </text>
        );
      })}
      {/* X-axis dates */}
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

      {/* Today badge */}
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
        {VI[classBand(pt.value)]} {Math.round(pt.value)}
      </span>
    </div>
  );
};

const FearGreedPage: React.FC = () => {
  const [data, setData] = useState<FearGreedFull | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'chart'>('overview');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiFearGreedFull()
      .then((res) => { if (alive) { setData(res); setErr(null); } })
      .catch((e) => { if (alive) setErr((e as Error).message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const summary = useMemo(() => {
    if (!data) return '';
    const cur = data.fearGreed.current.value;
    const week = data.fearGreed.periods.lastWeek?.value ?? cur;
    const month = data.fearGreed.periods.lastMonth?.value ?? cur;
    const moved = Math.abs(cur - week) > 10 || Math.abs(cur - month) > 15;
    const bandCur = VI[classBand(cur)];
    const bandWeek = VI[classBand(week)];
    if (bandCur === bandWeek && !moved) {
      return `Xu hướng gần đây cho thấy thị trường vẫn ổn định trong vùng ${bandCur} (${Math.round(cur)}/100). Tâm lý nhà đầu tư chưa có biến động mạnh.`;
    }
    return `Xu hướng gần đây cho thấy sự dao động giữa các khu vực ${bandWeek} và ${bandCur}. Tâm lý thị trường vẫn tương đối cân bằng, tránh được các mức cảm xúc cực đoan.`;
  }, [data]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center text-slate-500 text-sm">
        Đang tải dữ liệu Sợ hãi & Tham lam…
      </div>
    );
  }
  if (err || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/[0.04] p-5 text-sm text-rose-200">
          Không tải được dữ liệu F&G. Lỗi: {err || 'unknown'}
        </div>
      </div>
    );
  }

  const cur = data.fearGreed.current.value;
  const tone = bandTone(cur);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          Chỉ số Sợ hãi & Tham lam
          <span className="text-slate-600 text-base">ⓘ</span>
        </h1>
        <div className="mt-3 flex items-start gap-2">
          <svg viewBox="0 0 24 24" className="w-5 h-5 mt-0.5 text-violet-400 shrink-0" fill="currentColor">
            <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zm6 11l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3zm-13 4l.7 2.1L8 20l-2.3.9L5 23l-.7-2.1L2 20l2.3-.9L5 17z" />
          </svg>
          <p className="text-slate-300 text-[15px] leading-relaxed">
            <span className="text-violet-400 font-semibold">Sử dụng AI</span>
            <br />
            {summary}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
        <button
          onClick={() => setTab('overview')}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition ${
            tab === 'overview' ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Tổng quan
        </button>
        <button
          onClick={() => setTab('chart')}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition ${
            tab === 'chart' ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Biểu đồ
        </button>
      </div>

      {tab === 'overview' ? (
        <>
          {/* Gauge */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 md:p-10">
            <Gauge value={cur} />
          </div>

          {/* Historical */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h2 className="text-sm font-bold text-slate-200 mb-1 flex items-center gap-1">
              Dữ liệu Lịch sử <span className="text-slate-600">ⓘ</span>
            </h2>
            <div className="mt-2">
              <HistRow label="Ngày hôm qua" pt={data.fearGreed.periods.yesterday} />
              <HistRow label="Tuần trước" pt={data.fearGreed.periods.lastWeek} />
              <HistRow label="Tháng trước" pt={data.fearGreed.periods.lastMonth} />
              <HistRow label="Năm ngoái" pt={data.fearGreed.periods.lastYear} />
            </div>
          </div>

          {/* Annual hi/lo */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h2 className="text-sm font-bold text-slate-200 mb-1 flex items-center gap-1">
              Mức cao và mức thấp hàng năm <span className="text-slate-600">ⓘ</span>
            </h2>
            <div className="mt-2">
              <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                <span className="text-slate-400 text-[15px]">
                  Mức cao hàng năm <span className="text-slate-600">({fmtDate(data.fearGreed.yearHigh.date)})</span>
                </span>
                <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-emerald-400">
                  <span className="w-1 h-4 rounded bg-emerald-400" />
                  {VI[classBand(data.fearGreed.yearHigh.value)]} {Math.round(data.fearGreed.yearHigh.value)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-slate-400 text-[15px]">
                  Mức thấp hàng năm <span className="text-slate-600">({fmtDate(data.fearGreed.yearLow.date)})</span>
                </span>
                <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-rose-400">
                  <span className="w-1 h-4 rounded bg-rose-400" />
                  {VI[classBand(data.fearGreed.yearLow.value)]} {Math.round(data.fearGreed.yearLow.value)}
                </span>
              </div>
            </div>
          </div>

          {/* Market cap + Volume */}
          {data.btc && (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <p className="text-sm font-semibold text-slate-200">Tổng vốn hóa thị trường</p>
                <p className={`mt-2 text-xl font-bold ${data.btc.marketCapChange24hPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {fmtPct(data.btc.marketCapChange24hPct)}
                </p>
                <p className="text-xs text-slate-500 mt-1">{fmtBig(data.btc.totalMarketCapUsd)} USD</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <p className="text-sm font-semibold text-slate-200">KL giao dịch 24h</p>
                <p className={`mt-2 text-xl font-bold ${data.btc.priceChange24hPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {fmtPct(data.btc.priceChange24hPct)}
                </p>
                <p className="text-xs text-slate-500 mt-1">{fmtBig(data.btc.totalVolume24hUsd)} USD</p>
              </div>
            </div>
          )}

          {/* Source attribution */}
          <p className="text-xs text-slate-600 text-center pt-2">
            Nguồn: alternative.me · CoinGecko · cập nhật {new Date(data.fetchedAt).toLocaleTimeString('vi-VN')}
          </p>
        </>
      ) : (
        <>
          {/* Chart tab */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-500">
                  Chỉ số Sợ hãi (F) và Tham lam (G) · Giá BTC · KL BTC
                </p>
                <div className="flex items-baseline gap-5 mt-2">
                  <div>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wide">Hiện tại</p>
                    <p className={`text-base font-bold ${tone.text}`}>
                      {VI[classBand(cur)]} {Math.round(cur)}
                    </p>
                  </div>
                  {data.btc && (
                    <>
                      <div>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wide">Giá BTC</p>
                        <p className="text-base font-bold text-slate-100">{fmtUsd(data.btc.priceUsd)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wide">KL 24h</p>
                        <p className="text-base font-bold text-slate-100">${fmtBig(data.btc.volume24hUsd)}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-white/[0.08] bg-white/[0.04] text-xs text-slate-300">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" strokeLinecap="round" />
                </svg>
                1 Năm
              </span>
            </div>

            <OverlayChart
              fg={data.fearGreed.history}
              btc={data.btcHistory?.points || []}
            />

            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-400">
              <span className="inline-flex items-center gap-2"><span className="w-3 h-0.5 bg-slate-300" /> Giá BTC</span>
              <span className="inline-flex items-center gap-2"><span className="w-3 h-0.5 bg-emerald-400" /> F&G (cao = tham lam)</span>
              <span className="inline-flex items-center gap-2"><span className="w-3 h-0.5 bg-rose-400" /> F&G (thấp = sợ hãi)</span>
              <span className="inline-flex items-center gap-2"><span className="w-2 h-2.5 bg-slate-500/60" /> KL BTC</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 text-center">
            Nguồn: alternative.me (chỉ số F&G) · CoinGecko (giá BTC, KL) · {data.fearGreed.history.length} ngày
          </p>
        </>
      )}
    </div>
  );
};

export default FearGreedPage;
