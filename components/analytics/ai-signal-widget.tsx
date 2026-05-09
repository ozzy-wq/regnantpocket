import { Badge, GlassCard, SectionTitle } from '@/components/ui';

export function AiSignalWidget() {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-orange-500/20 blur-2xl" />
      <SectionTitle title="AI Signal Engine" subtitle="Synthetic model output" />
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-white/75">BTC Momentum Composite</p>
        <Badge label="Bullish 78/100" trend="up" />
      </div>
      <p className="mt-3 text-sm text-white/60">Educational demo signal. Not investment advice, execution, or financial recommendation.</p>
    </GlassCard>
  );
}
