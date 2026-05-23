import React, { useState } from 'react';
import { SubscriptionTier } from '../types';
import { CurrencyToggle } from '../services/currency';

export type TabKey =
  | 'dashboard' | 'markets' | 'competition'
  | 'pulse' | 'credit' | 'advisor' | 'shield' | 'apidocs'
  | 'academy' | 'earn' | 'pro' | 'referral' | 'history';

interface LayoutProps {
  children: React.ReactNode;
  user: { name: string; accountId: string; competition?: { isCompeting: boolean }; tier?: SubscriptionTier };
  onLogout: () => void;
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

const NAV_ITEMS: { key: TabKey; label: string; icon: string; group: 'TRADE' | 'AI INSIGHTS' | 'GROW' | 'ACCOUNT'; badge?: 'PRO' | 'NEW' | 'HOT' | 'AI' }[] = [
  { key: 'dashboard', label: 'Terminal', icon: 'M13 7h8m0 0v8m0-8l-9 9-4-4-6 6', group: 'TRADE' },
  { key: 'markets', label: 'Markets', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', group: 'TRADE' },
  { key: 'competition', label: 'Arena', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', group: 'TRADE', badge: 'HOT' },
  { key: 'pulse', label: 'Social Pulse', icon: 'M3 12h2l2-9 4 18 3-12 2 6h5', group: 'AI INSIGHTS', badge: 'AI' },
  { key: 'credit', label: 'Credit Score', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', group: 'AI INSIGHTS', badge: 'AI' },
  { key: 'advisor', label: 'AI Advisor', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', group: 'AI INSIGHTS', badge: 'AI' },
  { key: 'shield', label: 'Fraud Shield', icon: 'M9 12l2 2 4-4M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', group: 'AI INSIGHTS', badge: 'AI' },
  { key: 'apidocs', label: 'API Docs', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', group: 'AI INSIGHTS' },
  { key: 'earn', label: 'Earn', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', group: 'GROW' },
  { key: 'academy', label: 'Academy', icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z', group: 'GROW' },
  { key: 'referral', label: 'Referral', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', group: 'GROW', badge: 'NEW' },
  { key: 'history', label: 'History', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', group: 'ACCOUNT' },
  { key: 'pro', label: 'Upgrade', icon: 'M5 3l14 9-14 9V3z', group: 'ACCOUNT', badge: 'PRO' }
];

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, activeTab, setActiveTab }) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const tier = user.tier || 'STARTER';
  const tierColor = tier === 'ELITE' ? 'amber' : tier === 'PRO' ? 'emerald' : 'slate';
  const tierLabel = tier === 'ELITE' ? 'ELITE' : tier === 'PRO' ? 'PRO' : 'FREE';

  const grouped = {
    TRADE: NAV_ITEMS.filter(i => i.group === 'TRADE'),
    'AI INSIGHTS': NAV_ITEMS.filter(i => i.group === 'AI INSIGHTS'),
    GROW: NAV_ITEMS.filter(i => i.group === 'GROW'),
    ACCOUNT: NAV_ITEMS.filter(i => i.group === 'ACCOUNT')
  };

  const renderNavButton = (item: typeof NAV_ITEMS[number]) => (
    <button
      key={item.key}
      onClick={() => { setActiveTab(item.key); setMobileNavOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all relative ${
        activeTab === item.key
          ? 'bg-emerald-500/10 text-emerald-400 font-black shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]'
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-bold'
      }`}
    >
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
      </svg>
      <span className="text-sm flex-1 text-left">{item.label}</span>
      {item.badge && (
        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${
          item.badge === 'PRO' ? 'bg-amber-500/20 text-amber-400' :
          item.badge === 'HOT' ? 'bg-rose-500/20 text-rose-400' :
          item.badge === 'AI' ? 'bg-fuchsia-500/20 text-fuchsia-300' :
          'bg-blue-500/20 text-blue-400'
        }`}>{item.badge}</span>
      )}
      {item.key === 'competition' && user.competition?.isCompeting && (
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-black text-slate-950 text-sm">CW</div>
          <span className="font-black tracking-tighter">CoinWise</span>
        </div>
        <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="text-slate-300 p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={mobileNavOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`${mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed md:relative inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform`}>
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-slate-950 shadow-lg shadow-emerald-500/20">CW</div>
          <div className="flex-1">
            <h1 className="text-lg font-black tracking-tighter leading-none">CoinWise</h1>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-1">AI Trading</p>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-4 pb-3 flex justify-center">
            <CurrencyToggle compact />
          </div>
          {(['TRADE', 'AI INSIGHTS', 'GROW', 'ACCOUNT'] as const).map(group => (
            <div key={group} className="mb-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 px-5 mb-2">{group}</p>
              <ul className="space-y-1 px-3">
                {grouped[group].map(item => <li key={item.key}>{renderNavButton(item)}</li>)}
              </ul>
            </div>
          ))}
        </nav>

        {/* Pro Upgrade Card (shown only for non-Elite) */}
        {tier !== 'ELITE' && (
          <div className="px-4 pb-3">
            <button
              onClick={() => { setActiveTab('pro'); setMobileNavOpen(false); }}
              className="w-full bg-gradient-to-br from-amber-500/20 via-emerald-500/10 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 text-left hover:border-emerald-500/50 transition group"
            >
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Go {tier === 'PRO' ? 'Elite' : 'Pro'}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-2">{tier === 'PRO' ? 'Unlock Diamond Arena & 18% APY' : 'Unlimited AI & advanced indicators'}</p>
              <p className="text-emerald-400 text-xs font-black group-hover:translate-x-1 transition-transform">Upgrade →</p>
            </button>
          </div>
        )}

        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className={`w-10 h-10 rounded-xl bg-${tierColor}-500/10 border border-${tierColor}-500/30 flex items-center justify-center text-xs font-black text-${tierColor}-400 uppercase shrink-0`}>
              {user.name.substring(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black truncate flex items-center gap-1.5">
                {user.name}
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                  tier === 'ELITE' ? 'bg-amber-500/20 text-amber-400' :
                  tier === 'PRO' ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-slate-700 text-slate-300'
                }`}>{tierLabel}</span>
              </p>
              <p className="text-[10px] text-slate-600 truncate font-bold">{user.accountId}</p>
            </div>
            <button
              onClick={onLogout}
              title="Sign out"
              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileNavOpen && <div onClick={() => setMobileNavOpen(false)} className="md:hidden fixed inset-0 bg-slate-950/80 backdrop-blur z-30" />}

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-slate-950 pt-16 md:pt-0">
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
