import { Nav } from '@/components/nav';
import { Card } from '@/components/ui';
import { MARKET_SYMBOLS } from '@/data/mockMarkets';

export default function WatchlistPage() {
  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-4xl p-6">
        <Card className="p-6">
          <h1 className="mb-4 text-2xl font-semibold">Market Watchlist</h1>
          <div className="space-y-2">
            {MARKET_SYMBOLS.map((s, i) => <div className="flex justify-between border-b border-white/10 py-2" key={s}><span>{s}</span><span className={i % 2 ? 'text-bearish' : 'text-bullish'}>{i%2?'-':'+'}{(Math.random()*3).toFixed(2)}%</span></div>)}
          </div>
        </Card>
      </section>
    </main>
  );
}
