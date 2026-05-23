import React from 'react';
import { UserState, MarketData } from '../types';

interface PortfolioHoldingsProps {
    userState: UserState;
    marketPrices: MarketData[];
}

const PortfolioHoldings: React.FC<PortfolioHoldingsProps> = ({ userState, marketPrices }) => {
    // Calculate holdings with PNL
    const holdings = userState.assets.map(asset => {
        const currentPrice = marketPrices.find(m => m.symbol === asset.symbol)?.price || 0;

        // Find the average buy price from transactions
        const buyTransactions = userState.transactions.filter(t => t.asset === asset.symbol && t.type === 'BUY');
        const totalCost = buyTransactions.reduce((acc, t) => acc + (t.amount * t.price), 0);
        const totalAmount = buyTransactions.reduce((acc, t) => acc + t.amount, 0);
        const avgBuyPrice = totalAmount > 0 ? totalCost / totalAmount : 0;

        const currentValue = asset.amount * currentPrice;
        const costBasis = asset.amount * avgBuyPrice;
        const pnl = currentValue - costBasis;
        const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

        return {
            symbol: asset.symbol,
            amount: asset.amount,
            avgBuyPrice,
            currentPrice,
            currentValue,
            costBasis,
            pnl,
            pnlPercent
        };
    });

    console.log('Portfolio Holdings Debug:', {
        assetsCount: userState.assets.length,
        assets: userState.assets,
        holdingsCount: holdings.length,
        holdings: holdings
    });

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur">
                <div>
                    <h4 className="font-black text-white uppercase tracking-widest text-sm">Portfolio Holdings</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Current positions with P&L</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Positions: {holdings.length}</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] text-slate-500 uppercase font-black border-b border-slate-800/50 bg-slate-950/30">
                            <th className="px-6 py-4">Asset</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                            <th className="px-6 py-4 text-right">Avg Buy Price</th>
                            <th className="px-6 py-4 text-right">Current Price</th>
                            <th className="px-6 py-4 text-right">Current Value</th>
                            <th className="px-6 py-4 text-right">P&L (USDT)</th>
                            <th className="px-6 py-4 text-right">P&L %</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                        {holdings.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center gap-2 opacity-40">
                                        <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                        <p className="text-sm font-medium italic text-slate-500">No holdings yet. Start trading to build your portfolio.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            holdings.map((holding) => (
                                <tr key={holding.symbol} className="group hover:bg-slate-800/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-black text-white">{holding.symbol.replace('USDT', '')}/USDT</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-xs font-mono font-bold text-slate-300">{holding.amount.toFixed(6)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-xs font-mono text-slate-400">${holding.avgBuyPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-xs font-mono text-slate-300">${holding.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-xs font-mono font-bold text-white">${holding.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`text-xs font-black ${holding.pnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                            {holding.pnl >= 0 ? '+' : ''}${holding.pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className={`text-xs font-black ${holding.pnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                                {holding.pnlPercent >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(2)}%
                                            </span>
                                            {holding.pnlPercent >= 0 ? (
                                                <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-9 9-4-4-6 6" />
                                                </svg>
                                            ) : (
                                                <svg className="w-3 h-3 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-9-9-4 4-6-6" />
                                                </svg>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-slate-950/30 border-t border-slate-800/50 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span>Live Market Data</span>
                <span className="text-slate-600 italic">Updates every 15 seconds</span>
            </div>
        </div>
    );
};

export default PortfolioHoldings;
