
import { MarketData, ChartData } from '../types';
import { BINANCE_REST_API } from '../constants';

export const fetchMarketPrices = async (symbols: string[]): Promise<MarketData[]> => {
  try {
    const response = await fetch(`${BINANCE_REST_API}/ticker/24hr`);
    const allData = await response.json();
    const symbolSet = new Set(symbols);
    
    return allData
      .filter((item: any) => symbolSet.has(item.symbol))
      .map((data: any) => ({
        symbol: data.symbol,
        price: parseFloat(data.lastPrice),
        change24h: parseFloat(data.priceChangePercent),
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
      }));
  } catch (error) {
    console.error("Error fetching market prices:", error);
    return [];
  }
};

export const fetchOHLCData = async (symbol: string, interval: string = '1h'): Promise<ChartData[]> => {
  try {
    const response = await fetch(`${BINANCE_REST_API}/klines?symbol=${symbol}&interval=${interval}&limit=200`);
    const data = await response.json();
    return data.map((d: any) => ({
      time: d[0] / 1000, // Convert ms to s
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5]),
    }));
  } catch (error) {
    console.error("Error fetching OHLC data:", error);
    return [];
  }
};
