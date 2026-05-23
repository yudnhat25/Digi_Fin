import React, { useState, useEffect } from 'react';
import { UserState } from '../types';
import Auth from './Auth';

interface LandingPageProps {
  onLogin: (user: UserState) => void;
}

const NAV = [
  { id: 'product', label: 'Product' },
  { id: 'markets', label: 'Markets' },
  { id: 'ai', label: 'AI' },
  { id: 'arena', label: 'Arena' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'docs', label: 'Docs' },
];

const PILLARS = [
  {
    accent: 'emerald',
    title: 'AI alternative data',
    blurb: 'Social sentiment, whale flows, news impact, distilled into one signal score per coin.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h2l2-9 4 18 3-12 2 6h5" />
      </svg>
    ),
  },
  {
    accent: 'sky',
    title: 'Agentic chatbot',
    blurb: 'Ask in Vietnamese. The bot trades, summarizes, alerts. Gemini function-calling under the hood.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    accent: 'amber',
    title: 'Personal AI coach',
    blurb: 'Find your weakness patterns. Stop losing to FOMO. Trade smarter every week.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    accent: 'rose',
    title: 'Made for Vietnam',
    blurb: 'VND dual currency, VNPay deposits, local news sources, Vietnamese-first UX.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-4-7-10a7 7 0 0 1 14 0c0 6-7 10-7 10z" />
        <circle cx="12" cy="11" r="2.5" />
      </svg>
    ),
  },
] as const;

