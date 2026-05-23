import React, { useState, useEffect } from 'react';
import { UserState } from '../types';
import Auth from './Auth';

interface LandingPageProps {
  onLogin: (user: UserState) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [authOpen, setAuthOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tickerPrice, setTickerPrice] = useState(67324.55);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setTickerPrice(p => p + (Math.random() - 0.5) * 80);
    }, 1500);
    return () => clearInterval(t);
  }, []);

  if (authOpen) {
    return (
      <div className="relative">
        <button
          onClick={() => setAuthOpen(false)}
          className="absolute top-6 left-6 z-50 flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Home
        </button>
        <Auth onLogin={onLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Sticky Top Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all ${scrolled ? 'bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-slate-950 shadow-lg shadow-emerald-500/30">CW</div>
              <span className="text-xl font-black tracking-tighter">CoinWise</span>
            </div>
            <div className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-300">
              <a href="#features" className="hover:text-emerald-400 transition">Platform</a>
              <a href="#pricing" className="hover:text-emerald-400 transition">Pricing</a>
              <a href="#academy" className="hover:text-emerald-400 transition">Academy</a>
              <a href="#arena" className="hover:text-emerald-400 transition">Arena</a>
              <a href="#faq" className="hover:text-emerald-400 transition">FAQ</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setAuthOpen(true)} className="hidden md:block text-sm font-bold text-slate-300 hover:text-white px-4 py-2">
              Sign in
            </button>
            <button onClick={() => setAuthOpen(true)} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95">
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-emerald-500/15 blur-[180px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 blur-[160px] rounded-full" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:64px_64px] opacity-[0.07]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 bg-slate-900/80 border border-emerald-500/30 px-4 py-1.5 rounded-full text-xs font-bold">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-emerald-400">LIVE</span>
              <span className="text-slate-400">$50,000 Weekly Prize Pool · 12,847 Traders Online</span>
            </div>
          </div>

          <h1 className="text-center font-black tracking-tighter text-5xl md:text-7xl lg:text-8xl mb-8 leading-[0.95]">
            Master Crypto Trading.<br />
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-blue-400 bg-clip-text text-transparent">Win Real Cash.</span>
          </h1>

          <p className="text-center text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            The world's most realistic crypto trading simulator. Practice with $1,000,000 in virtual capital, compete against 100,000+ traders, and cash out real prizes — without risking a single dollar of your own.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button onClick={() => setAuthOpen(true)} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-4 rounded-2xl text-lg shadow-2xl shadow-emerald-500/30 transition active:scale-95">
              Start Trading Free →
            </button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="bg-slate-900 border border-slate-700 hover:border-slate-600 text-white font-black px-8 py-4 rounded-2xl text-lg transition">
              See Pricing
            </button>
          </div>

          {/* Stat strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-800 border border-slate-800 rounded-3xl overflow-hidden max-w-4xl mx-auto">
            {[
              { v: '$12.4M', l: 'Paid Out to Winners' },
              { v: '127K+', l: 'Active Traders' },
              { v: '180+', l: 'Crypto Pairs' },
              { v: '4.9 ★', l: 'Avg. Rating' }
            ].map((s, i) => (
              <div key={i} className="bg-slate-950 p-6 text-center">
                <p className="text-2xl md:text-3xl font-black text-emerald-400">{s.v}</p>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Mock Terminal */}
        <div className="max-w-6xl mx-auto mt-20 relative z-10">
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 pointer-events-none" />
            <div className="flex items-center gap-2 p-4 border-b border-slate-800">
              <div className="w-3 h-3 rounded-full bg-rose-500/70" />
              <div className="w-3 h-3 rounded-full bg-amber-500/70" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              <div className="ml-4 text-xs text-slate-500 font-mono">coinwise.app/terminal</div>
            </div>
            <div className="p-6 grid grid-cols-12 gap-4">
              <div className="col-span-12 md:col-span-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black">BTC/USDT</span>
                      <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded">+2.34%</span>
                    </div>
                    <div className="text-2xl font-black text-emerald-400 font-mono">${tickerPrice.toFixed(2)}</div>
                  </div>
                  <div className="hidden md:flex gap-1 bg-slate-950 p-1 rounded-xl">
                    {['1m', '15m', '1h', '4h', '1D'].map(tf => (
                      <span key={tf} className={`px-3 py-1 text-[10px] font-black rounded-lg ${tf === '1h' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500'}`}>{tf}</span>
                    ))}
                  </div>
                </div>
                <div className="h-64 bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-end p-4 gap-1">
                    {[...Array(40)].map((_, i) => {
                      const h = 25 + Math.random() * 60;
                      const bull = Math.random() > 0.4;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                          <div className={`w-full rounded-sm ${bull ? 'bg-emerald-500/80' : 'bg-rose-500/80'}`} style={{ height: `${h}%` }} />
                        </div>
                      );
                    })}
                  </div>
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                    <path d="M0 180 Q 100 100 200 130 T 400 110 T 600 140 T 800 90" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4,4" opacity="0.6" />
                  </svg>
                </div>
              </div>
              <div className="col-span-12 md:col-span-4 space-y-3">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-3">Quick Trade</p>
                  <div className="flex gap-1 bg-slate-900 p-1 rounded-xl mb-3">
                    <div className="flex-1 py-2 text-center text-xs font-black uppercase bg-emerald-500 text-slate-950 rounded-lg">Buy</div>
                    <div className="flex-1 py-2 text-center text-xs font-black uppercase text-slate-500">Sell</div>
                  </div>
                  <div className="text-[10px] text-slate-500 mb-1">Amount</div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono mb-3">0.0250 BTC</div>
                  <div className="bg-emerald-500 text-slate-950 text-center py-3 rounded-xl font-black text-sm">BUY BTC</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-3">AI Signal</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-emerald-400 font-bold text-xs">STRONG BUY</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">RSI oversold + EMA bullish crossover. Target $69,800.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED BY */}
      <section className="py-12 border-y border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-[10px] uppercase tracking-widest font-black text-slate-500 mb-6">Trusted by traders from</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-slate-500 text-lg font-black opacity-60">
            <span>Goldman Sachs</span><span>·</span>
            <span>JP Morgan</span><span>·</span>
            <span>Citadel</span><span>·</span>
            <span>MIT Sloan</span><span>·</span>
            <span>Wharton</span><span>·</span>
            <span>Stanford</span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-emerald-400 text-xs font-black uppercase tracking-widest">Why CoinWise</span>
            <h2 className="text-4xl md:text-6xl font-black mt-4 mb-4 tracking-tighter">Built like a real exchange.<br />Designed for learners.</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Every feature you'd expect from Binance or Coinbase — plus an AI mentor, weekly cash competitions, and zero risk.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                t: 'Real-time Market Data',
                d: 'Live prices for 180+ crypto pairs streamed directly from Binance. Charts, candlesticks, EMA, RSI — all the indicators pros use.',
                c: 'emerald',
                icon: 'M13 7h8m0 0v8m0-8l-9 9-4-4-6 6'
              },
              {
                t: 'AI Trading Mentor',
                d: 'Powered by Google Gemini. Get instant explanations, market analysis, and personalized strategy recommendations in plain English.',
                c: 'violet',
                icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
              },
              {
                t: 'Live Cash Competitions',
                d: 'Compete in our global Arena. Beat real traders, climb the leaderboard, and cash out via Stripe — straight to your bank.',
                c: 'amber',
                icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z'
              },
              {
                t: 'CoinWise Academy',
                d: '120+ video lessons from former Goldman Sachs traders. Earn certified completion badges. From beginner to advanced quant.',
                c: 'blue',
                icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z'
              },
              {
                t: 'Earn & Stake',
                d: 'Simulate yield farming and staking with up to 18% APY. Master DeFi mechanics safely before deploying real capital.',
                c: 'rose',
                icon: 'M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z'
              },
              {
                t: 'Copy Top Traders',
                d: 'Mirror trades from our top 100 leaderboard winners in one click. Learn by following the people who actually win.',
                c: 'cyan',
                icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
              }
            ].map((f, i) => (
              <div key={i} className="group bg-slate-900/50 border border-slate-800 rounded-3xl p-7 hover:border-slate-700 hover:bg-slate-900 transition relative overflow-hidden">
                <div className={`absolute -top-12 -right-12 w-40 h-40 bg-${f.c}-500/5 group-hover:bg-${f.c}-500/10 rounded-full blur-2xl transition`} />
                <div className={`w-12 h-12 rounded-2xl bg-${f.c}-500/10 text-${f.c}-400 flex items-center justify-center mb-5 relative`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={f.icon} /></svg>
                </div>
                <h3 className="text-xl font-black mb-2 relative">{f.t}</h3>
                <p className="text-slate-400 text-sm leading-relaxed relative">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-32 px-6 bg-gradient-to-b from-transparent via-slate-900/30 to-transparent border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-emerald-400 text-xs font-black uppercase tracking-widest">How it works</span>
            <h2 className="text-4xl md:text-6xl font-black mt-4 tracking-tighter">3 steps. Zero risk. Real rewards.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: '01', t: 'Sign up free', d: 'Create your account in 60 seconds. Get $1,000,000 in simulation capital, instantly.' },
              { n: '02', t: 'Trade & learn', d: 'Buy/sell 180+ real-priced cryptos. Talk to our AI mentor. Build a portfolio with no risk.' },
              { n: '03', t: 'Enter the Arena', d: 'Pay $5 to join a global race. Beat real traders. Cash out via Stripe to your bank.' }
            ].map((s, i) => (
              <div key={i} className="relative">
                <div className="text-7xl font-black text-slate-800 mb-4">{s.n}</div>
                <h3 className="text-2xl font-black mb-3">{s.t}</h3>
                <p className="text-slate-400 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-emerald-400 text-xs font-black uppercase tracking-widest">Pricing</span>
            <h2 className="text-4xl md:text-6xl font-black mt-4 mb-4 tracking-tighter">Start free.<br />Upgrade when you're winning.</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Free forever for learners. Unlock pro features when you're ready to compete seriously.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Free */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col">
              <div className="mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Starter</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black">$0</span>
                  <span className="text-slate-500 text-sm">/forever</span>
                </div>
                <p className="text-slate-400 text-sm mt-3">For learning the basics, risk-free.</p>
              </div>
              <ul className="space-y-3 text-sm flex-1 mb-8">
                {['$1M simulation capital', '180+ crypto pairs', '10 AI mentor messages/day', 'Bronze Arena access ($5)', 'Basic chart indicators', 'Community access'].map(item => (
                  <li key={item} className="flex items-start gap-3 text-slate-300">
                    <svg className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => setAuthOpen(true)} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-3.5 rounded-xl transition">
                Start Free
              </button>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-b from-emerald-500/10 to-slate-900 border-2 border-emerald-500 rounded-3xl p-8 flex flex-col relative scale-[1.03] shadow-2xl shadow-emerald-500/10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                Most Popular
              </div>
              <div className="mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-2">Pro</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black">$19</span>
                  <span className="text-slate-500 text-sm">/month</span>
                </div>
                <p className="text-slate-400 text-sm mt-3">For serious learners climbing the leaderboard.</p>
              </div>
              <ul className="space-y-3 text-sm flex-1 mb-8">
                {['Everything in Starter', 'Unlimited AI mentor', 'Silver + Gold Arena access', 'Advanced indicators (MACD, Bollinger…)', 'Copy top 100 traders', 'Earn up to 12% simulated APY', '50% off all Academy courses', 'Email support'].map(item => (
                  <li key={item} className="flex items-start gap-3 text-slate-200">
                    <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => setAuthOpen(true)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-xl transition shadow-lg shadow-emerald-500/30">
                Upgrade to Pro
              </button>
            </div>

            {/* Elite */}
            <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-8 flex flex-col relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/10 blur-3xl rounded-full" />
              <div className="mb-6 relative">
                <h3 className="text-sm font-black uppercase tracking-widest bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent mb-2">Elite</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black bg-gradient-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent">$99</span>
                  <span className="text-slate-500 text-sm">/month</span>
                </div>
                <p className="text-slate-400 text-sm mt-3">For pros chasing the Diamond Arena prize.</p>
              </div>
              <ul className="space-y-3 text-sm flex-1 mb-8 relative">
                {['Everything in Pro', 'Diamond Arena ($500 entry)', 'Personal AI strategist', 'All Academy courses included', 'Earn up to 18% simulated APY', 'Priority Stripe payouts (instant)', 'Zero trading fees', '24/7 VIP support', 'Private Discord channel'].map(item => (
                  <li key={item} className="flex items-start gap-3 text-slate-200">
                    <svg className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => setAuthOpen(true)} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3.5 rounded-xl transition shadow-lg shadow-amber-500/20 relative">
                Go Elite
              </button>
            </div>
          </div>

          <p className="text-center text-slate-500 text-xs mt-10">All plans include a 7-day money-back guarantee. Cancel anytime.</p>
        </div>
      </section>

      {/* ARENA */}
      <section id="arena" className="py-32 px-6 bg-gradient-to-b from-slate-900/40 to-transparent border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-amber-400 text-xs font-black uppercase tracking-widest">The Arena</span>
              <h2 className="text-4xl md:text-6xl font-black mt-4 mb-6 tracking-tighter">Trade. Compete.<br />Get paid.</h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                Every week, thousands of traders pay a small entry to join the Arena. Beat them with the highest portfolio P&L — and the entire prize pool is yours, wired directly to your bank via Stripe Payouts.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { r: 'Bronze', e: '$5', p: 'Up to $500', c: 'orange' },
                  { r: 'Silver', e: '$25', p: 'Up to $5,000', c: 'slate' },
                  { r: 'Gold', e: '$100', p: 'Up to $25,000', c: 'amber' },
                  { r: 'Diamond', e: '$500', p: 'Up to $50,000', c: 'cyan' }
                ].map(room => (
                  <div key={room.r} className="flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-${room.c}-500/20 text-${room.c}-400 flex items-center justify-center font-black`}>
                        {room.r[0]}
                      </div>
                      <div>
                        <p className="font-black">{room.r} Arena</p>
                        <p className="text-xs text-slate-500">Entry: {room.e}</p>
                      </div>
                    </div>
                    <p className="text-emerald-400 font-black">{room.p}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setAuthOpen(true)} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-7 py-3.5 rounded-xl transition shadow-lg shadow-amber-500/20">
                Enter the Arena
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Live Leaderboard · Gold Arena</span>
                <span className="text-xs font-black text-amber-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> LIVE
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { r: 1, n: 'Alex Chen', p: 47.82, v: '1,478,250' },
                  { r: 2, n: 'Sofia Martínez', p: 41.16, v: '1,411,640' },
                  { r: 3, n: 'Yuki Tanaka', p: 38.94, v: '1,389,440' },
                  { r: 4, n: 'Marcus Johnson', p: 32.51, v: '1,325,110' },
                  { r: 5, n: 'Priya Patel', p: 28.07, v: '1,280,720' }
                ].map(t => (
                  <div key={t.r} className="flex items-center gap-3 bg-slate-950/50 border border-slate-800/50 rounded-xl px-4 py-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${t.r === 1 ? 'bg-amber-400/20 text-amber-400' : t.r === 2 ? 'bg-slate-300/20 text-slate-300' : t.r === 3 ? 'bg-orange-400/20 text-orange-400' : 'bg-slate-800 text-slate-500'}`}>
                      {t.r}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{t.n}</p>
                      <p className="text-[10px] text-slate-500 font-mono">${t.v}</p>
                    </div>
                    <p className="text-emerald-400 font-black text-sm">+{t.p}%</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 p-5 bg-emerald-500/5 border border-emerald-500/30 rounded-2xl text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-1">Current Prize Pool</p>
                <p className="text-3xl font-black text-emerald-400">$24,750</p>
                <p className="text-[10px] text-slate-500 mt-1">Winner takes all · Ends in 14h 22m</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ACADEMY */}
      <section id="academy" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-blue-400 text-xs font-black uppercase tracking-widest">CoinWise Academy</span>
            <h2 className="text-4xl md:text-6xl font-black mt-4 mb-4 tracking-tighter">Learn from people<br />who actually trade.</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Bite-sized lessons from former hedge fund analysts, on-chain quants, and crypto OGs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { t: 'Crypto Fundamentals', l: '12 lessons · 2h', p: 'Free', c: 'emerald', i: '🎓' },
              { t: 'Technical Analysis Mastery', l: '24 lessons · 6h', p: '$49', c: 'blue', i: '📈' },
              { t: 'DeFi & Yield Farming', l: '18 lessons · 4h', p: '$79', c: 'violet', i: '🌾' },
              { t: 'Risk Management Pro', l: '15 lessons · 3h', p: '$99', c: 'rose', i: '🛡️' },
              { t: 'Algorithmic Trading 101', l: '32 lessons · 8h', p: '$149', c: 'amber', i: '🤖' },
              { t: 'Hedge Fund Strategies', l: '40 lessons · 12h', p: '$299', c: 'cyan', i: '💎' }
            ].map(course => (
              <div key={course.t} className="group bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700 transition">
                <div className={`h-40 bg-gradient-to-br from-${course.c}-500/30 via-${course.c}-500/10 to-transparent flex items-center justify-center text-6xl`}>
                  {course.i}
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-black text-lg">{course.t}</h3>
                    <span className={`text-xs font-black bg-${course.c}-500/20 text-${course.c}-400 px-2 py-1 rounded-md`}>{course.p}</span>
                  </div>
                  <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">{course.l}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-32 px-6 bg-gradient-to-b from-transparent via-slate-900/30 to-transparent border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-emerald-400 text-xs font-black uppercase tracking-widest">What traders say</span>
            <h2 className="text-4xl md:text-6xl font-black mt-4 tracking-tighter">Loved by 127,000+ traders.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: 'Daniel R.', r: 'Stanford MBA', q: 'CoinWise turned my finance theory into actual trading intuition. Won $4,200 in the Gold Arena last month — and didn\'t risk a single dollar of my own to learn.' },
              { n: 'Maya K.', r: 'Self-taught', q: 'The AI mentor is unreal. I asked one question about funding rates and got a 3-paragraph answer better than any YouTube video. Pro plan paid for itself in week one.' },
              { n: 'Tom B.', r: 'Day trader, 8 yrs', q: 'I use CoinWise to test strategies before deploying real capital. Saved me from a brutal short squeeze last week. Worth every penny of Elite.' }
            ].map(t => (
              <div key={t.n} className="bg-slate-900/70 border border-slate-800 rounded-3xl p-7">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="text-slate-300 leading-relaxed mb-6">"{t.q}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-black text-emerald-400 text-sm">{t.n.split(' ').map(s => s[0]).join('')}</div>
                  <div>
                    <p className="font-black text-sm">{t.n}</p>
                    <p className="text-xs text-slate-500">{t.r}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-32 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-emerald-400 text-xs font-black uppercase tracking-widest">FAQ</span>
            <h2 className="text-4xl md:text-5xl font-black mt-4 tracking-tighter">Questions, answered.</h2>
          </div>

          <div className="space-y-3">
            {[
              { q: 'Is CoinWise real trading or simulated?', a: 'Simulated, with live real-time prices from Binance. You can\'t lose real money — but you can win real cash in the Arena, paid out via Stripe Payouts to your bank.' },
              { q: 'Do I need to provide a credit card to start?', a: 'No. The Starter plan is 100% free forever — no card required. You only pay if you want to enter a paid Arena room ($5 minimum) or upgrade to Pro/Elite.' },
              { q: 'How do prize payouts work?', a: 'Top finishers in each Arena room receive their share of the prize pool. Payouts are processed through Stripe Connect and typically arrive in your bank in 1-2 business days.' },
              { q: 'Can I cancel Pro or Elite anytime?', a: 'Yes. Cancel from your account settings with one click. We also offer a 7-day money-back guarantee on all paid plans.' },
              { q: 'Is my data safe?', a: 'All accounts are protected by Firebase Authentication with end-to-end encryption. We never store payment data — Stripe handles all financial transactions on PCI-DSS Level 1 infrastructure.' }
            ].map((f, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left">
                  <span className="font-black">{f.q}</span>
                  <svg className={`w-5 h-5 text-slate-500 transition-transform ${activeFaq === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {activeFaq === i && (
                  <div className="px-6 pb-6 text-slate-400 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-emerald-500/20 via-slate-900 to-blue-500/10 border border-emerald-500/30 rounded-[40px] p-16 relative overflow-hidden">
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/20 blur-3xl rounded-full" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-500/20 blur-3xl rounded-full" />
          <div className="relative">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">Ready to trade?</h2>
            <p className="text-slate-300 text-xl mb-10">Join 127,000+ traders. Start with $1,000,000. Pay nothing.</p>
            <button onClick={() => setAuthOpen(true)} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-10 py-5 rounded-2xl text-xl shadow-2xl shadow-emerald-500/30 transition active:scale-95">
              Create My Free Account →
            </button>
            <p className="text-slate-500 text-xs mt-6">No credit card required · 60-second signup</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-slate-950">CW</div>
                <span className="text-xl font-black tracking-tighter">CoinWise</span>
              </div>
              <p className="text-slate-400 text-sm max-w-xs leading-relaxed">The risk-free way to master crypto trading. Practice with $1M, compete for real cash.</p>
            </div>
            {[
              { t: 'Platform', l: ['Terminal', 'Markets', 'Arena', 'Academy', 'Earn'] },
              { t: 'Company', l: ['About', 'Careers', 'Press', 'Blog', 'Contact'] },
              { t: 'Legal', l: ['Terms', 'Privacy', 'Cookies', 'Disclosures', 'AML'] }
            ].map(col => (
              <div key={col.t}>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">{col.t}</p>
                <ul className="space-y-2.5 text-sm">
                  {col.l.map(item => <li key={item}><a href="#" className="text-slate-400 hover:text-emerald-400 transition">{item}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-800/50 gap-4">
            <p className="text-slate-500 text-xs">© 2026 CoinWise AI. Crypto trading is risky — practice here first.</p>
            <div className="flex gap-4 text-slate-500">
              <span className="text-xs">🇺🇸 EN</span>
              <span className="text-xs">·</span>
              <span className="text-xs">USD</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
