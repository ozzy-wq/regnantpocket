export type Asset = {
  symbol: string;
  name: string;
  basePrice: number;
  change: number;
  score: number;
  signal: string;
  volume: string;
  category: string;
  volatility: number;
};

export type Trader = {
  id: string;
  name: string;
  roi: number;
  risk: 'Low' | 'Medium' | 'High';
  followers: string;
  win: number;
  drawdown: number;
  style: string;
  allocation: number;
};

export const STARTING_BALANCE = 12500;
export const DEFAULT_TRADE_AMOUNT = 250;
export const DEFAULT_DURATION = '1m';
export const DURATIONS = ['30s', '1m', '5m', '15m'] as const;
export const AMOUNT_PRESETS = [100, 250, 500, 1000];

export const assets: Asset[] = [
  { symbol: 'BTC', name: 'Bitcoin', basePrice: 68420, change: 2.84, score: 91, signal: 'Strong Buy', volume: '$42.8B', category: 'Store of Value', volatility: 0.0065 },
  { symbol: 'ETH', name: 'Ethereum', basePrice: 3740, change: 1.42, score: 84, signal: 'Buy', volume: '$18.1B', category: 'Layer 1', volatility: 0.008 },
  { symbol: 'SOL', name: 'Solana', basePrice: 168.2, change: -0.66, score: 72, signal: 'Watch', volume: '$4.2B', category: 'High Speed', volatility: 0.012 },
  { symbol: 'XRP', name: 'Ripple', basePrice: 0.62, change: 3.12, score: 78, signal: 'Buy', volume: '$2.9B', category: 'Payments', volatility: 0.01 },
  { symbol: 'BNB', name: 'BNB', basePrice: 612.4, change: 0.94, score: 80, signal: 'Buy', volume: '$1.7B', category: 'Exchange', volatility: 0.007 },
  { symbol: 'AVAX', name: 'Avalanche', basePrice: 38.6, change: -1.12, score: 69, signal: 'Neutral', volume: '$940M', category: 'Layer 1', volatility: 0.014 },
  { symbol: 'DOGE', name: 'Dogecoin', basePrice: 0.16, change: 4.1, score: 64, signal: 'Speculative', volume: '$1.2B', category: 'Meme', volatility: 0.018 },
  { symbol: 'LINK', name: 'Chainlink', basePrice: 17.4, change: 1.9, score: 76, signal: 'Watch', volume: '$780M', category: 'Oracle', volatility: 0.01 }
];

export const traders: Trader[] = [
  { id: 'atlas', name: 'Atlas Alpha', roi: 42.8, risk: 'Medium', followers: '12.4K', win: 74, drawdown: 8.2, style: 'Swing', allocation: 400 },
  { id: 'nova', name: 'Nova Scalper', roi: 31.6, risk: 'High', followers: '8.1K', win: 69, drawdown: 14.7, style: 'Scalp', allocation: 300 },
  { id: 'crown', name: 'Crown Quant', roi: 26.9, risk: 'Low', followers: '19.7K', win: 71, drawdown: 5.4, style: 'Quant', allocation: 250 }
];
