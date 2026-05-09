import { AppShell } from '@/components/layout/app-shell';
import { TradingPanel } from '@/components/trading/trading-panel';
import { MarketWatchlist } from '@/components/markets/market-watchlist';

export default function TradingPage() {
  return (
    <AppShell>
      <div className="grid gap-5 xl:grid-cols-2">
        <TradingPanel />
        <MarketWatchlist />
      </div>
    </AppShell>
  );
}
