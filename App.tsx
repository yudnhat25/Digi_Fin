
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import PortfolioSummary from './components/PortfolioSummary';
import PortfolioHoldings from './components/PortfolioHoldings';
import TradingPanel from './components/TradingPanel';
import AIChatBot from './components/AIChatBot';
import Auth from './components/Auth';
import CompetitionView from './components/CompetitionView';
import CompetitionPaymentModal from './components/CompetitionPaymentModal';
import TransactionHistory from './components/TransactionHistory';
import MarketChart from './components/MarketChart';
import { UserState, MarketData, CompetitionStats } from './types';
import { fetchMarketPrices } from './services/api';
import { CRYPTO_SYMBOLS, INITIAL_STATE, BASELINE_NET_WORTH } from './constants';
import UserAccount from './components/UserAccount';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserState | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [dbError, setDbError] = useState<{ type: 'api' | 'permission' | 'other'; message: string } | null>(null);
  const [marketPrices, setMarketPrices] = useState<MarketData[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'competition' | 'account'>('dashboard');
  const [isCompPaymentOpen, setIsCompPaymentOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState('BTCUSDT');

  // Helper to calculate round based on 6-minute slots (5m play, 1m wait)
  const getGlobalRoundId = () => Math.floor(Date.now() / 360000).toString();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setDbError(null);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setCurrentUser(userDoc.data() as UserState);
          } else {
            const initialState = { ...INITIAL_STATE, name: user.displayName || 'New Investor', accountId: user.email || user.uid };
            setCurrentUser(initialState);
            await setDoc(doc(db, "users", user.uid), initialState);
          }
        } catch (error: any) {
          if (error.code === 'permission-denied') {
            setDbError({ type: 'permission', message: "Firestore Rules are blocking access." });
          }
          const saved = localStorage.getItem('coinwise_local');
          setCurrentUser(saved ? JSON.parse(saved) : { ...INITIAL_STATE, accountId: user.email || 'guest' });
        }
      } else {
        setCurrentUser(null);
      }
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  const syncData = async (updatedUser: UserState) => {
    localStorage.setItem('coinwise_local', JSON.stringify(updatedUser));
    if (auth.currentUser && (!dbError || dbError.type === 'other')) {
      try {
        await setDoc(doc(db, "users", auth.currentUser.uid), updatedUser, { merge: true });

        // Update Public Leaderboard if competing in current round
        if (updatedUser.competition?.isCompeting) {
          const assetValue = updatedUser.assets.reduce((acc, asset) => {
            const price = marketPrices.find(m => m.symbol === asset.symbol)?.price || 0;
            return acc + (asset.amount * price);
          }, 0);
          const currentWorth = updatedUser.balance + assetValue;
          const pnl = ((currentWorth - BASELINE_NET_WORTH) / BASELINE_NET_WORTH) * 100;

          await setDoc(doc(db, "leaderboard", auth.currentUser.uid), {
            name: updatedUser.name,
            accountId: updatedUser.accountId,
            pnl: pnl,
            value: currentWorth,
            roundId: updatedUser.competition.roundId,
            lastUpdate: Date.now()
          }, { merge: true });
        }
      } catch (e) { }
    }
  };

  useEffect(() => {
    const updatePrices = async () => {
      const data = await fetchMarketPrices(CRYPTO_SYMBOLS);
      if (data.length > 0) setMarketPrices(data);
    };
    updatePrices();
    const interval = setInterval(updatePrices, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Auto-update PNL to leaderboard when market prices change during competition
  useEffect(() => {
    // Only sync if user is actively competing
    if (!currentUser?.competition?.isCompeting || marketPrices.length === 0) return;

    // Recalculate current portfolio value
    const assetValue = currentUser.assets.reduce((acc, asset) => {
      const price = marketPrices.find(m => m.symbol === asset.symbol)?.price || 0;
      return acc + (asset.amount * price);
    }, 0);

    const currentWorth = currentUser.balance + assetValue;
    const pnl = ((currentWorth - BASELINE_NET_WORTH) / BASELINE_NET_WORTH) * 100;

    // Update competition stats in user state
    const updatedUser = {
      ...currentUser,
      competition: {
        ...currentUser.competition,
        pnlPercent: pnl
      }
    };

    setCurrentUser(updatedUser);
    syncData(updatedUser);
  }, [marketPrices, currentUser?.competition?.isCompeting]);

  const handleRegisterArena = () => {
    if (!currentUser) return;

    // Check if we are currently in wait phase
    const now = Date.now();
    const cyclePos = now % 360000;
    const isWaitPhase = cyclePos >= 300000;

    // If wait phase, register for the NEXT roundId. Otherwise, register for CURRENT.
    const roundId = isWaitPhase
      ? (Math.floor(now / 360000) + 1).toString()
      : Math.floor(now / 360000).toString();

    const startTime = parseInt(roundId) * 360000;

    const updatedUser: UserState = {
      ...currentUser,
      balance: BASELINE_NET_WORTH,
      assets: [],
      competition: {
        isCompeting: true,
        entryNetWorth: BASELINE_NET_WORTH,
        entryTime: startTime,
        endTime: startTime + 300000,
        roundId: roundId,
        pnlPercent: 0,
        currentRank: 0
      },
      transactions: [
        ...currentUser.transactions,
        {
          id: Math.random().toString(36).substr(2, 9),
          type: 'ENTRY_FEE',
          asset: 'USD',
          amount: 5.00,
          price: 1,
          total: -5.00,
          timestamp: Date.now()
        }
      ]
    };
    setCurrentUser(updatedUser);
    syncData(updatedUser);
    setIsCompPaymentOpen(false);
  };

  const handleResetArena = async () => {
    if (!currentUser) return;
    const updatedUser: UserState = {
      ...currentUser,
      competition: { ...INITIAL_STATE.competition, isCompeting: false }
    };
    setCurrentUser(updatedUser);
    setActiveTab('dashboard');
    if (auth.currentUser) {
      try { await deleteDoc(doc(db, "leaderboard", auth.currentUser.uid)); } catch (e) { }
    }
    syncData(updatedUser);
  };

  const handleClaimPrize = async (prizeAmount: number) => {
    if (!currentUser) return;

    // Prize goes to Stripe only, not added to paper trading balance
    const updatedUser: UserState = {
      ...currentUser,
      competition: { ...INITIAL_STATE.competition, isCompeting: false }
    };

    setCurrentUser(updatedUser);

    // Clean up leaderboard
    if (auth.currentUser) {
      try { await deleteDoc(doc(db, "leaderboard", auth.currentUser.uid)); } catch (e) { }
    }

    syncData(updatedUser);
  };

  const handleTrade = (type: 'BUY' | 'SELL', symbol: string, amount: number, price: number) => {
    if (!currentUser) return;
    const total = amount * price;
    let updatedUser = { ...currentUser };
    if (type === 'BUY') {
      if (updatedUser.balance < total) return alert("Insufficient funds!");
      const idx = updatedUser.assets.findIndex(a => a.symbol === symbol);
      const newAssets = [...updatedUser.assets];
      if (idx >= 0) newAssets[idx].amount += amount;
      else newAssets.push({ symbol, amount });
      updatedUser = { ...updatedUser, balance: updatedUser.balance - total, assets: newAssets };
    } else {
      const idx = updatedUser.assets.findIndex(a => a.symbol === symbol);
      if (idx === -1 || updatedUser.assets[idx].amount < amount) return alert("Insufficient assets!");
      const newAssets = [...updatedUser.assets];
      newAssets[idx].amount -= amount;
      updatedUser = { ...updatedUser, balance: updatedUser.balance + total, assets: newAssets.filter(a => a.amount > 0) };
    }
    updatedUser.transactions.push({ id: Math.random().toString(36).substr(2, 9), type, asset: symbol, amount, price, total: type === 'BUY' ? -total : total, timestamp: Date.now() });
    setCurrentUser(updatedUser);
    syncData(updatedUser);
  };

  const handleDeposit = (amount: number) => {
    if (!currentUser) return;
    const updatedUser: UserState = {
      ...currentUser,
      balance: currentUser.balance + amount,
      transactions: [
        ...currentUser.transactions,
        {
          id: Math.random().toString(36).substr(2, 9),
          type: 'DEPOSIT', // internal type provided by system
          asset: 'USD',
          amount: amount,
          price: 1,
          total: amount,
          timestamp: Date.now()
        }
      ]
    };
    setCurrentUser(updatedUser);
    syncData(updatedUser);
  };

  if (isInitializing) return null;
  if (!currentUser) return <Auth onLogin={setCurrentUser} />;

  return (
    <Layout user={currentUser} onLogout={() => signOut(auth)} activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'competition' ? (
        <>
          <CompetitionView
            user={currentUser} marketPrices={marketPrices}
            onRegister={() => setIsCompPaymentOpen(true)}
            onReset={handleResetArena}
            onClaimPrize={handleClaimPrize}
          />
          {isCompPaymentOpen && <CompetitionPaymentModal onClose={() => setIsCompPaymentOpen(false)} onSuccess={handleRegisterArena} />}
        </>
      ) : activeTab === 'account' ? (
        <UserAccount user={currentUser} marketPrices={marketPrices} onDeposit={handleDeposit} />
      ) : (
        <div className="space-y-6">
          <PortfolioSummary userState={currentUser} marketPrices={marketPrices} />
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            <div className="lg:col-span-7 h-[600px]">
              <MarketChart symbol={selectedAsset} />
            </div>
            <div className="lg:col-span-3">
              <TradingPanel
                marketData={marketPrices} userState={currentUser}
                onTrade={handleTrade} onDeposit={(a) => {
                  // Legacy quick deposit trace, now handled by full flow if needed, but keeping for compatibility
                  const updated = { ...currentUser, balance: currentUser.balance + a };
                  setCurrentUser(updated); syncData(updated);
                }}
                selectedAsset={selectedAsset} onAssetChange={setSelectedAsset}
              />
            </div>
          </div>
          <PortfolioHoldings userState={currentUser} marketPrices={marketPrices} />
          <TransactionHistory transactions={currentUser.transactions} />
        </div>
      )}
      <AIChatBot userState={currentUser} marketData={marketPrices} />
    </Layout>
  );
};

export default App;
