import React, { useState, useMemo } from 'react';
import { UserState, StakePosition, SubscriptionTier } from '../types';
import { EARN_PRODUCTS } from '../constants';

interface EarnPageProps {
  user: UserState;
  onStake: (productId: string, amount: number) => void;
  onUnstake: (stakeId: string) => void;
  onUpgradeClick: () => void;
}

const TIER_RANK: Record<SubscriptionTier, number> = { STARTER: 0, PRO: 1, ELITE: 2 };

const EarnPage: React.FC<EarnPageProps> = ({ user, onStake, onUnstake, onUpgradeClick }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [amount, setAmount] = useState('1000');
  const [risk, setRisk] = useState<'ALL' | 'Low' | 'Medium' | 'High'>('ALL');

  const tier = user.tier || 'STARTER';
  const userTierRank = TIER_RANK[tier];

  const filtered = useMemo(() => {
    return EARN_PRODUCTS.filter(p => risk === 'ALL' || p.risk === risk);
  }, [risk]);

  const product = selected ? EARN_PRODUCTS.find(p => p.id === selected) : null;
  const amountNum = parseFloat(amount) || 0;
  const projectedEarning = product ? amountNum * product.apy * (product.lockDays || 365) / 365 : 0;

  const positions = user.stakes || [];
  const totalStaked = positions.reduce((s, p) => s + p.amount, 0);
  const dailyEarnings = positions.reduce((s, p) => s + (p.amount * p.apy / 365), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-violet-500/20 via-slate-900 to-emerald-500/10 border border-violet-500/30 rounded-3xl p-8 md:p-10 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-violet-500/20 blur-3xl rounded-full pointer-events-none" />
        <div className="relative">
          <span className="inline-block bg-violet-500/20 text-violet-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">CoinWise Earn</span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-2">Make your simulated capital work harder.</h1>
          <p className="text-slate-300 text-lg max-w-2xl">Practice staking, yield farming, and dual investment strategies. Learn DeFi mechanics safely — earn up to {tier === 'ELITE' ? '18' : tier === 'PRO' ? '12' : '5'}% APY (simulated) on your portfolio.</p>
        </div>
      </div>

      {/* My Earnings Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">Total Staked</p>
          <p className="text-2xl font-black">${totalStaked.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">Active Positions</p>
          <p className="text-2xl font-black">{positions.length}</p>
        </div>
        <div className="bg-slate-900/50 border border-emerald-500/30 rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest font-black text-emerald-400 mb-1">Daily Earnings</p>
          <p className="text-2xl font-black text-emerald-400">+${dailyEarnings.toFixed(2)}</p>
        </div>
        <div className="bg-slate-900/50 border border-amber-500/30 rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest font-black text-amber-400 mb-1">Annual Projection</p>
          <p className="text-2xl font-black text-amber-400">+${(dailyEarnings * 365).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      {/* My Positions */}
      {positions.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-xl font-black mb-4">Active Stakes</h2>
          <div className="space-y-3">
            {positions.map(pos => {
              const daysActive = Math.floor((Date.now() - pos.startTime) / 86400000);
              const accruedEarnings = pos.amount * pos.apy * daysActive / 365;
              const unlockAt = pos.startTime + pos.lockDays * 86400000;
              const canUnstake = pos.lockDays === 0 || Date.now() >= unlockAt;
              return (
                <div key={pos.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500/30 to-emerald-500/30 rounded-xl flex items-center justify-center text-xs font-black">{pos.symbol.substring(0, 3)}</div>
                    <div>
                      <p className="font-black text-sm">{pos.product}</p>
                      <p className="text-xs text-slate-500">{daysActive}d active · APY {(pos.apy * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-right">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black text-slate-500">Principal</p>
                      <p className="font-bold text-sm">${pos.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black text-slate-500">Earned</p>
                      <p className="font-bold text-sm text-emerald-400">+${accruedEarnings.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => canUnstake && onUnstake(pos.id)}
                      disabled={!canUnstake}
                      className={`text-xs font-black px-4 py-2 rounded-lg uppercase tracking-widest transition ${canUnstake ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                    >
                      {canUnstake ? 'Unstake' : `Locked ${Math.ceil((unlockAt - Date.now()) / 86400000)}d`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Risk filter */}
      <div className="flex gap-2 overflow-x-auto">
        {(['ALL', 'Low', 'Medium', 'High'] as const).map(r => (
          <button
            key={r} onClick={() => setRisk(r)}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl whitespace-nowrap transition ${
              risk === r ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {r === 'ALL' ? 'All Products' : `${r} Risk`}
          </button>
        ))}
      </div>

      {/* Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(p => {
          const productTierRank = TIER_RANK[p.minTier as SubscriptionTier];
          const locked = productTierRank > userTierRank;
          return (
            <div
              key={p.id}
              className={`relative bg-slate-900 border rounded-3xl p-6 flex flex-col transition ${
                locked ? 'border-slate-800 opacity-70' : 'border-slate-800 hover:border-emerald-500/50'
              }`}
            >
              {locked && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  {p.minTier}
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center text-xs font-black border border-slate-700">
                  {p.symbol.substring(0, 3)}
                </div>
                <div>
                  <p className="font-black">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.risk} Risk · {p.lockDays === 0 ? 'Flexible' : `${p.lockDays}-day lock`}</p>
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-4">
                <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">Est. APY</p>
                <p className={`text-3xl font-black ${p.apy >= 0.15 ? 'text-amber-400' : p.apy >= 0.08 ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {(p.apy * 100).toFixed(2)}%
                </p>
              </div>
              <ul className="text-xs text-slate-400 space-y-1.5 mb-5 flex-1">
                <li>• Daily payouts in {p.symbol}</li>
                <li>• {p.lockDays === 0 ? 'No lock, withdraw anytime' : `Locked for ${p.lockDays} days`}</li>
                <li>• Minimum: 100 {p.symbol}</li>
              </ul>
              {locked ? (
                <button onClick={onUpgradeClick} className="w-full bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-400 font-black py-3 rounded-xl uppercase tracking-widest text-xs transition">
                  Unlock with {p.minTier}
                </button>
              ) : (
                <button
                  onClick={() => setSelected(p.id)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl uppercase tracking-widest text-xs transition"
                >
                  Subscribe
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Stake Modal */}
      {product && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black text-slate-500">Subscribe</p>
                <h3 className="text-2xl font-black">{product.name}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest font-black text-slate-500">APY</p>
                <p className="text-emerald-400 font-black text-xl">{(product.apy * 100).toFixed(2)}%</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest font-black text-slate-500">Term</p>
                <p className="font-black text-xl">{product.lockDays === 0 ? 'Flexible' : `${product.lockDays}d`}</p>
              </div>
            </div>

            <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 mb-2">Amount (USDT)</label>
            <input
              type="number" value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 font-mono mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[10, 25, 50, 100].map(p => (
                <button key={p} onClick={() => setAmount(((user.balance * p) / 100).toFixed(0))} className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black py-2 rounded-lg uppercase">
                  {p}%
                </button>
              ))}
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 mb-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Daily Earnings</span>
                <span className="text-emerald-400 font-bold">+${(amountNum * product.apy / 365).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">{product.lockDays === 0 ? 'Yearly Projection' : 'At End of Term'}</span>
                <span className="text-emerald-400 font-black">+${(product.lockDays === 0 ? amountNum * product.apy : projectedEarning).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-emerald-500/20">
                <span className="text-slate-400">Available Balance</span>
                <span className="font-mono">${user.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <button
              onClick={() => { onStake(product.id, amountNum); setSelected(null); setAmount('1000'); }}
              disabled={amountNum <= 0 || amountNum > user.balance}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black py-4 rounded-xl text-lg transition"
            >
              Confirm Stake — ${amountNum.toLocaleString()}
            </button>
          </div>
        </div>
      )}

      {/* Upgrade CTA */}
      {tier !== 'ELITE' && (
        <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <span className="inline-block text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">VIP Earn</span>
            <h2 className="text-2xl md:text-3xl font-black mb-2">Unlock {tier === 'PRO' ? '18%' : '12-18%'} APY products.</h2>
            <p className="text-slate-400">{tier === 'PRO' ? 'Elite members access exclusive restaking products with up to 18% APY.' : 'Pro members unlock 12% APY tiers. Elite reaches 18% with dual investment & VIP restaking.'}</p>
          </div>
          <button onClick={onUpgradeClick} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-7 py-3.5 rounded-xl whitespace-nowrap transition">
            Upgrade Now →
          </button>
        </div>
      )}
    </div>
  );
};

export default EarnPage;
