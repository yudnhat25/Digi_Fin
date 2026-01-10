
import React, { useState, useEffect, useMemo } from 'react';
import { UserState, MarketData, LeaderboardEntry } from '../types';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from "firebase/firestore";
import CompetitionPayoutModal from './CompetitionPayoutModal';

interface CompetitionViewProps {
  user: UserState;
  marketPrices: MarketData[];
  onRegister: () => void;
  onReset: () => void;
}

const CompetitionView: React.FC<CompetitionViewProps> = ({ user, marketPrices, onRegister, onReset }) => {
  const [participants, setParticipants] = useState<LeaderboardEntry[]>([]);
  const [timeLeftStr, setTimeLeftStr] = useState('SYNCING: 0s');
  const [isRaceActive, setIsRaceActive] = useState(false);
  const [isWaitPhase, setIsWaitPhase] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Helper to extract numeric seconds from the string safely
  const getSeconds = () => {
    const parts = timeLeftStr.split(': ');
    return parts.length > 1 ? parts[1] : '0s';
  };

  // Global Round Calculation (6-minute cycle: 5m play, 1m results)
  const getGlobalRoundId = () => Math.floor(Date.now() / 360000).toString();

  // Real-time Leaderboard Listener
  useEffect(() => {
    const roundId = user.competition?.roundId || getGlobalRoundId();

    const q = query(
      collection(db, "leaderboard"),
      where("roundId", "==", roundId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries: LeaderboardEntry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          rank: 0,
          name: data.name,
          accountId: data.accountId,
          pnl: data.pnl,
          value: data.value,
          isUser: data.accountId === user.accountId
        });
      });

      const sorted = entries.sort((a, b) => b.pnl - a.pnl);
      setParticipants(sorted.map((p, i) => ({ ...p, rank: i + 1 })).slice(0, 50));
      setQueryError(null);
    }, (error) => {
      console.error("Firestore Snapshot Error:", error);
      setQueryError("Leaderboard sync error.");
    });

    return () => unsubscribe();
  }, [user.accountId, user.competition?.roundId]);

  // Global Sync Timer & Auto-Redirect Logic
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const currentGlobalRound = getGlobalRoundId();
      const userRound = user.competition?.roundId;

      const roundStart = Math.floor(now / 360000) * 360000;
      const roundPlayEnd = roundStart + 300000;
      const roundWaitEnd = roundStart + 360000;

      const userEntry = participants.find(p => p.isUser);
      const userRank = userEntry?.rank || 0;

      // Update UI Clock and Local Phase State
      if (now < roundPlayEnd) {
        setIsRaceActive(true);
        setIsWaitPhase(false);
        const diff = Math.floor((roundPlayEnd - now) / 1000);
        setTimeLeftStr(`RACING: ${diff}s`);
      } else {
        setIsRaceActive(false);
        setIsWaitPhase(true);
        const diff = Math.floor((roundWaitEnd - now) / 1000);
        setTimeLeftStr(`RESULTS: ${diff}s`);
      }

      // TARGETED AUTO-REDIRECT LOGIC
      if (user.competition?.isCompeting && userRound) {
        if (userRound === currentGlobalRound) {
          if (now >= roundPlayEnd) {
            const diffToNextRound = Math.floor((roundWaitEnd - now) / 1000);
            if (userRank !== 1 || diffToNextRound <= 1) {
              if (!isPayoutModalOpen) {
                onReset();
              }
            }
          }
        }
        else if (parseInt(userRound) < parseInt(currentGlobalRound)) {
          onReset();
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [user.competition?.isCompeting, user.competition?.roundId, participants, onReset, isPayoutModalOpen]);

  const userEntry = participants.find(p => p.isUser);
  const userRank = userEntry?.rank || 0;

  const globalNow = Date.now();
  const globalWaitPhase = (globalNow % 360000) >= 300000;

  const isUserPreRegistered = user.competition?.isCompeting && parseInt(user.competition.roundId) > parseInt(getGlobalRoundId());
  const isWinner = userRank === 1 && isWaitPhase && user.competition?.roundId === getGlobalRoundId();

  if (!user.competition?.isCompeting) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-8 animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mb-4">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <div className="max-w-xl">
          <h2 className="text-5xl font-black mb-4 uppercase tracking-tighter">The Global Arena</h2>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed">
            High-stakes 5-minute global sprint. All participants trade against each other in real-time.
            Highest PNL at the buzzer wins the prize pool via Stripe.
          </p>

          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 mb-8 inline-block w-full max-w-sm">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Arena Status</p>
            <div className="flex items-center justify-center gap-3">
              <span className={`w-2 h-2 rounded-full ${globalWaitPhase ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></span>
              <p className={`text-xl font-black font-mono ${globalWaitPhase ? 'text-amber-400' : 'text-emerald-400'}`}>
                {globalWaitPhase ? 'GAME STARTING SOON' : 'ARENA OPEN'}
              </p>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              {globalWaitPhase ? `Registration for next round is open.` : `Next buzz in ${getSeconds()}`}
            </p>
          </div>

          <br />
          <button
            onClick={onRegister}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-12 py-5 rounded-2xl font-black text-xl shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all w-full md:w-auto"
          >
            {globalWaitPhase ? 'Pre-Register for Next Round' : 'Enter Arena — $5.00 via Stripe'}
          </button>
        </div>
      </div>
    );
  }

  if (isUserPreRegistered) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in duration-500">
        <div className="relative mb-10">
          <div className="w-32 h-32 border-4 border-emerald-500/20 rounded-full flex items-center justify-center">
            <div className="w-24 h-24 border-4 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-white">
            {getSeconds().replace('s', '')}
          </div>
        </div>
        <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Preparing Launch</h3>
        <p className="text-slate-500 font-bold max-w-sm mb-8">You are successfully registered for Round #{user.competition?.roundId}. Launching in exactly {getSeconds()}.</p>
        <button onClick={onReset} className="text-[10px] font-black text-slate-700 uppercase hover:text-rose-500 transition-colors tracking-widest">
          Cancel Registration & Exit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {isPayoutModalOpen && (
        <CompetitionPayoutModal
          amount={50.00}
          onClose={() => setIsPayoutModalOpen(false)}
          onSuccess={() => {
            setIsPayoutModalOpen(false);
            onReset();
          }}
        />
      )}

      {queryError && (
        <div className="bg-rose-500/10 border border-rose-500/50 p-4 rounded-xl text-rose-400 text-xs font-bold text-center">
          {queryError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Global Clock</p>
          <p className={`text-2xl font-black ${isRaceActive ? 'text-emerald-400' : 'text-amber-400'}`}>
            {timeLeftStr}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Real-Time Rank</p>
          <p className="text-2xl font-black text-white">
            {userRank ? `#${userRank}` : '--'} <span className="text-xs text-slate-500 font-normal">/ {participants.length} total</span>
          </p>
        </div>
        <div className="bg-slate-900 border border-emerald-500/30 p-6 rounded-3xl">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Live Prize Pool</p>
          <p className="text-2xl font-black text-emerald-400">${(participants.length * 5).toFixed(2)}</p>
        </div>
      </div>

      {isWinner && (
        <div className="bg-emerald-500 p-8 rounded-3xl text-slate-950 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-emerald-500/40 animate-in slide-in-from-top-4 duration-500 ring-4 ring-white/20">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner">🏆</div>
            <div>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter">Arena Champion!</h3>
              <p className="font-bold opacity-80 uppercase text-xs tracking-widest">You dominated the field. Instant Stripe Payout is ready.</p>
            </div>
          </div>
          <button
            onClick={() => setIsPayoutModalOpen(true)}
            className="bg-slate-950 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl active:scale-95"
          >
            Claim $50.00 via Stripe
          </button>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex justify-between items-center">
          <h4 className="font-black text-white uppercase tracking-widest text-sm">Global Leaderboard (Round {user.competition?.roundId})</h4>
          <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Cloud Sync: {participants.length} Active
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase font-black border-b border-slate-800/50">
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Investor Identity</th>
                <th className="px-6 py-4 text-right">Round PNL %</th>
                <th className="px-6 py-4 text-right">Net Worth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {participants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-600 text-sm font-bold uppercase tracking-widest opacity-30 italic">No competitors on field...</td>
                </tr>
              ) : (
                participants.map((p) => (
                  <tr key={p.accountId} className={`transition-colors group ${p.isUser ? 'bg-emerald-500/10' : 'hover:bg-slate-800/20'}`}>
                    <td className="px-6 py-5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${p.rank === 1 ? 'bg-amber-400 text-slate-900' :
                        p.rank === 2 ? 'bg-slate-300 text-slate-900' :
                          p.rank === 3 ? 'bg-orange-400 text-slate-900' :
                            'bg-slate-800 text-slate-500'
                        }`}>
                        {p.rank}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${p.isUser ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-400'}`}>
                          {p.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className={`font-bold text-sm ${p.isUser ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {p.name} {p.isUser && <span className="ml-1 text-[8px] border border-emerald-500 px-1 rounded text-emerald-500">YOU</span>}
                        </span>
                      </div>
                    </td>
                    <td className={`px-6 py-5 text-right font-black ${p.pnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {p.pnl >= 0 ? '+' : ''}{p.pnl.toFixed(2)}%
                    </td>
                    <td className="px-6 py-5 text-right font-mono text-xs text-slate-500">
                      ${p.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center pb-8">
        <button onClick={onReset} className="text-[10px] font-black text-slate-700 uppercase hover:text-rose-500 transition-colors tracking-widest">
          Emergency Exit (Progress Lost)
        </button>
      </div>
    </div>
  );
};

export default CompetitionView;
