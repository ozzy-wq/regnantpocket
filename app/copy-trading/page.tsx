import { Nav } from '@/components/nav';
import { Card, Button } from '@/components/ui';

export default function CopyTradingPage() {
  return (
    <main>
      <Nav />
      <section className="mx-auto grid max-w-6xl gap-4 p-6 md:grid-cols-3">
        {['Orion Alpha', 'Nexus Momentum', 'Atlas Swing'].map((strategy, i) => (
          <Card className="p-6" key={strategy}>
            <h2 className="text-lg font-semibold">{strategy}</h2>
            <p className="mt-2 text-sm text-white/70">30D Demo Return: <span className={i===1?'text-bearish':'text-bullish'}>{i===1?'-':'+'}{(10+i*3).toFixed(1)}%</span></p>
            <Button className="mt-4 w-full">Copy Demo Strategy</Button>
          </Card>
        ))}
      </section>
    </main>
  );
}
