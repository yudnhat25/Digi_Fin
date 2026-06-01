import React, { useEffect, useState } from 'react';
import { SubscriptionTier } from '../types';
import { CurrencyToggle } from '../services/currency';
import { apiFearGreed, apiMarketPrices } from '../services/coinwiseApi';

export type TabKey =
  | 'dashboard' | 'markets' | 'competition'
  | 'pulse' | 'pipeline' | 'credit' | 'advisor' | 'shield' | 'apidocs'
  | 'academy' | 'earn' | 'pro' | 'referral' | 'history';

interface LayoutProps {
  children: React.ReactNode;
  user: { name: string; accountId: string; competition?: { isCompeting: boolean }; tier?: SubscriptionTier };
  onLogout: () => void;
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

type NavGroup = 'TRADE' | 'AI' | 'GROW' | 'ACCOUNT';
type Badge = 'PRO' | 'NEW' | 'LIVE' | 'AI';

interface NavItem {
  key: TabKey;
  label: string;
  group: NavGroup;
  badge?: Badge;
  icon: React.ReactNode;
}

const Icon = ({ d, stroke = 1.6 }: { d: string; stroke?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} className="w-[15px] h-[15px]">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard',  label: 'Terminal',     group: 'TRADE',   icon: <Icon d="M3 12h4l3-9 4 18 3-12 4 6" /> },
  { key: 'markets',    label: 'Markets',      group: 'TRADE',   icon: <Icon d="M3 17l6-6 4 4 8-8M14 7h7v7" /> },
  { key: 'competition',label: 'Arena',        group: 'TRADE',   badge: 'LIVE', icon: <Icon d="M8 21h8M12 17v4M5 4h14l-1 9a6 6 0 0 1-12 0L5 4z" /> },

  { key: 'pulse',      label: 'Social Pulse', group: 'AI',      badge: 'AI', icon: <Icon d="M3 12h2l2-9 4 18 3-12 2 6h5" /> },
  { key: 'pipeline',   label: 'Alt-Data Lab', group: 'AI',      badge: 'NEW', icon: <Icon d="M4 6h16M4 12h10M4 18h6M18 14l4 4-4 4M14 18h8" /> },
  { key: 'credit',     label: 'Credit Score', group: 'AI',      badge: 'AI', icon: <Icon d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0zm5 0l3 3 5-6" /> },
  { key: 'advisor',    label: 'AI Advisor',   group: 'AI',      badge: 'AI', icon: <Icon d="M9.7 17h4.6M12 3v1m6.4 1.6l-.7.7M21 12h-1M4 12H3m3.3-5.7l-.7-.7m2.8 9.9a5 5 0 1 1 7.1 0l-.5.5A3.4 3.4 0 0 0 14 18.5V19a2 2 0 1 1-4 0v-.5c0-.9-.4-1.8-1-2.4l-.5-.5z" /> },
  { key: 'shield',     label: 'Fraud Shield', group: 'AI',      badge: 'AI', icon: <Icon d="M12 3l8 4v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7l8-4z" /> },
  { key: 'apidocs',    label: 'API Docs',     group: 'AI',      icon: <Icon d="M10 4l-6 8 6 8M14 4l6 8-6 8" /> },

  { key: 'earn',       label: 'Earn',         group: 'GROW',    icon: <Icon d="M12 7v10m-3-3.5c0 1.4 1.3 2.5 3 2.5s3-.8 3-2-1.3-2-3-2-3-.8-3-2 1.3-2 3-2 3 1.1 3 2.5" /> },
  { key: 'academy',    label: 'Academy',      group: 'GROW',    icon: <Icon d="M3 8l9-4 9 4-9 4-9-4zM5 11v4a7 7 0 0 0 14 0v-4" /> },
  { key: 'referral',   label: 'Referral',     group: 'GROW',    badge: 'NEW', icon: <Icon d="M16 11a3 3 0 1 0-2.8-4M8 11a3 3 0 1 1 2.8-4M4 20a4 4 0 0 1 4-4h2M20 20a4 4 0 0 0-4-4h-2" /> },

  { key: 'history',    label: 'History',      group: 'ACCOUNT', icon: <Icon d="M12 8v4l3 2M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.7 3" /> },
  { key: 'pro',        label: 'Upgrade',      group: 'ACCOUNT', badge: 'PRO', icon: <Icon d="M5 16l3-8 4 6 3-4 4 6H5z" /> },
];

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, activeTab, setActiveTab }) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const tier = user.tier || 'STARTER';

  const grouped = (['TRADE', 'AI', 'GROW', 'ACCOUNT'] as const).reduce((acc, g) => {
    acc[g] = NAV_ITEMS.filter(i => i.group === g);
    return acc;
  }, {} as Record<NavGroup, NavItem[]>);

  return (
    <div className="min-h-screen flex flex-col bg-[#04060c] text-slate-100">
      <TopBar
        userName={user.name}
        tier={tier}
        mobileNavOpen={mobileNavOpen}
        onMobileNavToggle={() => setMobileNavOpen(o => !o)}
      />

      <div className="flex-1 flex pt-[56px]">
        {/* ───────── Sidebar ───────── */}
        <aside
          className={`fixed md:sticky top-[56px] z-30 h-[calc(100vh-56px)] w-[232px] border-r border-white/[0.06] bg-[#04060c] flex flex-col transition-transform ${
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
            {(['TRADE', 'AI', 'GROW', 'ACCOUNT'] as const).map(group => (
              <div key={group}>
                <p className="px-3 mb-2 text-[10px] tracking-[0.18em] text-slate-500 font-semibold">{group}</p>
                <ul className="space-y-0.5">
                  {grouped[group].map(item => (
                    <li key={item.key}>
                      <NavButton
                        item={item}
                        active={activeTab === item.key}
                        onClick={() => { setActiveTab(item.key); setMobileNavOpen(false); }}
                        competing={item.key === 'competition' && user.competition?.isCompeting}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <PortfolioPill />

          <button
            onClick={onLogout}
            className="m-3 inline-flex items-center justify-center gap-2 text-[12px] text-slate-500 hover:text-rose-400 border border-white/[0.06] hover:border-rose-400/30 rounded-md px-3 py-2 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" /></svg>
            Sign out
          </button>
        </aside>

        {mobileNavOpen && (
          <div onClick={() => setMobileNavOpen(false)} className="md:hidden fixed inset-0 top-[56px] z-20 bg-black/60 backdrop-blur-sm" />
        )}

        {/* ───────── Main ───────── */}
        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 px-5 md:px-8 py-6 md:py-8 max-w-[1600px] mx-auto w-full">
            {children}
          </div>
          <StatusFooter />
        </main>
      </div>
    </div>
  );
};

/* ─────────────────────────── Subcomponents ─────────────────────────── */

const NavButton: React.FC<{
  item: NavItem;
  active: boolean;
  onClick: () => void;
  competing?: boolean;
}> = ({ item, active, onClick, competing }) => {
  const badgeColor: Record<Badge, string> = {
    PRO:  'text-amber-300 bg-amber-500/10',
    NEW:  'text-sky-300 bg-sky-500/10',
    LIVE: 'text-rose-300 bg-rose-500/10',
    AI:   'text-fuchsia-300 bg-fuchsia-500/10',
  };

  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] transition-colors ${
        active
          ? 'bg-white/[0.06] text-slate-100 font-medium'
          : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.03]'
      }`}
    >
      <span className={active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}>
        {item.icon}
      </span>
      <span className="flex-1 text-left">{item.label}</span>
      {competing && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
      {item.badge && (
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-[0.1em] ${badgeColor[item.badge]}`}>
          {item.badge}
        </span>
      )}
    </button>
  );
};

const TopBar: React.FC<{
  userName: string;
  tier: SubscriptionTier;
  mobileNavOpen: boolean;
  onMobileNavToggle: () => void;
}> = ({ userName, tier, mobileNavOpen, onMobileNavToggle }) => {
  const [tickers, setTickers] = useState<Record<string, { price: number; change: number }>>({
    BTC: { price: 74857, change: -8.71 },
    ETH: { price: 3204, change: 1.24 },
  });
  const [fg, setFg] = useState<{ value: number; classification: string } | null>(null);
  const [showCmd, setShowCmd] = useState(false);

  // Streaming tickers from Binance WS. Combined miniTicker stream gives ~1s updates.
  useEffect(() => {
    let alive = true;
    let ws: WebSocket | null = null;
    let retryTimer: number | null = null;

    const open = () => {
      ws = new WebSocket('wss://stream.binance.com:9443/stream?streams=btcusdt@miniTicker/ethusdt@miniTicker');
      ws.onmessage = (e) => {
        if (!alive) return;
        try {
          const msg = JSON.parse(e.data) as { data: { s: string; c: string; o: string } };
          const d = msg.data;
          if (!d) return;
          const sym = d.s.replace('USDT', '');
          const price = Number(d.c);
          const open = Number(d.o);
          const change = open ? ((price - open) / open) * 100 : 0;
          setTickers(prev => ({ ...prev, [sym]: { price, change } }));
        } catch { /* ignore */ }
      };
      ws.onclose = () => {
        if (!alive) return;
        retryTimer = window.setTimeout(open, 3000);
      };
    };
    open();

    // Fear & Greed via REST (slow-moving — poll every minute).
    let alive2 = true;
    const loadFg = async () => {
      try {
        const f = await apiFearGreed();
        if (alive2) setFg({ value: f.value, classification: f.classification });
      } catch { /* keep last */ }
    };
    loadFg();
    const fgTimer = setInterval(loadFg, 60_000);

    return () => {
      alive = false;
      alive2 = false;
      if (retryTimer) window.clearTimeout(retryTimer);
      if (ws) { try { ws.close(); } catch { /* noop */ } }
      clearInterval(fgTimer);
    };
  }, []);

  // Suppress unused import warning when REST fallback is removed.
  void apiMarketPrices;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCmd(o => !o);
      } else if (e.key === 'Escape') {
        setShowCmd(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const initials = userName.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-[56px] bg-[#04060c]/95 backdrop-blur border-b border-white/[0.06]">
      <div className="h-full px-3 md:px-5 flex items-center gap-3">
        <button onClick={onMobileNavToggle} className="md:hidden p-2 text-slate-300 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={mobileNavOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-md bg-emerald-400 text-emerald-950 grid place-items-center font-black text-[12px]">CW</div>
          <span className="font-semibold tracking-tight text-[13.5px] hidden sm:inline">CoinWise<span className="text-emerald-400">AI</span></span>
        </div>

        <button
          onClick={() => setShowCmd(true)}
          className="ml-2 flex items-center gap-2 h-8 px-3 rounded-md bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] text-[12.5px] text-slate-500 min-w-0 flex-1 max-w-[360px]"
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.3-4.3" /></svg>
          <span className="truncate">Search markets, news, AI…</span>
          <span className="ml-auto text-[10px] font-mono text-slate-600 border border-white/[0.08] rounded px-1 py-0.5 shrink-0">⌘K</span>
        </button>

        <div className="hidden lg:flex items-center gap-4 text-[12px] tabular-nums">
          {(['BTC', 'ETH'] as const).map(sym => (
            <Ticker key={sym} symbol={sym} price={tickers[sym]?.price ?? 0} change={tickers[sym]?.change ?? 0} />
          ))}
        </div>

        <FearGreedChip fg={fg} />

        <div className="hidden md:flex flex-1" />

        <div className="hidden sm:block">
          <CurrencyToggle compact />
        </div>

        <button className="hidden md:grid place-items-center w-8 h-8 rounded-md hover:bg-white/[0.04] text-slate-400 relative">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0" /></svg>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-400" />
        </button>

        <button className="flex items-center gap-2 h-8 px-2 rounded-md hover:bg-white/[0.04]">
          <div className="w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-300 grid place-items-center text-[10px] font-bold">{initials || 'CW'}</div>
          <span className="hidden md:inline text-[12.5px] text-slate-200 font-medium truncate max-w-[100px]">{userName.split(' ')[0]}</span>
          {tier !== 'STARTER' && (
            <span className={`hidden md:inline text-[9px] font-bold px-1.5 py-0.5 rounded ${tier === 'ELITE' ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
              {tier}
            </span>
          )}
        </button>
      </div>

      {showCmd && <CommandPaletteStub onClose={() => setShowCmd(false)} />}
    </header>
  );
};

const Ticker: React.FC<{ symbol: string; price: number; change: number }> = ({ symbol, price, change }) => (
  <div className="flex items-center gap-1.5">
    <span className={`w-1.5 h-1.5 rounded-full ${change >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
    <span className="text-slate-400 text-[11px]">{symbol}</span>
    <span className="text-slate-100 font-medium">
      ${price >= 1000 ? price.toLocaleString('en-US', { maximumFractionDigits: 0 }) : price.toFixed(2)}
    </span>
    <span className={change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
      {change >= 0 ? '+' : ''}{change.toFixed(2)}%
    </span>
  </div>
);

const FearGreedChip: React.FC<{ fg: { value: number; classification: string } | null }> = ({ fg }) => {
  if (!fg) return null;
  const color =
    fg.value < 25 ? 'text-rose-300 border-rose-500/30 bg-rose-500/5' :
    fg.value < 45 ? 'text-amber-300 border-amber-500/30 bg-amber-500/5' :
    fg.value < 55 ? 'text-slate-300 border-white/[0.08] bg-white/[0.03]' :
    fg.value < 75 ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/5' :
                    'text-emerald-200 border-emerald-400/40 bg-emerald-500/10';
  return (
    <div className={`hidden xl:flex items-center gap-2 h-8 px-2.5 border rounded-md text-[11px] ${color}`}>
      <span className="text-[10px] text-slate-500">F&amp;G</span>
      <span className="font-semibold tabular-nums">{fg.value}</span>
      <span className="text-[10px]">{fg.classification}</span>
    </div>
  );
};

const PortfolioPill: React.FC = () => (
  <div className="mx-3 mb-3 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
    <p className="text-[9.5px] uppercase tracking-[0.18em] text-slate-500 font-semibold">Portfolio</p>
    <p className="mt-1 text-[18px] font-semibold tabular-nums text-slate-100">$1,000,000</p>
    <p className="text-[10.5px] text-slate-500 mt-0.5">paper capital · live</p>
  </div>
);

const StatusFooter: React.FC = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return (
    <footer className="border-t border-white/[0.06] bg-[#04060c]">
      <div className="h-9 px-5 md:px-8 max-w-[1600px] mx-auto flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-slate-500">
        <Status dot="emerald" label="API connected" />
        <Status dot="emerald" label="WebSocket live" />
        <span>Latency <span className="text-slate-300 tabular-nums">42ms</span></span>
        <span className="hidden md:inline">Region <span className="text-slate-300">SGP-01</span></span>
        <span className="ml-auto tabular-nums text-slate-600">
          {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} ICT
        </span>
      </div>
    </footer>
  );
};

const Status: React.FC<{ dot: 'emerald' | 'amber' | 'rose'; label: string }> = ({ dot, label }) => (
  <span className="flex items-center gap-1.5">
    <span className={`w-1.5 h-1.5 rounded-full ${dot === 'emerald' ? 'bg-emerald-400' : dot === 'amber' ? 'bg-amber-400' : 'bg-rose-400'}`} />
    {label}
  </span>
);

const CommandPaletteStub: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 grid place-items-start pt-24 bg-black/60 backdrop-blur-sm" onClick={onClose}>
    <div
      onClick={e => e.stopPropagation()}
      className="w-[560px] max-w-[92vw] mx-auto bg-[#0a0f1c] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.3-4.3" /></svg>
        <input
          autoFocus
          placeholder="Type a coin, page, or command…"
          className="bg-transparent flex-1 outline-none text-[14px] text-slate-100 placeholder:text-slate-500"
        />
        <kbd className="text-[10px] font-mono text-slate-500 border border-white/[0.08] rounded px-1.5 py-0.5">Esc</kbd>
      </div>
      <div className="p-2 text-[12.5px] text-slate-400">
        <p className="px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-slate-600">Suggestions</p>
        {['Go to Social Pulse', 'Show my credit score', 'Buy BTC 100 USD', 'Open API docs', 'Switch to VND'].map(s => (
          <div key={s} className="px-3 py-2 rounded-md hover:bg-white/[0.04] cursor-pointer flex items-center justify-between">
            <span>{s}</span>
            <span className="text-[10px] text-slate-600">↵</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Layout;
