import { Badge, GlassCard, SectionTitle } from '@/components/ui';

const rows = [
  ['BTC/USDT', '104,612.44', '+1.45%'],
  ['ETH/USDT', '4,882.90', '-0.28%'],
  ['SOL/USDT', '242.71', '+2.21%'],
  ['BNB/USDT', '984.10', '+0.19%']
] as const;

export function MarketWatchlist() {
  return (
    <GlassCard>
      <SectionTitle title="Market Watchlist" subtitle="Live-style demo feed" />
      <div className="mt-3 space-y-2">
        {rows.map(([symbol, price, change]) => (
          <div key={symbol} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 p-3">
            <div><p className="font-medium">{symbol}</p><p className="text-sm text-white/60">${price}</p></div>
            <Badge label={change} trend={change.startsWith('+') ? 'up' : 'down'} />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
