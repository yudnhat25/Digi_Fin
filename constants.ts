
export const INITIAL_STATE = {
  balance: 1000000,
  assets: [],
  transactions: [],
  name: "Fintech Student",
  accountId: "CW-AI-8892-X",
  tier: 'STARTER' as const,
  watchlist: [
    { symbol: 'BTCUSDT', addedAt: Date.now() },
    { symbol: 'ETHUSDT', addedAt: Date.now() },
    { symbol: 'SOLUSDT', addedAt: Date.now() }
  ],
  stakes: [],
  enrollments: [],
  referralEarnings: 0,
  referralCount: 0,
  competition: {
    isCompeting: false,
    entryNetWorth: 0,
    entryTime: 0,
    pnlPercent: 0,
    currentRank: 0
  }
};

export const TIER_LIMITS = {
  STARTER: {
    aiMessagesPerDay: 10,
    maxStakes: 3,
    arenaRooms: ['BRONZE'],
    indicators: ['EMA', 'RSI'],
    tradingFee: 0.001,
    maxAPY: 0.05,
    label: 'Starter',
    price: 0,
    color: 'slate'
  },
  PRO: {
    aiMessagesPerDay: -1,
    maxStakes: 20,
    arenaRooms: ['BRONZE', 'SILVER', 'GOLD'],
    indicators: ['EMA', 'RSI', 'MACD', 'BOLLINGER', 'STOCH'],
    tradingFee: 0.0005,
    maxAPY: 0.12,
    label: 'Pro',
    price: 19,
    color: 'emerald'
  },
  ELITE: {
    aiMessagesPerDay: -1,
    maxStakes: 100,
    arenaRooms: ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND'],
    indicators: ['EMA', 'RSI', 'MACD', 'BOLLINGER', 'STOCH', 'ICHIMOKU', 'VWAP', 'FIBONACCI'],
    tradingFee: 0,
    maxAPY: 0.18,
    label: 'Elite',
    price: 99,
    color: 'amber'
  }
};

export const ARENA_ROOMS = [
  { id: 'BRONZE', name: 'Bronze', entryFee: 5, prizeCap: 500, color: 'orange', tierRequired: 'STARTER' },
  { id: 'SILVER', name: 'Silver', entryFee: 25, prizeCap: 5000, color: 'slate', tierRequired: 'PRO' },
  { id: 'GOLD', name: 'Gold', entryFee: 100, prizeCap: 25000, color: 'amber', tierRequired: 'PRO' },
  { id: 'DIAMOND', name: 'Diamond', entryFee: 500, prizeCap: 50000, color: 'cyan', tierRequired: 'ELITE' }
];

export const ACADEMY_COURSES = [
  { id: 'fund', title: 'Crypto Fundamentals', lessons: 12, duration: '2h', price: 0, level: 'Beginner', icon: '🎓', color: 'emerald', instructor: 'Sarah Chen, Ex-Coinbase', enrolled: 84321, rating: 4.9 },
  { id: 'ta', title: 'Technical Analysis Mastery', lessons: 24, duration: '6h', price: 49, level: 'Intermediate', icon: '📈', color: 'blue', instructor: 'David Rodriguez, CMT', enrolled: 32104, rating: 4.8 },
  { id: 'defi', title: 'DeFi & Yield Farming', lessons: 18, duration: '4h', price: 79, level: 'Intermediate', icon: '🌾', color: 'violet', instructor: 'Andre Crypto, DeFi OG', enrolled: 18742, rating: 4.7 },
  { id: 'risk', title: 'Risk Management Pro', lessons: 15, duration: '3h', price: 99, level: 'Advanced', icon: '🛡️', color: 'rose', instructor: 'Linda Park, Ex-Citadel', enrolled: 12480, rating: 4.9 },
  { id: 'algo', title: 'Algorithmic Trading 101', lessons: 32, duration: '8h', price: 149, level: 'Advanced', icon: '🤖', color: 'amber', instructor: 'Marcus Tan, Quant Dev', enrolled: 9214, rating: 4.8 },
  { id: 'hedge', title: 'Hedge Fund Strategies', lessons: 40, duration: '12h', price: 299, level: 'Expert', icon: '💎', color: 'cyan', instructor: 'Robert Klein, Ex-Goldman', enrolled: 4108, rating: 5.0 }
];

export const EARN_PRODUCTS = [
  { id: 'flex-usdt', symbol: 'USDT', name: 'USDT Flexible', apy: 0.045, lockDays: 0, minTier: 'STARTER', risk: 'Low' },
  { id: 'flex-btc', symbol: 'BTC', name: 'BTC Flexible', apy: 0.025, lockDays: 0, minTier: 'STARTER', risk: 'Low' },
  { id: 'lock-eth-30', symbol: 'ETH', name: 'ETH 30-Day Lock', apy: 0.072, lockDays: 30, minTier: 'STARTER', risk: 'Low' },
  { id: 'lock-sol-60', symbol: 'SOL', name: 'SOL 60-Day Lock', apy: 0.092, lockDays: 60, minTier: 'PRO', risk: 'Medium' },
  { id: 'lock-bnb-90', symbol: 'BNB', name: 'BNB 90-Day Lock', apy: 0.12, lockDays: 90, minTier: 'PRO', risk: 'Medium' },
  { id: 'dual-btc', symbol: 'BTC', name: 'BTC Dual Investment', apy: 0.15, lockDays: 14, minTier: 'PRO', risk: 'Medium' },
  { id: 'vip-eth', symbol: 'ETH', name: 'ETH VIP Yield', apy: 0.16, lockDays: 90, minTier: 'ELITE', risk: 'Medium' },
  { id: 'vip-sol', symbol: 'SOL', name: 'SOL Elite Restaking', apy: 0.18, lockDays: 180, minTier: 'ELITE', risk: 'High' }
];

