import { AppShell } from '@/components/layout/app-shell';
import { TradingTerminal } from '@/components/trading/trading-terminal';

export default function TradingPage() {
  return (
    <AppShell>
      <TradingTerminal />
    </AppShell>
  );
}
