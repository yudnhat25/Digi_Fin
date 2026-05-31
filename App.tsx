import React, { useState, useEffect } from 'react';
import Layout, { TabKey } from './components/Layout';
import PortfolioSummary from './components/PortfolioSummary';
import TradingPanel from './components/TradingPanel';
import AIChatBot from './components/AIChatBot';
import LandingPage from './components/LandingPage';
import CompetitionView from './components/CompetitionView';
import CompetitionPaymentModal from './components/CompetitionPaymentModal';
import TransactionHistory from './components/TransactionHistory';
import MarketsPage from './components/MarketsPage';
import ProPlansPage from './components/ProPlansPage';
import AcademyPage from './components/AcademyPage';
import EarnPage from './components/EarnPage';
import ReferralPage from './components/ReferralPage';
import { TopMoversWidget, WatchlistWidget, NewsWidget, PortfolioBreakdownWidget } from './components/DashboardWidgets';
import SocialPulsePage from './components/SocialPulsePage';
import AltDataPipelinePage from './components/AltDataPipelinePage';
import CreditScorePage from './components/CreditScorePage';
import AIAdvisorPage from './components/AIAdvisorPage';
import FraudShieldPage from './components/FraudShieldPage';
import ApiDocsPage from './components/ApiDocsPage';
import AIInsightCard from './components/AIInsightCard';
import LiveCandlestickChart from './components/LiveCandlestickChart';
import { UserState, MarketData, LeaderboardEntry, SubscriptionTier, StakePosition } from './types';
import { fetchMarketPrices } from './services/api';
import { CRYPTO_SYMBOLS, ENTRY_FEE, BASELINE_NET_WORTH, EARN_PRODUCTS } from './constants';
import { computeRoundEndsAt } from './services/arena';

