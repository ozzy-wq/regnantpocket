import { describe, expect, it } from 'vitest';
import { calculateMarketScore, calculatePnl, canOpenTrade, formatMoney } from '../lib/trading';

describe('trading utilities', () => {
  it('calculates average market score', () => {
    expect(calculateMarketScore([90, 80, 70])).toBe(80);
  });

  it('allows trade only when balance is enough and amount is positive', () => {
    expect(canOpenTrade(1000, 250)).toBe(true);
    expect(canOpenTrade(100, 250)).toBe(false);
    expect(canOpenTrade(1000, 0)).toBe(false);
  });

  it('calculates LONG pnl', () => {
    expect(calculatePnl(1000, 100, 110, 'LONG')).toBeCloseTo(800);
  });

  it('calculates SHORT pnl', () => {
    expect(calculatePnl(1000, 100, 90, 'SHORT')).toBeCloseTo(800);
  });

  it('formats money', () => {
    expect(formatMoney(12500)).toBe('$12,500.00');
  });
});
