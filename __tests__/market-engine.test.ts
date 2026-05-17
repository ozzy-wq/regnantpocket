import { describe, expect, it } from 'vitest';
import { assets } from '../data/market';
import { buildPriceSeries, generateLiveAssets, getMarketMood, getPortfolioAllocation, getTopMovers } from '../lib/market-engine';

describe('market engine', () => {
  it('creates live assets', () => {
    const live = generateLiveAssets(assets, 3);
    expect(live.length).toBe(assets.length);
    expect(live[0].price).toBeGreaterThan(0);
  });

  it('creates chart data', () => {
    const chart = buildPriceSeries('BTC', 65000, 4);
    expect(chart.length).toBe(48);
    expect(chart[0].price).toBeGreaterThan(0);
  });

  it('returns top movers', () => {
    const live = generateLiveAssets(assets, 2);
    expect(getTopMovers(live, 3)).toHaveLength(3);
  });

  it('returns portfolio allocation', () => {
    const rows = getPortfolioAllocation([
      { symbol: 'BTC', amount: 100 },
      { symbol: 'ETH', amount: 100 },
      { symbol: 'BTC', amount: 100 }
    ]);

    expect(rows.find((x)=>x.symbol==='BTC')?.percentage).toBe(67);
  });

  it('returns market mood', () => {
    expect(getMarketMood(90).label).toContain('bullish');
  });
});