import React, { useState, useEffect } from 'react';
import { UserState } from '../types';
import { referralLink, getReferralList, ReferralRecord, REFERRAL_SIGNUP_REWARD_USD } from '../services/referral';
import { auth } from '../firebaseConfig';

interface ReferralPageProps {
  user: UserState;
}

// Compact "x ago" formatter for the referral list.
function timeAgo(ts: number): string {
  if (!ts) return '';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 7) return `${d} day${d === 1 ? '' : 's'} ago`;
  const w = Math.floor(d / 7); if (w < 5) return `${w} week${w === 1 ? '' : 's'} ago`;
  const mo = Math.floor(d / 30); return `${mo} month${mo === 1 ? '' : 's'} ago`;
}

const ReferralPage: React.FC<ReferralPageProps> = ({ user }) => {
  const [copied, setCopied] = useState(false);
  const [shareNote, setShareNote] = useState('');
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);

  // Load the real list of people who signed up via this user's code.
  useEffect(() => {
    let alive = true;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getReferralList(uid).then((list) => { if (alive) setReferrals(list); }).catch(() => {});
    return () => { alive = false; };
  }, [user.referralCount]);

  // Stable ref code (stored at signup); fall back to a deterministic one.
  const refCode = user.referralCode || `CW-${user.accountId.split('@')[0].toUpperCase().substring(0, 6)}-${user.accountId.length.toString(36).toUpperCase()}`;
  const refLink = referralLink(refCode);

  // Short intro blurb generated for every share action.
  const introText = `🚀 Mình đang dùng CoinWise AI — nền tảng giao dịch crypto + AI alt-data, thực hành miễn phí không rủi ro. Đăng ký qua link của mình nhé:`;
  const shareText = `${introText} ${refLink}`;

  const flash = (msg: string) => { setShareNote(msg); setTimeout(() => setShareNote(''), 2500); };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const copyMessage = async () => {
    try { await navigator.clipboard.writeText(shareText); flash('✓ Đã copy lời mời — dán vào đâu cũng được'); } catch {}
  };

  // Each channel opens a pre-filled composer with the intro text + link.
  const share = (channel: string) => {
    const t = encodeURIComponent(introText);
    const u = encodeURIComponent(refLink);
    const full = encodeURIComponent(shareText);
    const urls: Record<string, string> = {
      'Twitter / X': `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
      'Telegram': `https://t.me/share/url?url=${u}&text=${t}`,
      'WhatsApp': `https://wa.me/?text=${full}`,
      'Email': `mailto:?subject=${encodeURIComponent('Join me on CoinWise AI')}&body=${full}`,
    };
    if (channel === 'Discord') {
      navigator.clipboard.writeText(shareText).then(
        () => flash('✓ Đã copy lời mời — dán vào Discord'),
        () => flash('Không copy được, hãy thử nút Copy message'),
      );
      return;
    }
    window.open(urls[channel], '_blank', 'noopener,noreferrer');
  };

  const earnings = user.referralEarnings || 0;
  const refCount = user.referralCount || 0;
  const projectedMonthly = refCount * 8.5; // simulated

  // Tier system
  const refTiers = [
    { name: 'Bronze', min: 0, max: 9, commission: '20%', color: 'orange' },
    { name: 'Silver', min: 10, max: 49, commission: '25%', color: 'slate' },
    { name: 'Gold', min: 50, max: 199, commission: '30%', color: 'amber' },
    { name: 'Diamond', min: 200, max: Infinity, commission: '40%', color: 'cyan' }
  ];
  const currentRefTier = refTiers.find(t => refCount >= t.min && refCount <= t.max) || refTiers[0];
  const nextTier = refTiers.find(t => t.min > refCount);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-emerald-500/20 via-slate-900 to-blue-500/10 border border-emerald-500/30 rounded-3xl p-8 md:p-12 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/20 blur-3xl rounded-full pointer-events-none" />
        <div className="relative">
          <span className="inline-block bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">Referral Program</span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-3">Earn <span className="text-emerald-400">{currentRefTier.commission}</span> lifetime commission.</h1>
          <p className="text-slate-300 text-lg max-w-2xl mb-8">Invite friends to CoinWise. Earn a cut of everything they spend — subscriptions, Arena entries, Academy courses. Forever.</p>

          {/* Referral link box */}
          <div className="bg-slate-950 border border-slate-700 rounded-2xl p-2 flex flex-col md:flex-row items-stretch gap-2 max-w-2xl">
            <div className="flex-1 px-4 py-3 font-mono text-sm text-emerald-400 truncate">{refLink}</div>
            <button onClick={copyLink} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3 rounded-xl whitespace-nowrap transition">
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>

          <div className="flex flex-wrap gap-3 mt-5">
            {[
              { l: 'Twitter / X', c: 'sky' },
              { l: 'Telegram', c: 'blue' },
              { l: 'WhatsApp', c: 'emerald' },
              { l: 'Discord', c: 'violet' },
              { l: 'Email', c: 'slate' }
            ].map(s => (
              <button
                key={s.l}
                onClick={() => share(s.l)}
                className={`bg-${s.c}-500/10 hover:bg-${s.c}-500/20 text-${s.c}-400 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl transition`}
              >
                Share via {s.l}
              </button>
            ))}
          </div>

          {/* Generated invite message preview */}
          <div className="mt-5 max-w-2xl bg-slate-950/60 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Your invite message</p>
              <button onClick={copyMessage} className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300">
                Copy message
              </button>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{introText} <span className="text-emerald-400 break-all">{refLink}</span></p>
            {shareNote && <p className="text-[11px] text-emerald-400 font-bold mt-2">{shareNote}</p>}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">Total Referred</p>
          <p className="text-3xl font-black">{refCount}</p>
          <p className="text-[10px] text-slate-500 mt-1">All-time signups</p>
        </div>
        <div className="bg-slate-900/50 border border-emerald-500/30 rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest font-black text-emerald-400 mb-1">Lifetime Earnings</p>
          <p className="text-3xl font-black text-emerald-400">${earnings.toFixed(2)}</p>
          <p className="text-[10px] text-slate-500 mt-1">Paid via Stripe</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">This Month</p>
          <p className="text-3xl font-black text-blue-400">${projectedMonthly.toFixed(2)}</p>
          <p className="text-[10px] text-slate-500 mt-1">Projected based on activity</p>
        </div>
        <div className="bg-slate-900/50 border border-amber-500/30 rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest font-black text-amber-400 mb-1">Current Tier</p>
          <p className="text-3xl font-black text-amber-400">{currentRefTier.name}</p>
          <p className="text-[10px] text-slate-500 mt-1">{currentRefTier.commission} commission</p>
        </div>
      </div>

      {/* Tier Progress */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-3">
          <div>
            <h2 className="text-xl font-black">Affiliate Tier Progression</h2>
            <p className="text-slate-400 text-sm">{nextTier ? `${nextTier.min - refCount} more referrals to reach ${nextTier.name} (${nextTier.commission})` : 'You are at the highest tier!'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest font-black text-slate-500">Current Rate</p>
            <p className="text-3xl font-black text-emerald-400">{currentRefTier.commission}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-2">
          {refTiers.map((t) => {
            const reached = refCount >= t.min;
            const current = currentRefTier.name === t.name;
            return (
              <div key={t.name} className={`text-center py-3 rounded-xl border-2 transition ${
                current ? `border-${t.color}-500 bg-${t.color}-500/10` :
                reached ? `border-slate-700 bg-slate-800/40` :
                `border-slate-800 bg-slate-900/40 opacity-50`
              }`}>
                <p className={`font-black ${current ? `text-${t.color}-400` : reached ? 'text-slate-300' : 'text-slate-600'}`}>{t.name}</p>
                <p className="text-xs text-slate-500 mt-1">{t.commission}</p>
                <p className="text-[10px] text-slate-600 mt-1">{t.min === Infinity ? '200+' : `${t.min}-${t.max === Infinity ? '∞' : t.max}`} refs</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* What you earn */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { t: 'Subscriptions', d: `Get ${currentRefTier.commission} of every Pro ($19/mo) or Elite ($99/mo) subscription — every month, forever.`, icon: '💳' },
          { t: 'Arena Entries', d: `Earn ${currentRefTier.commission} of every Arena entry fee from $5 Bronze up to $500 Diamond rooms.`, icon: '🏆' },
          { t: 'Academy Courses', d: `Get ${currentRefTier.commission} on every course purchase from $49 to $299. Includes bundle deals.`, icon: '🎓' }
        ].map(c => (
          <div key={c.t} className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="text-4xl mb-3">{c.icon}</div>
            <h3 className="font-black text-lg mb-2">{c.t}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{c.d}</p>
          </div>
        ))}
      </div>

      {/* Recent Referrals */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-black text-lg">Recent Referrals</h2>
          <button className="text-xs font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300">View All</button>
        </div>
        {referrals.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-4">📬</div>
            <p className="text-slate-400 font-black">No referrals yet</p>
            <p className="text-slate-500 text-sm mt-2">Share your link — you earn ${REFERRAL_SIGNUP_REWARD_USD} each time someone signs up with it.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-slate-500 font-black border-b border-slate-800/50">
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3 text-right">Your Earning</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.uid} className="border-b border-slate-800/40">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-black text-emerald-400">{r.name.substring(0, 2).toUpperCase()}</div>
                      <p className="font-bold text-sm">{r.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{timeAgo(r.joinedAt)}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">Signed up</td>
                  <td className="px-6 py-4 text-right font-black text-emerald-400">+${r.rewardUsd.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payout settings */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <h2 className="text-xl font-black mb-2">Set up your payout method</h2>
          <p className="text-slate-400 text-sm">Connect your Stripe Express account to receive commissions automatically each month. Minimum payout: $20.</p>
        </div>
        <button className="bg-[#635BFF] hover:bg-[#5851e0] text-white font-black px-7 py-3.5 rounded-xl whitespace-nowrap transition">
          Connect Stripe →
        </button>
      </div>
    </div>
  );
};

export default ReferralPage;
