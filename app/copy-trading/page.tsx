import { AppShell } from '@/components/layout/app-shell';
import { StrategyCard } from '@/components/copy-trading/strategy-card';

export default function CopyTradingPage() {
  return (
    <AppShell>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StrategyCard />
        <StrategyCard />
        <StrategyCard />
      </div>
    </AppShell>
  );
}
