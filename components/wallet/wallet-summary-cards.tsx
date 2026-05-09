import { GlassCard } from '@/components/ui';

export function WalletSummaryCards() {
  const cards = [
    { label: 'Demo Wallet', value: '$125,000.00' },
    { label: 'Unrealized PnL', value: '+$2,840.42' },
    { label: 'Buying Power', value: '$98,221.16' }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <GlassCard key={card.label} className="animate-fade-in">
          <p className="text-sm text-white/60">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{card.value}</p>
        </GlassCard>
      ))}
    </div>
  );
}
