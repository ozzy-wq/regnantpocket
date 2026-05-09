import { AppShell } from '@/components/layout/app-shell';
import { ResponsiveDashboardLayout } from '@/components/dashboard/responsive-dashboard-layout';

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-3xl font-semibold">Professional Fintech Dashboard</h1>
        <p className="mt-1 text-white/60">TradingView + Stripe + Binance inspired demo workspace.</p>
      </div>
      <ResponsiveDashboardLayout />
    </AppShell>
  );
}