import { auth, db } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, set, get, update } from 'firebase/database';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserState | null>(null);
  const [marketPrices, setMarketPrices] = useState<MarketData[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [isCompPaymentOpen, setIsCompPaymentOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState('15m');
  const [showIndicators, setShowIndicators] = useState({ ema: true, rsi: true });
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const saveUserData = (updatedUser: UserState) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('coinwise_session', JSON.stringify(updatedUser));

    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      set(ref(db, `users/${uid}`), updatedUser);

      if (updatedUser.competition?.isCompeting) {
        const safeAssets = Array.isArray(updatedUser.assets) ? updatedUser.assets : [];
        const safePrices = Array.isArray(marketPrices) ? marketPrices : [];
        const currentAssetValue = safeAssets.reduce((acc, curr) => {
          const price = safePrices.find(m => m.symbol === curr.symbol)?.price || 0;
          return acc + (curr.amount * price);
        }, 0);

        const totalNetWorth = updatedUser.balance + currentAssetValue;
        const pnl = ((totalNetWorth - updatedUser.competition.entryNetWorth) / updatedUser.competition.entryNetWorth) * 100;

        const playerEntry: LeaderboardEntry = {
          rank: 0,
          name: updatedUser.name,
          accountId: updatedUser.accountId,
          pnl: parseFloat(pnl.toFixed(2)),
          value: totalNetWorth,
          isUser: true
        };
        update(ref(db, `competition/players/${updatedUser.accountId.replace('.', '_')}`), playerEntry);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const rawData = snapshot.val();
          const data: any = rawData && typeof rawData === 'object' ? { ...rawData } : {};
          // Firebase Realtime DB serializes empty arrays as undefined and sparse arrays as
          // objects keyed by index — coerce every array-shaped field defensively.
          const toArray = (v: any) => Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.values(v) : []);
          data.assets = toArray(data.assets);
          data.transactions = toArray(data.transactions);
          data.watchlist = toArray(data.watchlist);
          if (data.watchlist.length === 0) {
            data.watchlist = [
              { symbol: 'BTCUSDT', addedAt: Date.now() },
              { symbol: 'ETHUSDT', addedAt: Date.now() },
              { symbol: 'SOLUSDT', addedAt: Date.now() },
            ];
          }
          data.stakes = toArray(data.stakes);
          data.enrollments = toArray(data.enrollments);
          if (!data.tier) data.tier = 'STARTER';
          if (!data.competition || typeof data.competition !== 'object') {
            data.competition = { isCompeting: false, entryNetWorth: 0, entryTime: 0, pnlPercent: 0, currentRank: 0 };
          }
          if (data.referralEarnings === undefined) data.referralEarnings = 0;
          if (data.referralCount === undefined) data.referralCount = 0;
          if (typeof data.balance !== 'number') data.balance = 1000000;
          setCurrentUser(data);
        }
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const updatePrices = async () => {
      const data = await fetchMarketPrices(CRYPTO_SYMBOLS);
      if (data.length > 0) setMarketPrices(data);
    };
    updatePrices();
    const interval = setInterval(updatePrices, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (user: UserState) => {
    if (!user.tier) user.tier = 'STARTER';
    setCurrentUser(user);
    localStorage.setItem('coinwise_session', JSON.stringify(user));
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    localStorage.removeItem('coinwise_session');
  };

  const handleRegisterClick = () => setIsCompPaymentOpen(true);

  const handleCompleteCompetitionPayment = () => {
    if (!currentUser) return;
    // Charge the entry fee from real cash, snapshot the rest, then reset to
    // arena baseline. Cap fee at available cash so the snapshot's balance
    // can never go negative.
    const realAssets = Array.isArray(currentUser.assets) ? currentUser.assets : [];
    const realTxs = Array.isArray(currentUser.transactions) ? currentUser.transactions : [];
    const realBalance = Number.isFinite(currentUser.balance) ? currentUser.balance : 0;
    const fee = Math.min(ENTRY_FEE, Math.max(0, realBalance));
    const snapshotBalance = realBalance - fee;
    const roundEndsAt = computeRoundEndsAt();
    const updatedUser: UserState = {
      ...currentUser,
      balance: BASELINE_NET_WORTH,
      assets: [],
      transactions: [],
      competition: {
        isCompeting: true,
        entryNetWorth: BASELINE_NET_WORTH,
        entryTime: Date.now(),
        pnlPercent: 0,
        currentRank: 0,
        roundEndsAt,
        preArenaSnapshot: {
          balance: snapshotBalance,
          assets: realAssets,
          transactions: realTxs,
        },
      },
    };
    saveUserData(updatedUser);
    setIsCompPaymentOpen(false);
    showToast('Arena entry confirmed! Race begins now.');
  };

  const handleArenaExit = () => {
    if (!currentUser) return;
    const snap = currentUser.competition?.preArenaSnapshot;
    // Restore the pre-arena portfolio if we have one; otherwise just flip the
    // flag off (defensive — old sessions without a snapshot still exit cleanly).
    const finalNet = (() => {
      const assets = Array.isArray(currentUser.assets) ? currentUser.assets : [];
      const arenaAssetsValue = assets.reduce((s, a) => {
        const price = marketPrices.find(m => m.symbol === a.symbol)?.price || 0;
        return s + (a.amount || 0) * price;
      }, 0);
      return (currentUser.balance || 0) + arenaAssetsValue;
    })();
    const arenaPnlPct = ((finalNet - BASELINE_NET_WORTH) / BASELINE_NET_WORTH) * 100;
    const restored: UserState = snap
      ? {
          ...currentUser,
          balance: snap.balance,
          assets: snap.assets,
          transactions: snap.transactions,
          competition: { isCompeting: false, entryNetWorth: 0, entryTime: 0, pnlPercent: 0, currentRank: 0 },
        }
      : {
          ...currentUser,
          competition: { isCompeting: false, entryNetWorth: 0, entryTime: 0, pnlPercent: 0, currentRank: 0 },
        };
    if (auth.currentUser) {
      set(ref(db, `competition/players/${currentUser.accountId.replace('.', '_')}`), null);
    }
    saveUserData(restored);
    showToast(`Arena round ended. Your portfolio is restored. Round PNL: ${arenaPnlPct >= 0 ? '+' : ''}${arenaPnlPct.toFixed(2)}%`, arenaPnlPct >= 0 ? 'success' : 'info');
  };

  const handleResetCompetition = () => {
    // Legacy "claim reward then reset" path. Now just defers to handleArenaExit
    // so the snapshot restore logic runs uniformly.
    handleArenaExit();
    setActiveTab('dashboard');
  };

  const handleTrade = (type: 'BUY' | 'SELL', symbol: string, amount: number, price: number) => {
    if (!currentUser) {
      showToast('Session not loaded yet. Try again in a moment.', 'error');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast('Invalid amount.', 'error');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      showToast('Invalid price.', 'error');
      return;
    }
    const total = amount * price;
    // Defensive — Firebase RTDB can serialize arrays as numeric-keyed objects.
    const currentAssets = Array.isArray(currentUser.assets)
      ? currentUser.assets
      : (currentUser.assets && typeof currentUser.assets === 'object' ? Object.values(currentUser.assets) as typeof currentUser.assets : []);
    const currentTxs = Array.isArray(currentUser.transactions)
      ? currentUser.transactions
      : (currentUser.transactions && typeof currentUser.transactions === 'object' ? Object.values(currentUser.transactions) as typeof currentUser.transactions : []);
    let updatedUser: UserState = { ...currentUser, assets: currentAssets, transactions: currentTxs };

    if (type === 'BUY') {
      if (updatedUser.balance < total) {
        showToast('Insufficient funds. Deposit more simulation capital.', 'error');
        return;
      }
      const existingAssetIndex = updatedUser.assets.findIndex(a => a.symbol === symbol);
      const newAssets = [...updatedUser.assets];
      if (existingAssetIndex >= 0) newAssets[existingAssetIndex] = { ...newAssets[existingAssetIndex], amount: newAssets[existingAssetIndex].amount + amount };
      else newAssets.push({ symbol, amount });
      updatedUser = {
        ...updatedUser,
        balance: updatedUser.balance - total,
        assets: newAssets,
        transactions: [...updatedUser.transactions, { id: Math.random().toString(36).substr(2, 9), type: 'BUY', asset: symbol, amount, price, total: -total, timestamp: Date.now() }]
      };
      showToast(`Bought ${amount.toFixed(4)} ${symbol.replace('USDT', '')}`);
    } else {
      const existingAssetIndex = updatedUser.assets.findIndex(a => a.symbol === symbol);
      if (existingAssetIndex === -1 || updatedUser.assets[existingAssetIndex].amount < amount) {
        showToast(`Insufficient ${symbol.replace('USDT', '')} balance.`, 'error');
        return;
      }
      const newAssets = [...updatedUser.assets];
      newAssets[existingAssetIndex] = { ...newAssets[existingAssetIndex], amount: newAssets[existingAssetIndex].amount - amount };
      const finalAssets = newAssets.filter(a => a.amount > 0);
      updatedUser = {
        ...updatedUser,
        balance: updatedUser.balance + total,
        assets: finalAssets,
        transactions: [...updatedUser.transactions, { id: Math.random().toString(36).substr(2, 9), type: 'SELL', asset: symbol, amount, price, total, timestamp: Date.now() }]
      };
      showToast(`Sold ${amount.toFixed(4)} ${symbol.replace('USDT', '')}`);
    }
    saveUserData(updatedUser);
  };

  const handleDeposit = (amount: number) => {
    if (!currentUser) return;
    const updatedUser: UserState = {
      ...currentUser,
      balance: currentUser.balance + amount,
      transactions: [...currentUser.transactions, { id: Math.random().toString(36).substr(2, 9), type: 'DEPOSIT', asset: 'USD', amount, price: 1, total: amount, timestamp: Date.now() }]
    };
    saveUserData(updatedUser);
    showToast(`Deposited $${amount.toLocaleString()}`);
  };

  const handleUpgrade = (tier: SubscriptionTier) => {
    if (!currentUser) return;
    const updatedUser: UserState = {
      ...currentUser,
      tier,
      tierExpiresAt: tier === 'STARTER' ? undefined : Date.now() + 30 * 86400000
    };
    saveUserData(updatedUser);
    showToast(tier === 'STARTER' ? 'Subscription cancelled. You\'re now on Starter.' : `Welcome to ${tier === 'PRO' ? 'Pro' : 'Elite'}! Features unlocked.`);
    setActiveTab('dashboard');
  };

  const handleToggleWatchlist = (symbol: string) => {
    if (!currentUser) return;
    const list = currentUser.watchlist || [];
    const exists = list.find(w => w.symbol === symbol);
    const updatedUser: UserState = {
      ...currentUser,
      watchlist: exists ? list.filter(w => w.symbol !== symbol) : [...list, { symbol, addedAt: Date.now() }]
    };
    saveUserData(updatedUser);
  };

  const handleEnrollCourse = (courseId: string, finalPrice: number) => {
    if (!currentUser) return;
    if (finalPrice > 0 && currentUser.balance < finalPrice) {
      showToast('Insufficient balance for course purchase.', 'error');
      return;
    }
    const existing = (currentUser.enrollments || []).find(e => e.courseId === courseId);
    if (existing) return;
    const updatedUser: UserState = {
      ...currentUser,
      balance: currentUser.balance - finalPrice,
      enrollments: [...(currentUser.enrollments || []), { courseId, enrolledAt: Date.now(), progress: 0 }],
      transactions: finalPrice > 0 ? [...currentUser.transactions, { id: Math.random().toString(36).substr(2, 9), type: 'DEPOSIT', asset: `COURSE-${courseId.toUpperCase()}`, amount: 1, price: finalPrice, total: -finalPrice, timestamp: Date.now() }] : currentUser.transactions
    };
    saveUserData(updatedUser);
    showToast(finalPrice > 0 ? `Enrolled! $${finalPrice} charged.` : 'Enrolled successfully!');
  };

  const handleStake = (productId: string, amount: number) => {
    if (!currentUser) return;
    if (amount > currentUser.balance) {
      showToast('Insufficient balance to stake.', 'error');
      return;
    }
    const product = EARN_PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    const newStake: StakePosition = {
      id: Math.random().toString(36).substr(2, 9),
      symbol: product.symbol,
      amount,
      apy: product.apy,
      startTime: Date.now(),
      lockDays: product.lockDays,
      product: product.name
    };
    const updatedUser: UserState = {
      ...currentUser,
      balance: currentUser.balance - amount,
      stakes: [...(currentUser.stakes || []), newStake],
      transactions: [...currentUser.transactions, { id: Math.random().toString(36).substr(2, 9), type: 'DEPOSIT', asset: `STAKE-${product.symbol}`, amount: 1, price: amount, total: -amount, timestamp: Date.now() }]
    };
    saveUserData(updatedUser);
    showToast(`Staked $${amount.toLocaleString()} at ${(product.apy * 100).toFixed(2)}% APY.`);
  };

  const handleUnstake = (stakeId: string) => {
    if (!currentUser) return;
    const stake = (currentUser.stakes || []).find(s => s.id === stakeId);
    if (!stake) return;
    const daysActive = Math.floor((Date.now() - stake.startTime) / 86400000);
    const earnings = stake.amount * stake.apy * daysActive / 365;
    const totalReturn = stake.amount + earnings;
    const updatedUser: UserState = {
      ...currentUser,
      balance: currentUser.balance + totalReturn,
      stakes: (currentUser.stakes || []).filter(s => s.id !== stakeId),
      transactions: [...currentUser.transactions, { id: Math.random().toString(36).substr(2, 9), type: 'DEPOSIT', asset: `UNSTAKE-${stake.symbol}`, amount: 1, price: totalReturn, total: totalReturn, timestamp: Date.now() }]
    };
    saveUserData(updatedUser);
    showToast(`Unstaked. Received $${totalReturn.toFixed(2)} (+$${earnings.toFixed(2)} earned).`);
  };

  const currentPrice = marketPrices.find(m => m.symbol === selectedAsset)?.price || 0;

  if (!currentUser) return <LandingPage onLogin={handleLogin} />;

  const renderContent = () => {
    if (activeTab === 'competition') {
      return <CompetitionView user={currentUser} marketPrices={marketPrices} onRegister={handleRegisterClick} onReset={handleResetCompetition} onArenaExit={handleArenaExit} />;
    }
    if (activeTab === 'markets') {
      return <MarketsPage marketData={marketPrices} user={currentUser} onSelectAsset={setSelectedAsset} onGoToTerminal={() => setActiveTab('dashboard')} onToggleWatchlist={handleToggleWatchlist} />;
    }
    if (activeTab === 'pro') {
      return <ProPlansPage user={currentUser} onUpgrade={handleUpgrade} />;
    }
    if (activeTab === 'academy') {
      return <AcademyPage user={currentUser} onEnroll={handleEnrollCourse} onUpgradeClick={() => setActiveTab('pro')} />;
    }
    if (activeTab === 'earn') {
      return <EarnPage user={currentUser} onStake={handleStake} onUnstake={handleUnstake} onUpgradeClick={() => setActiveTab('pro')} />;
    }
    if (activeTab === 'referral') {
      return <ReferralPage user={currentUser} />;
    }
    if (activeTab === 'pulse') {
      return <SocialPulsePage onSelectAsset={setSelectedAsset} />;
    }
    if (activeTab === 'pipeline') {
      return <AltDataPipelinePage />;
    }
    if (activeTab === 'credit') {
      return <CreditScorePage user={currentUser} onUpgradeClick={() => setActiveTab('pro')} />;
    }
    if (activeTab === 'advisor') {
      return <AIAdvisorPage user={currentUser} />;
    }
    if (activeTab === 'shield') {
      return <FraudShieldPage user={currentUser} />;
    }
    if (activeTab === 'apidocs') {
      return <ApiDocsPage />;
    }
    if (activeTab === 'history') {
      return (
        <div className="animate-in fade-in duration-500">
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2">Transaction History</h1>
          <p className="text-slate-400 text-sm mb-6">All your trades, deposits, stakes, and Arena entries.</p>
          <TransactionHistory transactions={currentUser.transactions} />
        </div>
      );
    }

    // Default: Dashboard (Terminal)
    return (
      <div className="animate-in fade-in duration-500 space-y-6">
        {/* Welcome row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter">Welcome back, {currentUser.name.split(' ')[0]} 👋</h1>
            <p className="text-slate-400 text-sm">Here's how your portfolio is doing right now.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('markets')} className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition">
              Browse Markets
            </button>
            {currentUser.tier !== 'ELITE' && (
              <button onClick={() => setActiveTab('pro')} className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition">
                {currentUser.tier === 'PRO' ? 'Go Elite' : 'Upgrade to Pro'}
              </button>
            )}
          </div>
        </div>

        <PortfolioSummary userState={currentUser} marketPrices={marketPrices} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col min-h-[600px]">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Trading Pair</span>
                    <span className="text-xl font-black text-white">{selectedAsset.replace('USDT', '')}/USDT</span>
                  </div>
                  <div className="h-10 w-px bg-slate-800 hidden md:block" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Price</span>
                    <span className={`text-xl font-black ${currentPrice > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                      ${currentPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl">
                  {['1m', '15m', '1h', '4h', '1D'].map(tf => (
                    <button key={tf} onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${timeframe === tf ? 'bg-slate-800 text-emerald-400 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                      {tf}
                    </button>
                  ))}
                  <div className="w-px h-4 bg-slate-800 mx-1" />
                  <button onClick={() => setShowIndicators(s => ({ ...s, ema: !s.ema }))}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${showIndicators.ema ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500'}`}>EMA</button>
                  <button onClick={() => setShowIndicators(s => ({ ...s, rsi: !s.rsi }))}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${showIndicators.rsi ? 'bg-purple-500/20 text-purple-400' : 'text-slate-500'}`}>RSI</button>
                </div>
              </div>

              <div className="flex-1 bg-slate-950/50 rounded-2xl relative border border-slate-800/50 overflow-hidden">
                <LiveCandlestickChart symbol={selectedAsset} timeframe={timeframe} showEMA={showIndicators.ema} />
              </div>
            </div>

            {/* Allocation + News under chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PortfolioBreakdownWidget marketData={marketPrices} user={currentUser} onSelectAsset={setSelectedAsset} />
              <NewsWidget />
            </div>
          </div>

          {/* Right rail */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <AIInsightCard symbol={selectedAsset} />
            <TradingPanel
              marketData={marketPrices}
              userState={currentUser}
              onTrade={handleTrade}
              onDeposit={handleDeposit}
              selectedAsset={selectedAsset}
              onAssetChange={setSelectedAsset}
              showToast={showToast}
            />
            <div className="grid grid-cols-1 gap-6">
              <TopMoversWidget marketData={marketPrices} user={currentUser} onSelectAsset={setSelectedAsset} />
              <WatchlistWidget marketData={marketPrices} user={currentUser} onSelectAsset={setSelectedAsset} />
            </div>
          </div>
        </div>

        {/* Transaction history full-width */}
        <TransactionHistory transactions={currentUser.transactions} />
      </div>
    );
  };

  return (
    <Layout user={currentUser} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
      <AIChatBot
        userState={currentUser}
        marketData={marketPrices}
        onTradeExecuted={({ symbol, side, amountUsd, price }) => {
          handleTrade(side, symbol, amountUsd / price, price);
        }}
      />
      {isCompPaymentOpen && (
        <CompetitionPaymentModal onClose={() => setIsCompPaymentOpen(false)} onSuccess={handleCompleteCompetitionPayment} />
      )}
      {toast && (
        <div className={`fixed bottom-24 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300 ${
          toast.type === 'error' ? 'bg-rose-500 text-white' :
          toast.type === 'info' ? 'bg-blue-500 text-white' :
          'bg-emerald-500 text-slate-950'
        } px-5 py-4 rounded-2xl shadow-2xl font-black text-sm`}>
          {toast.msg}
        </div>
      )}
    </Layout>
  );
};

export default App;
