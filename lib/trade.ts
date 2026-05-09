import { Direction, Position } from '@/types/trading';

export const calcPnl = (direction: Direction, qty: number, entry: number, mark: number) => {
  const delta = direction === 'LONG' ? mark - entry : entry - mark;
  return Number((delta * qty).toFixed(2));
};

export const calcEquity = (balance: number, positions: Position[]) => {
  const unrealized = positions.reduce(
    (sum, p) => sum + calcPnl(p.direction, p.qty, p.entryPrice, p.currentPrice),
    0
  );
  return Number((balance + unrealized).toFixed(2));
};
