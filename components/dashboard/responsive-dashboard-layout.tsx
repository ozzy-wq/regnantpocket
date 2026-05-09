import { AiSignalWidget } from '@/components/analytics/ai-signal-widget';
import { StrategyCard } from '@/components/copy-trading/strategy-card';
import { MarketWatchlist } from '@/components/markets/market-watchlist';
import { TradingPanel } from '@/components/trading/trading-panel';
import { WalletSummaryCards } from '@/components/wallet/wallet-summary-cards';

export function ResponsiveDashboardLayout() {
  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      <WalletSummaryCards />
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <TradingPanel />
        <AiSignalWidget />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <MarketWatchlist />
        <StrategyCard />
      </div>
    </div>
  );
}
