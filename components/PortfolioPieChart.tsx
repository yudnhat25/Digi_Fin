import React from 'react';
import { UserState, MarketData } from '../types';

interface PortfolioPieChartProps {
    userState: UserState;
    marketPrices: MarketData[];
}

const PortfolioPieChart: React.FC<PortfolioPieChartProps> = ({ userState, marketPrices }) => {
    // Calculate total portfolio value
    const assetsValue = userState.assets.reduce((acc, asset) => {
        const price = marketPrices.find(m => m.symbol === asset.symbol)?.price || 0;
        return acc + (asset.amount * price);
    }, 0);

    const totalValue = userState.balance + assetsValue;

    // Calculate percentages for each asset + cash
    const portfolioData = [
        {
            name: 'USDT (Cash)',
            value: userState.balance,
            percentage: (userState.balance / totalValue) * 100,
            color: '#10b981' // emerald-500
        },
        ...userState.assets.map((asset, index) => {
            const price = marketPrices.find(m => m.symbol === asset.symbol)?.price || 0;
            const value = asset.amount * price;
            const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#14b8a6', '#84cc16'];

            return {
                name: asset.symbol.replace('USDT', ''),
                value: value,
                percentage: (value / totalValue) * 100,
                color: colors[index % colors.length]
            };
        })
    ].filter(item => item.value > 0);

    // Simple SVG pie chart
    let currentAngle = 0;
    const radius = 80;
    const centerX = 100;
    const centerY = 100;

    const createArc = (startAngle: number, endAngle: number) => {
        const start = polarToCartesian(centerX, centerY, radius, endAngle);
        const end = polarToCartesian(centerX, centerY, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

        return [
            'M', centerX, centerY,
            'L', start.x, start.y,
            'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
            'Z'
        ].join(' ');
    };

    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    return (
        <div className="bg-[#131722] border border-gray-800 rounded-xl p-6 h-full">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Portfolio Allocation</h3>

            <div className="flex flex-col items-center">
                {/* Pie Chart */}
                <svg width="200" height="200" viewBox="0 0 200 200" className="mb-6">
                    {portfolioData.map((item, index) => {
                        const sliceAngle = (item.percentage / 100) * 360;
                        const startAngle = currentAngle;
                        const endAngle = currentAngle + sliceAngle;
                        const path = createArc(startAngle, endAngle);
                        currentAngle = endAngle;

                        return (
                            <g key={index}>
                                <path
                                    d={path}
                                    fill={item.color}
                                    stroke="#131722"
                                    strokeWidth="2"
                                    className="transition-all hover:opacity-80 cursor-pointer"
                                />
                            </g>
                        );
                    })}
                    {/* Center circle for donut effect */}
                    <circle cx={centerX} cy={centerY} r="50" fill="#131722" />
                    <text
                        x={centerX}
                        y={centerY - 5}
                        textAnchor="middle"
                        className="text-xs fill-gray-400 font-bold"
                    >
                        Total
                    </text>
                    <text
                        x={centerX}
                        y={centerY + 10}
                        textAnchor="middle"
                        className="text-sm fill-white font-bold"
                    >
                        ${(totalValue / 1000).toFixed(0)}K
                    </text>
                </svg>

                {/* Legend */}
                <div className="w-full space-y-2">
                    {portfolioData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                                <div
                                    className="w-3 h-3 rounded-sm"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-gray-400">{item.name}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className="text-white font-mono">${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                <span className="text-gray-500 font-bold w-12 text-right">{item.percentage.toFixed(1)}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PortfolioPieChart;
