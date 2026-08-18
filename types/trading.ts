export type Direction = 'LONG' | 'SHORT';

export interface Position {
  id: string;
  symbol: string;
  direction: Direction;
  qty: number;
  entryPrice: number;
  currentPrice: number;
  openedAt: string;
}

export interface TradeRecord extends Position {
  closedAt: string;
  pnl: number;
}

export interface Wallet {
  balance: number;
  equity: number;
}

export type TradeDirection = 'up' | 'down';
export type TradeStatus = 'open' | 'won' | 'lost' | 'draw' | 'cancelled';

export interface Instrument {
  symbol: string;
  name: string;
  category: 'forex' | 'crypto' | 'commodity' | 'index';
  price: number;
  payoutPercent: number;
  changePercent: number;
}

export interface DemoTrade {
  id: string;
  symbol: string;
  direction: TradeDirection;
  stake: number;
  entryPrice: number;
  payoutPercent: number;
  openedAt: string;
  expiresAt: string;
  status: TradeStatus;
  settlementPrice?: number | null;
  settledAt?: string | null;
}

export interface QuotePoint {
  time: number;
  price: number;
}

export interface DemoWallet {
  balance: number;
  equity: number;
  currency: 'RP';
  monetaryValue: false;
}
