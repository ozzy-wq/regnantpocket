import Link from 'next/link';
import { Nav } from '@/components/nav';
import { Card } from '@/components/ui';

export default function HomePage() {
  return (
    <main>
      <Nav />
      <section className="mx-auto grid max-w-7xl gap-6 p-6 md:grid-cols-3">
        <Card className="md:col-span-2 p-10 animate-float">
          <p className="mb-3 text-accent">Premium Demo Trading Platform</p>
          <h1 className="mb-4 text-5xl font-bold">RegnantX</h1>
          <p className="mb-6 text-white/70">Ultra premium fintech experience for simulated crypto trading, analytics, copy strategies, and paper portfolio workflows.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/onboarding" className="rounded-xl bg-accent px-4 py-2 font-semibold text-black">Launch Demo</Link>
            <Link href="/dashboard" className="rounded-xl border border-white/20 px-4 py-2">View Dashboard</Link>
          </div>
          <p className="mt-6 text-xs text-white/60">Demo-only. No real trading, real funds, deposits, withdrawals, custody, or payment systems.</p>
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Platform Modules</h2>
          <ul className="space-y-2 text-sm text-white/75">
            {['Dashboard', 'Trading', 'Watchlist', 'Wallet', 'Open Positions', 'Trade History', 'Copy Trading', 'Settings'].map((m) => <li key={m}>• {m}</li>)}
          </ul>
        </Card>
      </section>
    </main>
  );
}
