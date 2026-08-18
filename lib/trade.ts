import type { LegacyDirection, LegacyPosition } from '@/types/legacy-trading';

/**
 * Legacy LONG/SHORT portfolio math retained for the original dashboard tests.
 * The current Regnant Pocket terminal does not use this execution model.
 */
export const calcPnl = (direction: LegacyDirection, qty: number, entry: number, mark: number) => {
  const delta = direction === 'LONG' ? mark - entry : entry - mark;
  return Number((delta * qty).toFixed(2));
};

export const calcEquity = (balance: number, positions: LegacyPosition[]) => {
  const unrealized = positions.reduce(
    (sum, position) => sum + calcPnl(position.direction, position.qty, position.entryPrice, position.currentPrice),
    0
  );
  return Number((balance + unrealized).toFixed(2));
};
