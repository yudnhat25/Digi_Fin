
import React, { useState, useEffect, useMemo } from 'react';
import { UserState, MarketData, LeaderboardEntry } from '../types';
import { ENTRY_FEE, BASELINE_NET_WORTH } from '../constants';
import { computeArenaTick, getCycleAnchor } from '../services/arena';
import { db } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';

interface CompetitionViewProps {
  user: UserState;
  marketPrices: MarketData[];
  onRegister: () => void;
  onReset: () => void;
  onArenaExit?: () => void;
}

type CompTab = 'leaderboard' | 'stats' | 'history' | 'rules';

const CompetitionView: React.FC<CompetitionViewProps> = ({ user, marketPrices, onRegister, onReset, onArenaExit }) => {
  const [activeSubTab, setActiveSubTab] = useState<CompTab>('leaderboard');
  const [arenaAnchor] = useState<number>(() => getCycleAnchor());
  const [arenaTick, setArenaTick] = useState(() => computeArenaTick(getCycleAnchor()));
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'pnl'>('rank');
  const [participants, setParticipants] = useState<LeaderboardEntry[]>([]);
  const [isPayoutProcessing, setIsPayoutProcessing] = useState(false);
  const [phaseFlash, setPhaseFlash] = useState<string | null>(null);

  // Function to calculate a user's current live PNL using the strict $1,000,000 formula
  const getLiveStats = (targetUser: UserState) => {
    const userAssets = Array.isArray(targetUser?.assets) ? targetUser.assets : [];
    const userPrices = Array.isArray(marketPrices) ? marketPrices : [];
    const assetValue = userAssets.reduce((acc, asset) => {
      const price = userPrices.find(m => m.symbol === asset.symbol)?.price || 0;
      return acc + (asset.amount * price);
    }, 0);
    const balance = typeof targetUser?.balance === 'number' ? targetUser.balance : 0;
    const currentWorth = balance + assetValue;
    
    const pnl = (targetUser.competition?.isCompeting)
      ? ((currentWorth - BASELINE_NET_WORTH) / BASELINE_NET_WORTH) * 100 
      : 0;
      
    return { currentWorth, pnl };
  };

  // Subscribe to the shared competition/players node in Firebase Realtime DB.
  // App.saveUserData() writes a LeaderboardEntry there for every competing
  // user, so onValue gives us a live, multi-tab, multi-device leaderboard
  // without any localStorage polling. Falls back gracefully to just the
  // current user if Firebase is offline.
  useEffect(() => {
    const playersRef = ref(db, 'competition/players');
    const unsub = onValue(playersRef, (snapshot) => {
      const raw = snapshot.val();
      const list: LeaderboardEntry[] = raw && typeof raw === 'object'
        ? Object.values(raw).filter((p: any) => p && typeof p.name === 'string') as LeaderboardEntry[]
        : [];
      const liveParticipants = list
        .filter((p) => !p.name.includes('AlgoTrader'))
        .map((p) => ({ ...p, isUser: p.accountId === user.accountId }));
      // If the current user is competing but not yet in the snapshot (race
      // condition right after entry), inject their own stats so they see
      // themselves immediately.
      if (user.competition?.isCompeting && !liveParticipants.find((p) => p.accountId === user.accountId)) {
        const stats = getLiveStats(user);
        liveParticipants.push({
          rank: 0,
          name: user.name,
          accountId: user.accountId,
          pnl: stats.pnl,
          value: stats.currentWorth,
          isUser: true,
        });
      }
      const sorted = [...liveParticipants].sort((a, b) => b.pnl - a.pnl);
      const ranked = sorted.map((p, i) => ({ ...p, rank: i + 1 }));
      setParticipants(ranked);
    });
    return () => unsub();
  }, [user.accountId, user.competition?.isCompeting, user.balance, user.assets, marketPrices]);

  // Perpetual arena clock: ticks every second, flashes a banner on phase change
  // (round-end → break, break-end → new round). Anchor lives in localStorage so
  // all clients stay synced across reloads.
  useEffect(() => {
    let lastPhase = arenaTick.phase;
    let lastRound = arenaTick.roundIndex;
    const timer = setInterval(() => {
      const next = computeArenaTick(arenaAnchor);
      setArenaTick(next);
      if (next.phase !== lastPhase) {
        if (next.phase === 'break') {
          setPhaseFlash(`Round ${lastRound} ended — break for 30s`);
        } else {
          setPhaseFlash(`Round ${next.roundIndex} starts — 3 minutes`);
        }
        lastPhase = next.phase;
        lastRound = next.roundIndex;
        setTimeout(() => setPhaseFlash(null), 3500);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [arenaAnchor]);

  const isBreak = arenaTick.phase === 'break';

  // Auto-exit: when the user's joined round closes, ask the parent to restore
  // their pre-arena snapshot. Fires exactly once thanks to the roundEndsAt
  // dependency — once it's cleared by the parent, the effect re-runs but the
  // guard prevents a second exit.
  // Legacy cleanup: a session that has isCompeting=true but no roundEndsAt
  // dates back to the old "60-second test race" flow. There is no snapshot to
  // restore, so we just flip the flag and let the user see the new Start flow.
  useEffect(() => {
    if (!user.competition?.isCompeting) return;
    const endsAt = user.competition?.roundEndsAt;
    if (!endsAt || !Number.isFinite(endsAt)) {
      onArenaExit?.();
      return;
    }
    const tick = () => {
      if (Date.now() >= endsAt) {
        onArenaExit?.();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [user.competition?.isCompeting, user.competition?.roundEndsAt, onArenaExit]);

  const { pnl: userPnl } = getLiveStats(user);
  const currentUserEntry = participants.find(p => p.isUser);
  const userRank = currentUserEntry?.rank || 0;
  // Winner banner shows during break if the user is leading at the round close.
  const isWinner = userRank === 1 && isBreak && participants.length > 0;

  const totalParticipants = participants.length;
  const prizePool = totalParticipants * ENTRY_FEE;

  const filteredParticipants = useMemo(() => {
    return participants
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => sortBy === 'rank' ? a.rank - b.rank : b.pnl - a.pnl);
  }, [participants, searchQuery, sortBy]);

  const estPrize = useMemo(() => {
    if (!userRank) return 0;
    if (isBreak) {
        return userRank === 1 ? prizePool : 0;
    }
    if (userRank <= totalParticipants * 0.10) return prizePool * 0.40 / (totalParticipants * 0.10 || 1);
    return 0;
  }, [userRank, prizePool, totalParticipants, isBreak]);

  const handleClaimReward = () => {
    setShowPayoutModal(true);
  };

  const handleConfirmPayout = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPayoutProcessing(true);
    setTimeout(() => {
        setIsPayoutProcessing(false);
        alert("Reward successfully sent to your bank account via Stripe Payouts!");
        setShowPayoutModal(false);
        // Reset everything and restart global competition
        onReset();
    }, 3000);
  };

  if (!user.competition?.isCompeting) {
    const phaseLabel = isBreak ? `Break · next round in ${arenaTick.display}` : `Round ${arenaTick.roundIndex} live · ${arenaTick.display} left`;
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 animate-in zoom-in duration-500">
        <div className={`px-5 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${isBreak ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'}`}>
          {phaseLabel}
        </div>
        <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>
        </div>
        <div className="max-w-xl">
          <h2 className="text-4xl font-black mb-4">The Best Investor Arena</h2>
          <p className="text-slate-400 text-lg mb-4">
            Continuous arena: <span className="text-emerald-400 font-bold">3-minute rounds</span> with <span className="text-amber-400 font-bold">30-second breaks</span>, looping forever.
          </p>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Pay <span className="text-emerald-400 font-bold">${ENTRY_FEE.toFixed(2)}</span> to join the live round. Your real portfolio is snapshot and you get a fresh <span className="text-emerald-400 font-bold">$1,000,000</span> baseline. When the round ends, your original cash, holdings, and transaction history are fully restored — only the entry fee is kept.
          </p>
          <button
            onClick={onRegister}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-12 py-5 rounded-2xl font-black text-xl shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all"
          >
            {isBreak ? `Bắt đầu vào round tiếp theo — $${ENTRY_FEE.toFixed(2)}` : `Bắt đầu — $${ENTRY_FEE.toFixed(2)}`}
          </button>
          <p className="text-[11px] text-slate-600 mt-4">
            Entry fee is non-refundable. Anyone can join at any time during a cycle.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {phaseFlash && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[80] bg-slate-900 border border-emerald-500/40 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-emerald-300 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          {phaseFlash}
        </div>
      )}
      {/* Winner Congratulation Pop-up */}
      {isWinner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-500">
           <div className="bg-slate-900 border-2 border-emerald-500 rounded-[32px] p-10 max-w-lg w-full text-center shadow-[0_0_50px_rgba(16,185,129,0.3)] animate-in zoom-in slide-in-from-bottom-10 duration-700">
              <div className="w-24 h-24 bg-emerald-500 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                <svg className="w-12 h-12 text-slate-950" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
              </div>
              <h2 className="text-4xl font-black text-white mb-2">Congratulations, {user.name}!</h2>
              <p className="text-slate-400 text-lg mb-8 italic">You dominated the Best Investor Arena and finished in Rank #1.</p>
              
              <div className="bg-slate-800/50 rounded-2xl p-6 mb-8 border border-slate-700">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Your Final Reward</p>
                 <p className="text-5xl font-black text-emerald-400 tracking-tight">${prizePool.toLocaleString()}</p>
              </div>

              <button 
                onClick={handleClaimReward}
                className="w-full bg-[#635BFF] hover:bg-[#5851e0] text-white font-black py-5 rounded-2xl text-xl transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-[#635BFF]/20"
              >
                Claim Reward via Stripe
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
              </button>
           </div>
        </div>
      )}

      {/* Stripe Payout Interface */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-white animate-in slide-in-from-right duration-500">
           <div className="max-w-2xl w-full text-slate-900">
              <div className="flex items-center justify-between mb-12">
                 <div className="flex items-center gap-2">
                    <svg className="w-10 h-10 text-[#635BFF]" viewBox="0 0 40 40" fill="currentColor"><path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm0 36.364C10.963 36.364 3.636 29.037 3.636 20S10.963 3.636 20 3.636 36.364 10.963 36.364 20s-7.327 16.364-16.364 16.364z"/></svg>
                    <span className="text-3xl font-bold tracking-tight text-[#635BFF]">Stripe <span className="text-slate-400 font-medium">Payouts</span></span>
                 </div>
                 <button onClick={() => setShowPayoutModal(false)} className="text-slate-400 hover:text-slate-600">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                 <div className="md:col-span-2">
                    <h1 className="text-4xl font-bold mb-4">Set up your payouts</h1>
                    <p className="text-slate-500 text-lg">Enter your details to receive your <span className="font-bold text-slate-900">${prizePool.toLocaleString()}</span> reward from CoinWise AI.</p>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Transfer Amount</p>
                    <p className="text-3xl font-bold text-[#635BFF]">${prizePool.toLocaleString()}.00</p>
                 </div>
              </div>

              <form onSubmit={handleConfirmPayout} className="space-y-8">
                 <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Legal Name</label>
                        <input required type="text" defaultValue={user.name} className="w-full border-slate-200 border-2 rounded-xl px-4 py-4 text-lg focus:border-[#635BFF] focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Routing Number</label>
                            <input required type="text" placeholder="110000000" maxLength={9} className="w-full border-slate-200 border-2 rounded-xl px-4 py-4 text-lg focus:border-[#635BFF] focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Account Number</label>
                            <input required type="text" placeholder="000123456789" className="w-full border-slate-200 border-2 rounded-xl px-4 py-4 text-lg focus:border-[#635BFF] focus:outline-none" />
                        </div>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-2xl flex gap-4 border border-blue-100">
                        <svg className="w-6 h-6 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <p className="text-sm text-blue-800 leading-relaxed">By clicking confirm, you authorize Stripe to send a direct deposit to the bank account listed above. Funds usually arrive in 1-2 business days.</p>
                    </div>
                 </div>

                 <button 
                   disabled={isPayoutProcessing}
                   className="w-full bg-[#635BFF] hover:bg-[#5851e0] text-white font-bold py-5 rounded-2xl text-xl flex items-center justify-center gap-4 transition-all disabled:opacity-50"
                 >
                   {isPayoutProcessing ? (
                     <>
                        <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Processing Transfer...
                     </>
                   ) : "Confirm and Payout Reward"}
                 </button>
              </form>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 p-5 rounded-2xl relative overflow-hidden group">
          <div className={`absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ${isBreak ? 'bg-amber-500/5' : 'bg-emerald-500/5'}`}></div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 relative z-10">
            {isBreak ? `Break · next round in` : `Round ${arenaTick.roundIndex} · time left`}
          </p>
          <p className={`text-2xl font-black font-mono relative z-10 ${isBreak ? 'text-amber-400' : 'text-white'}`}>
            {arenaTick.display}
          </p>
        </div>
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 p-5 rounded-2xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Arena PNL %</p>
          <p className={`text-2xl font-black ${userPnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
            {userPnl >= 0 ? '+' : ''}{userPnl.toFixed(2)}%
          </p>
        </div>
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 p-5 rounded-2xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Global Rank</p>
          <p className="text-2xl font-black text-white">#{userRank} <span className="text-xs text-slate-500 font-normal">/ {totalParticipants}</span></p>
        </div>
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 p-5 rounded-2xl border-emerald-500/30">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Total Prize Pool</p>
          <p className="text-2xl font-black text-emerald-400">${prizePool.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl min-h-[600px] flex flex-col">
        <div className="flex border-b border-slate-800 px-6 justify-between items-center bg-slate-900/80 backdrop-blur">
          <div className="flex">
            {(['leaderboard', 'stats', 'history', 'rules'] as CompTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`py-5 px-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                  activeSubTab === tab ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase px-4">
             Arena Baseline: <span className="text-slate-300">${BASELINE_NET_WORTH.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {activeSubTab === 'leaderboard' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <input 
                    type="text" 
                    placeholder="Search Real Competitors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={() => setSortBy('rank')} className={`flex-1 md:flex-none px-4 py-2 text-[10px] font-bold rounded-lg border ${sortBy === 'rank' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'border-slate-700 text-slate-500'}`}>RANK</button>
                  <button onClick={() => setSortBy('pnl')} className={`flex-1 md:flex-none px-4 py-2 text-[10px] font-bold rounded-lg border ${sortBy === 'pnl' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'border-slate-700 text-slate-500'}`}>PNL%</button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-slate-500 uppercase font-black border-b border-slate-800/50">
                      <th className="px-4 py-4">Rank</th>
                      <th className="px-4 py-4">Investor</th>
                      <th className="px-4 py-4 text-right">Arena PNL %</th>
                      <th className="px-4 py-4 text-right">Net Worth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    {filteredParticipants.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-4 py-10 text-center text-slate-500 italic">No real competitors in Room 1 yet.</td>
                        </tr>
                    ) : (
                        filteredParticipants.map((p) => (
                          <tr key={p.accountId || p.name} className={`group transition-colors ${p.isUser ? 'bg-emerald-500/10 border-l-4 border-l-emerald-500' : 'hover:bg-slate-800/20'}`}>
                            <td className="px-4 py-4">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                                p.rank === 1 ? 'bg-amber-400/20 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.2)]' :
                                p.rank === 2 ? 'bg-slate-300/20 text-slate-300' :
                                p.rank === 3 ? 'bg-orange-400/20 text-orange-400' : 'bg-slate-800 text-slate-500'
                              }`}>
                                {p.rank}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${p.isUser ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                                  {p.isUser ? 'YOU' : p.name.substring(0, 2)}
                                </div>
                                <div>
                                   <p className={`font-bold text-sm ${p.isUser ? 'text-emerald-400' : 'text-slate-200'}`}>
                                     {p.name} {p.isUser && '(You)'}
                                   </p>
                                   <span className="text-[10px] text-emerald-500/50 uppercase font-bold tracking-tighter">Real Competitor</span>
                                </div>
                              </div>
                            </td>
                            <td className={`px-4 py-4 text-right font-black ${p.pnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                              {p.pnl >= 0 ? '+' : ''}{p.pnl.toFixed(2)}%
                            </td>
                            <td className="px-4 py-4 text-right font-mono text-xs text-slate-500">${p.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'rules' && (
            <div className="max-w-3xl space-y-6 text-sm text-slate-400 animate-in fade-in duration-300">
              <div className="space-y-4">
                 <h5 className="text-white font-black uppercase tracking-widest text-xs">1. CYCLE RULES</h5>
                 <p>The arena runs in perpetual cycles. Each cycle has an <span className="text-emerald-400 font-bold">active round of 3 minutes</span> followed by a <span className="text-amber-400 font-bold">30-second break</span>, then a new round starts automatically. Your PNL is cumulative across rounds.</p>
              </div>
              <div className="space-y-4">
                 <h5 className="text-white font-black uppercase tracking-widest text-xs">2. REAL USERS ONLY</h5>
                 <p>All AlgoTrader (AI) accounts have been excluded. You are only competing against other real participants registered on the platform. Eligibility for rewards is strictly reserved for the top performing real user at the moment a round closes.</p>
              </div>
              <div className="space-y-4">
                 <h5 className="text-white font-black uppercase tracking-widest text-xs">3. SYNCHRONISED CLOCK</h5>
                 <p>The cycle anchor is shared via the browser, so every viewer on the same device sees the same round number and timer countdown. Reloads do not reset the cycle.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompetitionView;
