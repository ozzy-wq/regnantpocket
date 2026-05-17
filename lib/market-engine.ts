import type { Asset } from '@/data/market';

export type LiveAsset = Asset & {
  price: number;
  liveChange: number;
};

export type AllocationInput = {
  symbol: string;
  amount: number;
};

export type AllocationRow = {
  symbol: string;
  amount: number;
  percentage: number;
};

export function generateLiveAssets(assets: Asset[], tick: number): LiveAsset[] {
  return assets.map((asset, index) => {
    const drift = Math.sin((tick + index * 3) / 5) * asset.volatility + Math.cos((tick + index) / 7) * asset.volatility * 0.6;
    const price = Math.max(0.0001, asset.basePrice * (1 + drift));
    return { ...asset, price, liveChange: asset.change + drift * 100 };
  });
}

export function buildPriceSeries(symbol: string, price: number, tick: number) {
  return Array.from({ length: 48 }, (_, index) => {
    const wave = Math.sin((index + tick) / 4) * 0.011;
    const micro = Math.cos((index + symbol.length * 7 + tick) / 2.7) * 0.006;
    const trend = (index - 24) * 0.0006;
    return {
      t: index,
      price: Math.max(0.0001, price * (1 + wave + micro + trend)),
      volume: 26 + Math.abs(Math.sin((index + tick) / 3)) * 80
    };
  });
}

export function getTopMovers(assets: LiveAsset[], limit = 4) {
  return [...assets]
    .sort((a, b) => Math.abs(b.liveChange) - Math.abs(a.liveChange))
    .slice(0, limit);
}

export function getPortfolioAllocation(positions: AllocationInput[]): AllocationRow[] {
  const totals = positions.reduce<Record<string, number>>((acc, position) => {
    acc[position.symbol] = (acc[position.symbol] || 0) + position.amount;
    return acc;
  }, {});

  const totalAmount = Object.values(totals).reduce((sum, value) => sum + value, 0);

  if (totalAmount <= 0) return [];

  return Object.entries(totals).map(([symbol, amount]) => ({
    symbol,
    amount,
    percentage: Math.round((amount / totalAmount) * 100)
  }));
}

export function getMarketMood(score: number) {
  if (score >= 85) return { label: 'Strong bullish', tone: 'green' as const };
  if (score >= 75) return { label: 'Constructive', tone: 'orange' as const };
  if (score >= 65) return { label: 'Neutral-watch', tone: 'blue' as const };
  return { label: 'Risk-off', tone: 'red' as const };
}
