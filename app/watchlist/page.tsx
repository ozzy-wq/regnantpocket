import { AppShell } from '@/components/layout/app-shell';
import { MarketWatchlist } from '@/components/markets/market-watchlist';

export default function WatchlistPage() {
  return (
    <AppShell>
      <MarketWatchlist />
    </AppShell>
  );
}
