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