const STATS = [
  { value: '2,400+', label: 'Active traders' },
  { value: '$48M',   label: 'Paper volume / mo' },
  { value: '12',     label: 'Data sources' },
  { value: '94%',    label: 'User satisfaction' },
];

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [authOpen, setAuthOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lang, setLang] = useState<'EN' | 'VI'>('EN');
  const [livePrice, setLivePrice] = useState(74857.64);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setLivePrice(p => p + (Math.random() - 0.5) * 60), 1800);
    return () => clearInterval(t);
  }, []);

  if (authOpen) {
    return (
      <div className="relative">
        <button
          onClick={() => setAuthOpen(false)}
          className="absolute top-6 left-6 z-50 flex items-center gap-2 text-slate-400 hover:text-white text-[11px] font-bold uppercase tracking-[0.18em]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to home
        </button>
        <Auth onLogin={onLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04060c] text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-white">
      {/* ────── HEADER ────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-colors ${
          scrolled ? 'bg-[#04060c]/85 backdrop-blur-md border-b border-white/[0.06]' : 'border-b border-transparent'
        }`}
      >
        <div className="max-w-[1240px] mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-9">
            <a href="#" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-400 text-emerald-950 grid place-items-center font-black text-[13px] tracking-tight">CW</div>
              <span className="font-semibold tracking-tight">CoinWise<span className="text-emerald-400">AI</span></span>
            </a>
            <nav className="hidden lg:flex items-center gap-7 text-[13px] text-slate-400">
              {NAV.map(n => (
                <a key={n.id} href={`#${n.id}`} className="hover:text-slate-100 transition-colors">
                  {n.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <button
                onClick={() => setLang('EN')}
                className={lang === 'EN' ? 'text-slate-100' : 'hover:text-slate-300'}
              >EN</button>
              <span className="text-slate-700">·</span>
              <button
                onClick={() => setLang('VI')}
                className={lang === 'VI' ? 'text-slate-100' : 'hover:text-slate-300'}
              >VI</button>
            </div>
            <button
              onClick={() => setAuthOpen(true)}
              className="text-[13px] font-medium text-slate-300 hover:text-white px-3 py-1.5"
            >
              Log in
            </button>
            <button
              onClick={() => setAuthOpen(true)}
              className="text-[13px] font-semibold bg-emerald-400 hover:bg-emerald-300 text-emerald-950 px-4 py-2 rounded-md transition-colors"
            >
              Start trading
            </button>
          </div>
        </div>
      </header>

      {/* ────── HERO ────── */}
      <section className="relative pt-36 pb-20 px-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.10),_transparent_60%)]" />

        <div className="max-w-[1100px] mx-auto relative">
          <div className="flex justify-center">
            <a
              href="#ai"
              className="group inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/[0.06] px-3 py-1 text-[12px] text-emerald-300 hover:border-emerald-400/60 hover:bg-emerald-500/[0.1] transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              New: AI Coach beta
              <span className="text-emerald-200/70">train your trading instinct</span>
              <span className="opacity-70 group-hover:translate-x-0.5 transition-transform">→</span>
            </a>
          </div>

          <h1 className="mt-9 text-center font-semibold tracking-[-0.04em] text-[44px] leading-[1.04] md:text-[68px]">
            Master crypto trading.<br />
            <span className="text-emerald-400">Risk-free, AI-guided.</span>
          </h1>

          <p className="mt-7 mx-auto max-w-[640px] text-center text-slate-400 text-[16.5px] leading-relaxed">
            Paper trade Bitcoin, Ethereum and 180+ pairs with $1M virtual capital. CoinWise AI analyses
            social sentiment, whale movements and on-chain data to coach you. Built for Vietnamese
            traders, supports VNĐ natively.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setAuthOpen(true)}
              className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 text-[14px] font-semibold px-5 py-2.5 rounded-md inline-flex items-center gap-2 transition-colors"
            >
              Start free <span className="opacity-70">→</span>
            </button>
            <button
              onClick={() => document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-[14px] font-medium text-slate-300 hover:text-white px-5 py-2.5 rounded-md border border-white/10 hover:border-white/20 inline-flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 4.5v11l9-5.5z" /></svg>
              Watch demo
            </button>
          </div>

          <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] text-slate-500">
            <li className="flex items-center gap-1.5"><Check /> $1M virtual capital</li>
            <li className="flex items-center gap-1.5"><Check /> Gemini-powered AI</li>
            <li className="flex items-center gap-1.5"><Check /> VNĐ support</li>
            <li className="flex items-center gap-1.5"><Check /> No credit card</li>
          </ul>
        </div>

        {/* TERMINAL PREVIEW CARD */}
        <div className="max-w-[1100px] mx-auto mt-16">
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0a0f1c] to-[#070b15] shadow-[0_40px_120px_-30px_rgba(16,185,129,0.25)] overflow-hidden">
            {/* window chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.05]">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
              <span className="ml-3 font-mono text-[11px] text-slate-500">coinwise.ai/terminal</span>
            </div>

            <div className="grid grid-cols-12 gap-px bg-white/[0.04]">
              {/* mini sidebar */}
              <aside className="col-span-3 md:col-span-2 bg-[#070b15] p-4 space-y-1 text-[12px] text-slate-400">
                {[
                  { l: 'Terminal', active: true, dot: '#34d399' },
                  { l: 'AI Insights', dot: '#f472b6' },
                  { l: 'Arena', dot: '#fbbf24' },
                  { l: 'Coach', dot: '#a78bfa' },
                ].map(r => (
                  <div
                    key={r.l}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md ${r.active ? 'bg-white/[0.06] text-slate-100' : ''}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: r.dot }} />
                    {r.l}
                  </div>
                ))}
              </aside>

              {/* chart */}
              <div className="col-span-9 md:col-span-7 bg-[#070b15] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[12px] text-slate-500">BTC/USDT</div>
                    <div className="text-[20px] font-semibold tabular-nums tracking-tight">
                      ${livePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="text-rose-400 text-[12px] font-medium tabular-nums">-8.71%</div>
                </div>
                <MiniChart />
              </div>

              {/* signal */}
              <div className="col-span-12 md:col-span-3 bg-[#070b15] p-5">
                <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">AI signal</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-emerald-400 font-semibold text-[15px]">BUY</span>
                  <span className="text-slate-300 font-semibold text-[13px] tabular-nums">87%</span>
                </div>
                <p className="mt-2 text-[12px] text-slate-400 leading-relaxed">
                  RSI oversold + whale accumulation
                </p>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="mt-5 w-full bg-emerald-400 hover:bg-emerald-300 text-emerald-950 text-[12.5px] font-semibold py-2 rounded-md transition-colors"
                >
                  Buy 0.1 BTC
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────── PILLARS ────── */}
      <section id="product" className="border-t border-white/[0.06] py-24 px-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="max-w-[640px]">
            <p className="text-emerald-400 text-[12px] font-medium tracking-[0.16em] uppercase">Why CoinWise</p>
            <h2 className="mt-4 text-[34px] md:text-[44px] font-semibold tracking-[-0.03em] leading-[1.1]">
              Built for the next generation of traders
            </h2>
            <p className="mt-4 text-slate-400 text-[15px]">
              Four pillars that set CoinWise apart from the legacy paper-trading apps.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className="bg-[#070b15] p-7 group hover:bg-[#0a0f1c] transition-colors"
              >
                <div className={`w-9 h-9 rounded-lg grid place-items-center text-${p.accent}-300 bg-${p.accent}-500/[0.08] border border-${p.accent}-500/20`}>
                  {p.icon}
                </div>
                <h3 className="mt-5 font-semibold text-[15.5px] tracking-tight">{p.title}</h3>
                <p className="mt-2 text-[13.5px] text-slate-400 leading-relaxed">{p.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────── STATS ────── */}
      <section className="border-t border-white/[0.06] py-20 px-6">
        <div className="max-w-[1100px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-y-10">
          {STATS.map((s, i) => (
            <div key={s.label} className={i > 0 ? 'md:border-l border-white/[0.06] md:pl-10' : ''}>
              <div className="text-emerald-400 text-[32px] md:text-[40px] font-semibold tracking-[-0.03em] tabular-nums">
                {s.value}
              </div>
              <div className="mt-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ────── CTA STRIP ────── */}
      <section className="border-t border-white/[0.06] py-20 px-6">
        <div className="max-w-[900px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-[26px] md:text-[32px] font-semibold tracking-[-0.03em] leading-tight">
              Ready when you are.
            </h3>
            <p className="mt-2 text-slate-400 text-[14.5px]">
              Sign up in 60 seconds. $1M virtual capital. No card.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setAuthOpen(true)}
              className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 text-[14px] font-semibold px-5 py-2.5 rounded-md"
            >
              Create account
            </button>
            <a
              href="#docs"
              className="text-[14px] font-medium text-slate-300 hover:text-white px-5 py-2.5 rounded-md border border-white/10 hover:border-white/20"
            >
              Read docs
            </a>
          </div>
        </div>
      </section>

      {/* ────── FOOTER ────── */}
      <footer className="border-t border-white/[0.06] py-16 px-6">
        <div className="max-w-[1100px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-400 text-emerald-950 grid place-items-center font-black text-[13px]">CW</div>
              <span className="font-semibold tracking-tight">CoinWise AI</span>
            </div>
            <p className="mt-4 text-[12.5px] text-slate-500 leading-relaxed max-w-[260px]">
              Built with <span className="text-rose-400">♥</span> in Saigon. Backed by UII Incubator.
            </p>
          </div>

          {[
            { t: 'Product', l: ['Terminal', 'AI Insights', 'Arena', 'API docs'] },
            { t: 'Company', l: ['About', 'Careers', 'Press', 'Contact'] },
            { t: 'Legal', l: ['Terms', 'Privacy', 'Risk disclosure'] },
          ].map((c) => (
            <div key={c.t}>
              <p className="text-[10.5px] uppercase tracking-[0.16em] text-slate-500 font-semibold">{c.t}</p>
              <ul className="mt-4 space-y-2.5 text-[13px]">
                {c.l.map(item => (
                  <li key={item}>
                    <a href="#" className="text-slate-400 hover:text-slate-100">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-[1100px] mx-auto mt-12 pt-6 border-t border-white/[0.04] flex justify-between text-[11px] text-slate-600">
          <p>© 2026 CoinWise AI · Simulated trading. Not financial advice.</p>
          <p>v1.0 · gen-lang-client-0742583847</p>
        </div>
      </footer>
    </div>
  );
};

const Check: React.FC = () => (
  <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0z" clipRule="evenodd" />
  </svg>
);

// Compact line chart for hero terminal preview (deterministic, no random per render).
const MiniChart: React.FC = () => {
  const points = React.useMemo(() => {
    const N = 60;
    const arr: number[] = [];
    let y = 70;
    for (let i = 0; i < N; i++) {
      y += (Math.sin(i / 4) * 3) + (i > 30 ? -1.5 : 0.6) + (Math.random() - 0.5) * 1.5;
      arr.push(Math.max(20, Math.min(90, y)));
    }
    return arr;
  }, []);
  const w = 100;
  const h = 100;
  const path = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i / (points.length - 1)) * w} ${h - v}`).join(' ');
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <div className="relative h-44 w-full">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#lineGrad)" />
        <path d={path} fill="none" stroke="#34d399" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
};

export default LandingPage;
