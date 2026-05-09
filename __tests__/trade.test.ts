import { describe, expect, it } from 'vitest';
import { calcEquity, calcPnl } from '@/lib/trade';

describe('trade logic', () => {
  it('calculates LONG pnl', () => {
    expect(calcPnl('LONG', 2, 100, 110)).toBe(20);
  });

  it('calculates SHORT pnl', () => {
    expect(calcPnl('SHORT', 2, 100, 90)).toBe(20);
  });

  it('calculates equity from positions', () => {
    expect(
      calcEquity(1000, [{ id: '1', symbol: 'BTCUSD', direction: 'LONG', qty: 1, entryPrice: 100, currentPrice: 125, openedAt: '' }])
    ).toBe(1025);
  });
});
