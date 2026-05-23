import React, { useState } from 'react';
import { SubscriptionTier, UserState } from '../types';

interface ProPlansPageProps {
  user: UserState;
  onUpgrade: (tier: SubscriptionTier) => void;
}

const PLANS = [
  {
    id: 'STARTER' as SubscriptionTier,
    name: 'Starter',
    priceMonthly: 0,
    priceYearly: 0,
    tagline: 'For learning the basics',
    color: 'slate',
    features: [
      { t: '$1M simulation capital', enabled: true },
      { t: '180+ crypto markets', enabled: true },
      { t: 'AI mentor (10 msgs/day)', enabled: true },
      { t: 'Bronze Arena access', enabled: true },
      { t: 'Basic indicators (EMA, RSI)', enabled: true },
      { t: 'Trading fee 0.10%', enabled: true },
      { t: 'Earn up to 5% APY', enabled: true },
      { t: 'Silver/Gold/Diamond Arena', enabled: false },
      { t: 'Unlimited AI mentor', enabled: false },
      { t: 'Copy top traders', enabled: false },
      { t: 'Advanced indicators', enabled: false },
      { t: 'Zero trading fees', enabled: false },
      { t: 'VIP support', enabled: false }
    ]
  },
  {
    id: 'PRO' as SubscriptionTier,
    name: 'Pro',
    priceMonthly: 19,
    priceYearly: 15,
    tagline: 'For serious traders',
    color: 'emerald',
    popular: true,
    features: [
      { t: 'Everything in Starter', enabled: true },
      { t: 'Unlimited AI mentor', enabled: true },
      { t: 'Bronze + Silver + Gold Arena', enabled: true },
      { t: '8 advanced indicators', enabled: true },
      { t: 'Copy top 100 traders', enabled: true },
      { t: 'Earn up to 12% APY', enabled: true },
      { t: 'Trading fee 0.05%', enabled: true },
      { t: '50% off all Academy courses', enabled: true },
      { t: 'Real-time market alerts', enabled: true },
      { t: 'Email support', enabled: true },
      { t: 'Diamond Arena ($500 entry)', enabled: false },
      { t: 'Personal AI strategist', enabled: false },
      { t: 'Free Academy bundle ($800)', enabled: false }
    ]
  },
  {
    id: 'ELITE' as SubscriptionTier,
    name: 'Elite',
    priceMonthly: 99,
    priceYearly: 79,
    tagline: 'For pros chasing the prize',
    color: 'amber',
    features: [
      { t: 'Everything in Pro', enabled: true },
      { t: 'Diamond Arena ($500 entry)', enabled: true },
      { t: 'Personal AI strategist', enabled: true },
      { t: 'All Academy courses included', enabled: true },
      { t: 'Earn up to 18% APY', enabled: true },
      { t: 'Zero trading fees', enabled: true },
      { t: 'Instant Stripe payouts', enabled: true },
      { t: '24/7 VIP support', enabled: true },
      { t: 'Private Discord channel', enabled: true },
      { t: '1-on-1 monthly strategy call', enabled: true },
      { t: 'Custom AI bot builder', enabled: true },
      { t: 'API access for algorithms', enabled: true },
      { t: 'Early access to features', enabled: true }
    ]
  }
];

const FAQS = [
  { q: 'Can I cancel anytime?', a: 'Yes, cancel from your account settings. You keep access until the end of your billing period. No questions asked.' },
  { q: 'Is there a free trial for Pro/Elite?', a: 'All paid plans include a 7-day money-back guarantee. If you\'re not satisfied, we refund 100% — no friction.' },
  { q: 'What payment methods are accepted?', a: 'Visa, Mastercard, American Express, Apple Pay, and Google Pay via Stripe. Crypto payments coming Q3.' },
  { q: 'Can I switch tiers later?', a: 'Yes. Upgrades are instant and prorated. Downgrades take effect at the next billing cycle.' },
  { q: 'Are Arena entry fees included in Pro/Elite?', a: 'No — Arena entries are separate. But Elite members get one free Bronze entry per week and 25% off all higher-tier rooms.' }
];

