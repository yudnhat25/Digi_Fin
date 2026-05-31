
import React, { useState, useEffect } from 'react';
import { UserState, MarketData } from '../types';
import { Wallet, TrendingUp, Shield, Clock, ArrowUpRight, ArrowDownRight, CreditCard, DollarSign } from 'lucide-react';
import PortfolioPieChart from './PortfolioPieChart';
import BankCheckoutModal from './BankCheckoutModal';

interface UserAccountProps {
    user: UserState;
    marketPrices: MarketData[];
    onDeposit: (amount: number) => void;
}

/**
 * Deposit form routed through CoinWise Bank — same VND rail Arena uses.
 * User enters USD; on submit, BankCheckoutModal converts to ₫ via /fx/convert,
 * debits the user's bank balance, then onSuccess credits paper-trading USD.
 * No Stripe SDK dependency anymore; the bank is the single payment surface.
 */
const BankDepositForm: React.FC<{
    accountId: string;
    holder: string;
    onSuccess: (amount: number) => void;
}> = ({ accountId, holder, onSuccess }) => {
    const [amount, setAmount] = useState('1000');
    const [open, setOpen] = useState(false);
    const usd = Math.max(0, parseFloat(amount) || 0);

    return (
        <>
            <div className="space-y-4">
                <div>
                    <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Deposit Amount (USD)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">$</span>
                        <input
                            type="number"
                            min="10"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-[#1A1D25] border border-gray-700 rounded-lg py-3 pl-8 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                            placeholder="1000.00"
                        />
                    </div>
                </div>

                <button
                    type="button"
                    disabled={usd < 10}
                    onClick={() => setOpen(true)}
                    className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg transition-all transform active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <CreditCard size={18} />
                    <span>Deposit ${usd.toFixed(2)} via CoinWise Bank</span>
                </button>
                <p className="text-[11px] text-gray-500 text-center leading-relaxed">
                    Funds are debited in VND from your CoinWise Bank account at the live FX rate, then added to paper-trading cash.
                </p>
            </div>
            {open && (
                <BankCheckoutModal
                    accountId={accountId}
                    holder={holder}
                    amountUsd={usd}
                    purpose="ACCOUNT_TOPUP"
                    title="Paper Trading Top-Up"
                    subtitle="Funds added to your $USD trading cash"
                    label={`+$${usd.toFixed(0)}`}
                    ctaText={`Top up $${usd.toFixed(2)}`}
                    onClose={() => setOpen(false)}
                    onSuccess={() => { setOpen(false); onSuccess(usd); }}
                />
            )}
        </>
    );
};

const UserAccount: React.FC<UserAccountProps> = ({ user, marketPrices, onDeposit }) => {

    // Calculate Net Worth
    const assetsValue = user.assets.reduce((acc, asset) => {
        const price = marketPrices.find(m => m.symbol === asset.symbol)?.price || 0;
        return acc + (asset.amount * price);
    }, 0);

    const totalBalance = user.balance + assetsValue;

    // Calculate BTC holding
    const btcAsset = user.assets.find(a => a.symbol === 'BTCUSDT');
    const btcAmount = btcAsset ? btcAsset.amount : 0;
    const btcPrice = marketPrices.find(m => m.symbol === 'BTCUSDT')?.price || 0;
    const btcValue = btcAmount * btcPrice;

    // P&L calculation based on Initial 1M USDT
    // Assuming strict rules: Initial = 1,000,000 + total_deposits
    const totalDeposits = user.transactions
        .filter(t => t.type === 'DEPOSIT')
        .reduce((acc, t) => acc + t.amount, 0);

    const initialBase = 1000000 + totalDeposits;
    const pnl = totalBalance - initialBase;
    const pnlPercent = ((pnl / initialBase) * 100).toFixed(2);
    const isPositive = pnl >= 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Top Section - Account Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* User Profile Card */}
                <div className="bg-[#131722] border border-gray-800 rounded-xl p-6 relative overflow-hidden group hover:border-gray-700 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                                {user.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">{user.name}</h2>
                                <div className="text-gray-400 text-sm">Paper Trading Account</div>
                                <div className="mt-1 inline-flex items-center space-x-1 bg-gray-800/50 px-2 py-0.5 rounded text-xs text-gray-400 border border-gray-700/50">
                                    <Shield size={10} />
                                    <span>ID: {user.accountId || 'CW-001337'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-800 pt-4 mt-2">
                        <div className="text-center">
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Trades</div>
                            <div className="text-xl font-mono text-white">{user.transactions.filter(t => t.type !== 'DEPOSIT').length}</div>
                        </div>
                        <div className="h-8 w-px bg-gray-800"></div>
                        <div className="text-center">
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Win Rate</div>
                            <div className="text-xl font-mono text-emerald-400">
                                {/* Simulated Win Rate */}
                                {(Math.random() * 20 + 40).toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Asset Allocation Card */}
                <div className="bg-[#131722] border border-gray-800 rounded-xl p-6 relative overflow-hidden group hover:border-gray-700 transition-all">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="flex items-center space-x-2 text-gray-400 mb-4">
                        <Wallet size={18} />
                        <span className="text-sm font-medium">Total Balance</span>
                    </div>
                    <div className="text-3xl font-bold text-white tracking-tight mb-2">
                        ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-sm font-medium flex items-center space-x-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        <span>${Math.abs(pnl).toLocaleString()} ({pnlPercent}%)</span>
                    </div>

                    <div className="mt-6 space-y-3">
                        {/* USDT Bar */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-400">USDT (Cash)</span>
                                <span className="text-white font-mono">${user.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${Math.min((user.balance / totalBalance) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                        {/* BTC Bar */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-400">BTC Value</span>
                                <span className="text-white font-mono">${btcValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${Math.min((btcValue / totalBalance) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* P&L Performance Card */}
                <div className="bg-[#131722] border border-gray-800 rounded-xl p-6 relative overflow-hidden group hover:border-gray-700 transition-all">
                    <div className="absolute font-mono text-[10rem] text-emerald-500/5 -right-10 -bottom-16 leading-none pointer-events-none">
                        $
                    </div>
                    <div className="flex items-center space-x-2 text-gray-400 mb-4">
                        <TrendingUp size={18} />
                        <span className="text-sm font-medium">Global P&L</span>
                    </div>

                    <div className={`text-4xl font-bold tracking-tighter mb-2 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : '-'}${Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-gray-500 mb-8">
                        Initial Capital: <span className="text-gray-300">$1,000,000</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/50">
                            <div className="text-xs text-gray-400 mb-1">BTC Holdings</div>
                            <div className="font-mono text-white text-sm">{btcAmount.toFixed(6)}</div>
                        </div>
                        <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/50">
                            <div className="text-xs text-gray-400 mb-1">Asset Value</div>
                            <div className="font-mono text-white text-sm">${assetsValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        </div>
                    </div>
                </div>

                {/* Portfolio Pie Chart */}
                <PortfolioPieChart userState={user} marketPrices={marketPrices} />
            </div>

            {/* Deposit Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-[#131722] border border-gray-800 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                                    <CreditCard className="text-emerald-500 mr-2" />
                                    Deposit Funds
                                </h3>
                                <p className="text-gray-400 text-sm mt-1">Add funds to paper-trading cash. Debited in VND from your CoinWise Bank — same rail as Arena.</p>
                            </div>
                            <div className="hidden sm:block">
                                <span className="bg-emerald-500/10 text-emerald-500 text-xs px-2 py-1 rounded border border-emerald-500/20">CoinWise Bank</span>
                            </div>
                        </div>

                        <div className="max-w-md">
                            <BankDepositForm accountId={user.accountId} holder={user.name} onSuccess={onDeposit} />
                        </div>
                    </div>
                </div>

                {/* Recent Deposits Sidefeed */}
                <div className="bg-[#131722] border border-gray-800 rounded-xl p-6 h-full">
                    <div className="flex items-center space-x-2 mb-6">
                        <Clock size={16} className="text-gray-400" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Deposits</h3>
                    </div>

                    <div className="space-y-4">
                        {user.transactions.filter(t => t.type === 'DEPOSIT').length === 0 ? (
                            <div className="text-center py-10 text-gray-500 text-sm italic">
                                No deposits yet.
                            </div>
                        ) : (
                            user.transactions
                                .filter(t => t.type === 'DEPOSIT')
                                .sort((a, b) => b.timestamp - a.timestamp)
                                .slice(0, 5)
                                .map((tx) => (
                                    <div key={tx.id} className="flex justify-between items-center bg-gray-800/20 p-3 rounded border border-gray-700/50">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                <DollarSign size={14} />
                                            </div>
                                            <div>
                                                <div className="text-white text-sm font-medium">USD Deposit</div>
                                                <div className="text-gray-500 text-xs">{new Date(tx.timestamp).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="text-emerald-400 font-mono font-medium">
                                            +${tx.amount.toLocaleString()}
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserAccount;
