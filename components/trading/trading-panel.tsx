import { Button, GlassCard, SectionTitle } from '@/components/ui';

export function TradingPanel() {
  return (
    <GlassCard>
      <SectionTitle title="Trading Panel" subtitle="Demo execution only" />
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input className="rounded-xl border border-white/10 bg-black/30 p-3" placeholder="Symbol (e.g. BTC/USDT)" />
        <input className="rounded-xl border border-white/10 bg-black/30 p-3" placeholder="Order size" />
        <select className="rounded-xl border border-white/10 bg-black/30 p-3 md:col-span-2"><option>Market</option><option>Limit</option></select>
        <div className="md:col-span-2 flex gap-3"><Button className="flex-1">Long</Button><Button className="flex-1 bg-white/10 text-white">Short</Button></div>
      </div>
    </GlassCard>
  );
}
