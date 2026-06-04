import React, { useState, useMemo, useEffect } from 'react';
import { UserState, SubscriptionTier, MarketData, Asset } from '../types';
import { EARN_PRODUCTS } from '../constants';
import { apiEarnYields, type EarnYields } from '../services/coinwiseApi';

interface EarnPageProps {
  user: UserState;
  marketData: MarketData[];
  onStake: (productId: string, amount: number) => void;   // amount in COIN units (USD for USDT)
  onUnstake: (stakeId: string) => void;
  onUpgradeClick: () => void;
}

const TIER_RANK: Record<SubscriptionTier, number> = { STARTER: 0, PRO: 1, ELITE: 2 };
const fmtCoin = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 6 });
const fmtUsd = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

const EarnPage: React.FC<EarnPageProps> = ({ user, marketData, onStake, onUnstake, onUpgradeClick }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [risk, setRisk] = useState<'ALL' | 'Low' | 'Medium' | 'High'>('ALL');
  const [yields, setYields] = useState<EarnYields | null>(null);

  const tier = user.tier || 'STARTER';
  const userTierRank = TIER_RANK[tier];

  // Coin-style: you stake the asset you actually HOLD. Price is for USD display;
  // `held` is the stake-able balance — cash for USDT, coin holdings otherwise.
  const assets: Asset[] = Array.isArray(user.assets)
    ? user.assets
    : (user.assets && typeof user.assets === 'object' ? Object.values(user.assets) as Asset[] : []);
  const priceOf = (sym: string) => sym === 'USDT' ? 1 : (marketData.find(m => m.symbol === `${sym}USDT`)?.price || 0);
  const heldOf = (sym: string) => sym === 'USDT' ? user.balance : ((assets.find(a => a.symbol === `${sym}USDT`)?.amount) || 0);

  useEffect(() => {
    let alive = true;
    apiEarnYields().then((y) => { if (alive) setYields(y); }).catch(() => { /* keep static fallback */ });
    return () => { alive = false; };
  }, []);

  // Overlay live market APY (DefiLlama) onto the product catalog; fall back to
  // the static per-product estimate when a symbol has no live pool data.
  const products = useMemo(() => EARN_PRODUCTS.map((p) => {
    const live = yields?.yields?.[p.symbol as keyof EarnYields['yields']];
    return { ...p, apy: typeof live === 'number' ? live : p.apy, apyLive: typeof live === 'number' };
  }), [yields]);

  const filtered = useMemo(() => products.filter(p => risk === 'ALL' || p.risk === risk), [products, risk]);

  const product = selected ? products.find(p => p.id === selected) : null;
  const sym = product?.symbol || 'USDT';
  const isUsdt = sym === 'USDT';
  const price = priceOf(sym);
  const held = heldOf(sym);                              // stake-able balance (coin units / USD)
  const amountNum = parseFloat(amount) || 0;            // coin units (USD for USDT)
  const amountUsd = amountNum * price;
  const projectedEarningCoin = product ? amountNum * product.apy * (product.lockDays || 365) / 365 : 0;

  const positions = user.stakes || [];
  const totalStakedUsd = positions.reduce((s, p) => s + p.amount * priceOf(p.symbol), 0);
  const dailyEarningsUsd = positions.reduce((s, p) => s + (p.amount * p.apy / 365) * priceOf(p.symbol), 0);

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
          <p className="text-2xl font-black">${totalStakedUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">Active Positions</p>
          <p className="text-2xl font-black">{positions.length}</p>
        </div>
        <div className="bg-slate-900/50 border border-emerald-500/30 rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest font-black text-emerald-400 mb-1">Daily Earnings</p>
          <p className="text-2xl font-black text-emerald-400">+${dailyEarningsUsd.toFixed(2)}</p>
        </div>
        <div className="bg-slate-900/50 border border-amber-500/30 rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest font-black text-amber-400 mb-1">Annual Projection</p>
          <p className="text-2xl font-black text-amber-400">+${(dailyEarningsUsd * 365).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      {/* My Positions */}
      {positions.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-xl font-black mb-4">Active Stakes</h2>
          <div className="space-y-3">
            {positions.map(pos => {
              const daysActive = Math.floor((Date.now() - pos.startTime) / 86400000);
              const accruedEarnings = pos.amount * pos.apy * daysActive / 365; // in coin units
              const pp = priceOf(pos.symbol);
              const posIsUsdt = pos.symbol === 'USDT';
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
                      <p className="font-bold text-sm">{posIsUsdt ? `$${pos.amount.toLocaleString()}` : `${fmtCoin(pos.amount)} ${pos.symbol}`}</p>
                      {!posIsUsdt && <p className="text-[10px] text-slate-500 tabular-nums">~${fmtUsd(pos.amount * pp)}</p>}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black text-slate-500">Earned</p>
                      <p className="font-bold text-sm text-emerald-400">+{posIsUsdt ? `$${accruedEarnings.toFixed(2)}` : `${fmtCoin(accruedEarnings)} ${pos.symbol}`}</p>
                      {!posIsUsdt && <p className="text-[10px] text-emerald-500/70 tabular-nums">~${fmtUsd(accruedEarnings * pp)}</p>}
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

      {/* APY provenance */}
      <div className="flex items-center gap-2 -mt-3">
        <span className={`w-1.5 h-1.5 rounded-full ${yields && !yields.degraded ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        <p className="text-[11px] text-slate-500">
          {yields && !yields.degraded
            ? `APY = live market median from DefiLlama (as of ${new Date(yields.asOf).toLocaleTimeString()}). Assets without a live pool show a static estimate.`
            : 'APY = static estimate — live DefiLlama feed unavailable.'}
        </p>
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
                <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">
                  {p.apyLive ? 'APY' : 'Est. APY'}
                  {p.apyLive
                    ? <span className="text-emerald-400"> · live</span>
                    : <span className="text-amber-400"> · est</span>}
                </p>
                <p className={`text-3xl font-black ${p.apy >= 0.15 ? 'text-amber-400' : p.apy >= 0.08 ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {(p.apy * 100).toFixed(2)}%
                </p>
              </div>
              <ul className="text-xs text-slate-400 space-y-1.5 mb-5 flex-1">
                <li>• Stake your {p.symbol} · earnings paid in {p.symbol}</li>
                <li>• {p.lockDays === 0 ? 'No lock, withdraw anytime' : `Locked for ${p.lockDays} days`}</li>
                <li className={heldOf(p.symbol) > 0 ? 'text-slate-400' : 'text-amber-400/80'}>
                  • You hold: {p.symbol === 'USDT' ? `$${fmtUsd(heldOf('USDT'))}` : `${fmtCoin(heldOf(p.symbol))} ${p.symbol}`}
                </li>
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

            <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 mb-2">Amount ({sym})</label>
            <input
              type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder={isUsdt ? '0.00' : `0.000000 ${sym}`}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 font-mono mb-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mb-2">
              {isUsdt ? 'Staked from your cash (USDT)' : (price > 0 ? `≈ $${fmtUsd(amountUsd)}` : 'live price unavailable — staking still works in coin units')}
            </p>
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[25, 50, 75, 100].map(p => (
                <button key={p} onClick={() => setAmount(isUsdt ? (held * p / 100).toFixed(2) : Number((held * p / 100).toFixed(8)).toString())} className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black py-2 rounded-lg uppercase">
                  {p}%
                </button>
              ))}
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 mb-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Daily Earnings</span>
                <span className="text-emerald-400 font-bold">+{isUsdt ? `$${(amountNum * product.apy / 365).toFixed(2)}` : `${fmtCoin(amountNum * product.apy / 365)} ${sym}`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">{product.lockDays === 0 ? 'Yearly Projection' : 'At End of Term'}</span>
                <span className="text-emerald-400 font-black">+{isUsdt ? `$${(product.lockDays === 0 ? amountNum * product.apy : projectedEarningCoin).toFixed(2)}` : `${fmtCoin(product.lockDays === 0 ? amountNum * product.apy : projectedEarningCoin)} ${sym}`}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-emerald-500/20">
                <span className="text-slate-400">Available {isUsdt ? 'cash' : sym}</span>
                <span className="font-mono">{isUsdt ? `$${held.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `${fmtCoin(held)} ${sym}`}</span>
              </div>
            </div>

            {!isUsdt && held <= 0 && (
              <p className="text-[11px] text-amber-400 mb-3 text-center">You don't hold any {sym}. Buy {sym} on the trading terminal first, then stake it here.</p>
            )}
            <button
              onClick={() => {
                onStake(product.id, amountNum);
                setSelected(null);
                setAmount('');
              }}
              disabled={amountNum <= 0 || amountNum > held}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black py-4 rounded-xl text-lg transition"
            >
              {amountNum > held ? `Insufficient ${sym}` : amountNum <= 0 ? 'Enter an amount' : `Confirm Stake — ${isUsdt ? `$${amountNum.toLocaleString()}` : `${fmtCoin(amountNum)} ${sym}`}`}
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
