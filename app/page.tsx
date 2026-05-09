import Link from 'next/link';
import { Nav } from '@/components/nav';
import { Card } from '@/components/ui';

export default function HomePage() {
  return (
    <main>
      <Nav />
      <section className="max-w-6xl mx-auto p-6 md:p-10">
        <Card className="p-10 text-center">
          <p className="text-accent mb-3">Premium Demo Trading Experience</p>
          <h1 className="text-4xl font-bold mb-4">RegnantX</h1>
          <p className="text-white/70 mb-6">Demo-only trading simulator with onboarding, dashboard analytics, and local persistence.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/onboarding" className="rounded-xl bg-accent text-black px-4 py-2 font-semibold">Start Demo</Link>
            <Link href="/dashboard" className="rounded-xl border border-white/20 px-4 py-2">Open Dashboard</Link>
          </div>
        </Card>
      </section>
    </main>
  );
}
