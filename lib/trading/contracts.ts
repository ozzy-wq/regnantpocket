import type { DemoTrade, Instrument, QuotePoint, TradeDirection } from '@/types/trading';

export interface MarketSnapshotResponse {
  instruments: Instrument[];
  serverTime: string;
}

export interface QuoteHistoryResponse {
  symbol: string;
  points: QuotePoint[];
  serverTime: string;
}

export interface OpenTradeRequest {
  symbol: string;
  direction: TradeDirection;
  stake: number;
  expirySeconds: number;
  idempotencyKey: string;
}

export interface OpenTradeResponse {
  trade: DemoTrade;
  balance: number;
}

export interface DemoPortfolioResponse {
  balance: number;
  openTrades: DemoTrade[];
  recentTrades: DemoTrade[];
}
