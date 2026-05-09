import { Nav } from '@/components/nav';
import { Card, Button } from '@/components/ui';
import { MARKET_SYMBOLS } from '@/data/mockMarkets';

export default function TradingPage() {
  return (
    <main>
      <Nav />
      <section className="mx-auto grid max-w-7xl gap-4 p-6 md:grid-cols-3">
        <Card className="md:col-span-2 p-6">
          <h1 className="text-2xl font-semibold">Trading Screen</h1>
          <p className="mb-4 text-white/70">Place simulated long/short paper orders.</p>
          {MARKET_SYMBOLS.map((symbol) => (
            <div key={symbol} className="mb-2 flex items-center justify-between rounded-xl border border-white/10 p-3">
              <span>{symbol}</span>
              <div className="flex gap-2"><Button className="bg-bullish text-white">LONG</Button><Button className="bg-bearish text-white">SHORT</Button></div>
            </div>
          ))}
        </Card>
        <Card className="p-6">
          <h2 className="mb-3 text-xl">Order Ticket</h2>
          <div className="space-y-2 text-sm text-white/70">
            <p>Mode: Demo Paper</p><p>Leverage: Virtual</p><p>Execution: Simulated</p>
          </div>
        </Card>
      </section>
    </main>
  );
}