export const CRYPTO_SYMBOLS = [
  // Majors & High Caps
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'DOTUSDT', 'TRXUSDT',
  'LINKUSDT', 'MATICUSDT', 'WBTCUSDT', 'UNIUSDT', 'LTCUSDT', 'SHIBUSDT', 'DAIUSDT', 'BCHUSDT', 'ATOMUSDT', 'ICPUSDT',
  
  // L1s & Infrastructure
  'NEARUSDT', 'XLMUSDT', 'ETCUSDT', 'XMRUSDT', 'OPUSDT', 'INJUSDT', 'TIAUSDT', 'LDOUSDT', 'FILUSDT', 'STXUSDT',
  'RUNEUSDT', 'APTUSDT', 'SUIUSDT', 'ARBUSDT', 'MKRUSDT', 'AAVEUSDT', 'GRTUSDT', 'RNDRUSDT', 'EGLDUSDT', 'FLOWUSDT',
  'THETAUSDT', 'ALGOUSDT', 'QNTUSDT', 'SANDUSDT', 'MANAUSDT', 'EOSUSDT', 'KAVAUSDT', 'AXSUSDT', 'NEOUSDT', 'CHZUSDT',
  'FTMUSDT', 'IOTAUSDT', 'CFXUSDT', 'KLAYUSDT', 'GALAUSDT', 'ZECUSDT', 'SNXUSDT', 'MINAUSDT', 'CRVUSDT', 'CAKEUSDT',
  
  // DeFi & L2
  'DYDXUSDT', '1INCHUSDT', 'LRCUSDT', 'ENSUSDT', 'JASMYUSDT', 'PEPEUSDT', 'BONKUSDT', 'FLOKIUSDT', 'ORDIUSDT', '1000SATSUSDT',
  'PYTHUSDT', 'JUPUSDT', 'MANTAUSDT', 'ALTUSDT', 'BEAMXUSDT', 'SEIUSDT', 'WOOUSDT', 'PENDLEUSDT', 'AGIXUSDT', 'FETUSDT',
  'OCEANUSDT', 'ANKRUSDT', 'ROSEUSDT', 'GLMRUSDT', 'ASTRUSDT', 'BTTUSDT', 'IOTXUSDT', 'CKBUSDT', 'WAVESUSDT', 'ZILUSDT',
  'RVNUSDT', 'HBARUSDT', 'STGUSDT', 'GMXUSDT', 'IDUSDT', 'MAGICUSDT', 'LUNCUSDT', 'USTCUSDT', 'BLURUSDT',
  
  // New Trending & Ecosystem Additions
  'WIFUSDT', 'BOMEUSDT', 'NOTUSDT', 'STRKUSDT', 'ENAUSDT', 'ONDOUSDT', 'ETHFIUSDT', 'WUSDT', 'ZROUSDT', 'ZKUSDT',
  'LISTAUSDT', 'IOUSDT', 'BBUSDT', 'TAOUSDT', 'PORTALUSDT', 'AXLUSDT', 'METISUSDT', 'DYMUSDT', 'RONINUSDT', 'PYTHUSDT',
  'ACEUSDT', 'JITOUSDT', 'AEVOUSDT', 'PIXELUSDT', 'SAGAUSDT', 'TNSRUSDT', 'OMNIUSDT', 'REZUSDT', 'NOTUSDT', 'ZKUSDT',
  'WUSDT', 'EIGENUSDT', 'TURBOUSDT', 'NEIROUSDT', 'CATIUSDT', 'HMSTRUSDT', 'SCRUSDT', 'PUPPIESUSDT', 'AAVEUSDT',
  
  // Additional Institutional/Utility
  'COMPUSDT', 'SUSHIUSDT', 'YFIUSDT', 'BALUSDT', 'KNCUSDT', 'ZRXUSDT', 'BATUSDT', 'ANKRUSDT', 'RENUSDT', 'KSMUSDT',
  'ICXUSDT', 'ONTUSDT', 'ZILUSDT', 'WAVESUSDT', 'QTUMUSDT', 'LSKUSDT', 'SCUSDT', 'DENTUSDT', 'HOTUSDT', 'NKNUSDT',
  'DATAUSDT', 'STMXUSDT', 'PERPUSDT', 'REEFUSDT', 'TRUUSDT', 'BADGERUSDT', 'ALICEUSDT', 'SUPERUSDT', 'DEGOUSDT',
  'PONDUSDT', 'LINAUSDT', 'PERPUSDT', 'TKOUSDT', 'PUNDIXUSDT', 'MIRUSDT', 'POLSUSDT', 'MDXUSDT', 'MASKUSDT', 'LPTUSDT'
];

export const BINANCE_REST_API = "https://api.binance.com/api/v3";
export const ENTRY_FEE = 5.00;
export const MAX_PRIZE_POOL = 50000;
export const BASELINE_NET_WORTH = 1000000;