const ProPlansPage: React.FC<ProPlansPageProps> = ({ user, onUpgrade }) => {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutOpen, setCheckoutOpen] = useState<SubscriptionTier | null>(null);

  const currentTier = user.tier || 'STARTER';

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="text-center pt-4">
        <span className="inline-block bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">Membership</span>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">Unlock your full trading edge.</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">Choose the plan that matches your ambition. Cancel anytime. 7-day money-back guarantee.</p>

        {/* Billing toggle */}
        <div className="inline-flex bg-slate-900 border border-slate-800 rounded-2xl p-1 mt-8">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition ${billing === 'monthly' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition flex items-center gap-2 ${billing === 'yearly' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
          >
            Yearly <span className="bg-emerald-500/20 text-emerald-400 text-[8px] px-2 py-0.5 rounded">SAVE 20%</span>
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {PLANS.map(plan => {
          const price = billing === 'monthly' ? plan.priceMonthly : plan.priceYearly;
          const isCurrent = currentTier === plan.id;
          const isPro = plan.id === 'PRO';
          const isElite = plan.id === 'ELITE';
          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-7 flex flex-col ${
                isPro ? 'bg-gradient-to-b from-emerald-500/10 to-slate-900 border-2 border-emerald-500 scale-[1.02] shadow-2xl shadow-emerald-500/10' :
                isElite ? 'bg-slate-900 border border-amber-500/30' :
                'bg-slate-900 border border-slate-800'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                  Most Popular
                </div>
              )}
              {isElite && (
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
              )}
              <div className="mb-6 relative">
                <h3 className={`text-sm font-black uppercase tracking-widest mb-2 ${
                  isElite ? 'bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent' :
                  isPro ? 'text-emerald-400' : 'text-slate-400'
                }`}>{plan.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className={`text-5xl font-black ${
                    isElite ? 'bg-gradient-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent' : ''
                  }`}>${price}</span>
                  <span className="text-slate-500 text-sm">/month</span>
                </div>
                <p className="text-slate-400 text-sm mt-3">{plan.tagline}</p>
                {billing === 'yearly' && plan.priceMonthly > 0 && (
                  <p className="text-[10px] text-emerald-400 mt-1 font-black uppercase tracking-widest">Billed ${plan.priceYearly * 12}/year</p>
                )}
              </div>

              <ul className="space-y-2.5 text-sm flex-1 mb-6 relative">
                {plan.features.map(f => (
                  <li key={f.t} className={`flex items-start gap-3 ${f.enabled ? 'text-slate-200' : 'text-slate-600 line-through'}`}>
                    {f.enabled ? (
                      <svg className={`w-4 h-4 mt-0.5 shrink-0 ${isElite ? 'text-amber-400' : isPro ? 'text-emerald-400' : 'text-emerald-500'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    ) : (
                      <svg className="w-4 h-4 mt-0.5 shrink-0 text-slate-700" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    )}
                    {f.t}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button disabled className="w-full bg-slate-800 text-slate-400 font-black py-3.5 rounded-xl cursor-not-allowed">
                  Current Plan
                </button>
              ) : plan.id === 'STARTER' ? (
                <button onClick={() => onUpgrade('STARTER')} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-3.5 rounded-xl transition">
                  Downgrade
                </button>
              ) : (
                <button
                  onClick={() => setCheckoutOpen(plan.id)}
                  className={`w-full font-black py-3.5 rounded-xl transition shadow-lg ${
                    isElite ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20' :
                    'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
                  }`}
                >
                  Upgrade to {plan.name}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Comparison strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-6xl mx-auto">
        <h2 className="text-2xl font-black mb-6 tracking-tighter">By the numbers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-800 rounded-2xl overflow-hidden">
          {[
            { v: '$12.4M', l: 'Paid Out in 2025' },
            { v: '127K+', l: 'Active Members' },
            { v: '4.9 ★', l: 'Trustpilot Rating' },
            { v: '<2s', l: 'Avg. Trade Latency' }
          ].map((s, i) => (
            <div key={i} className="bg-slate-900 p-6 text-center">
              <p className="text-3xl font-black text-emerald-400">{s.v}</p>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Enterprise CTA */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 max-w-6xl mx-auto">
        <div className="flex-1">
          <h2 className="text-2xl font-black mb-2">Need it for your team or institution?</h2>
          <p className="text-slate-400">Custom pricing for universities, prop trading firms, and bootcamps. Seat-based licensing, SSO, and dedicated success manager.</p>
        </div>
        <button className="bg-white text-slate-900 font-black px-7 py-3.5 rounded-xl transition hover:bg-slate-100">
          Contact Sales →
        </button>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-black mb-6 tracking-tighter text-center">Pricing FAQ</h2>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <details key={i} className="group bg-slate-900 border border-slate-800 rounded-2xl">
              <summary className="cursor-pointer p-5 font-black flex items-center justify-between list-none">
                <span>{f.q}</span>
                <svg className="w-5 h-5 text-slate-500 group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <p className="px-5 pb-5 text-slate-400 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>

      {/* Stripe-style Checkout Modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="bg-[#635BFF] text-white p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-80">Stripe Checkout</p>
                <p className="text-2xl font-black">CoinWise {PLANS.find(p => p.id === checkoutOpen)?.name}</p>
              </div>
              <button onClick={() => setCheckoutOpen(null)} className="text-white/80 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-slate-50 rounded-2xl p-4 flex justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Subscription</p>
                  <p className="font-black">{PLANS.find(p => p.id === checkoutOpen)?.name} ({billing})</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Today</p>
                  <p className="font-black text-[#635BFF]">${billing === 'monthly' ? PLANS.find(p => p.id === checkoutOpen)?.priceMonthly : (PLANS.find(p => p.id === checkoutOpen)?.priceYearly || 0) * 12}.00</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
                <input defaultValue={user.accountId} className="w-full border-2 border-slate-200 rounded-xl px-3 py-3 text-sm focus:border-[#635BFF] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Card Information</label>
                <input placeholder="1234 1234 1234 1234" className="w-full border-2 border-slate-200 rounded-xl px-3 py-3 text-sm font-mono focus:border-[#635BFF] outline-none" />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input placeholder="MM / YY" className="border-2 border-slate-200 rounded-xl px-3 py-3 text-sm focus:border-[#635BFF] outline-none" />
                  <input placeholder="CVC" className="border-2 border-slate-200 rounded-xl px-3 py-3 text-sm focus:border-[#635BFF] outline-none" />
                </div>
              </div>
              <button
                onClick={() => { onUpgrade(checkoutOpen); setCheckoutOpen(null); }}
                className="w-full bg-[#635BFF] hover:bg-[#5851e0] text-white font-bold py-4 rounded-xl text-lg transition"
              >
                Subscribe — ${billing === 'monthly' ? PLANS.find(p => p.id === checkoutOpen)?.priceMonthly : (PLANS.find(p => p.id === checkoutOpen)?.priceYearly || 0) * 12}.00
              </button>
              <p className="text-[10px] text-slate-500 text-center">By subscribing, you agree to CoinWise Terms. Cancel anytime. 7-day money-back guarantee.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProPlansPage;
