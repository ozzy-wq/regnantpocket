import { assets, traders } from '@/data/market';
import { calculateMarketScore, formatMoney } from '@/lib/trading';

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-soft backdrop-blur">
      <p className="text-sm text-white/50">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-white/40">{sub}</p>
    </div>
  );
}

function Pill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'green' | 'orange' | 'red' }) {
  const styles = {
    neutral: 'border-white/10 bg-white/5 text-white/70',
    green: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    orange: 'border-accent/20 bg-accent/10 text-accent',
    red: 'border-rose-400/20 bg-rose-400/10 text-rose-300'
  };
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
}

function MiniChart() {
  const points = '0,72 32,64 64,70 96,42 128,48 160,30 192,38 224,18 256,26 288,12 320,20';
  return (
    <svg viewBox="0 0 320 90" className="h-48 w-full overflow-visible">
      <defs>
        <linearGradient id="regnantLine" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`${points} 320,90 0,90`} fill="url(#regnantLine)" opacity="0.8" />
      <polyline points={points} fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="288" cy="12" r="5" fill="#f59e0b" />
    </svg>
  );
}

export default function HomePage() {
  const marketScore = calculateMarketScore(assets.map((asset) => asset.score));
  const bestAssets = assets.slice(0, 6);

  return (
    <main className="min-h-screen overflow-hidden bg-bg text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-12rem] top-[-12rem] h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute right-[-12rem] top-10 h-[34rem] w-[34rem] rounded-full bg-blue-700/20 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-bg/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-xl font-black tracking-[0.28em] text-gold">REGNANT X</p>
            <p className="text-xs text-white/40">AI crypto intelligence demo</p>
          </div>
          <nav className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-1 text-sm text-white/70 lg:flex">
            {['Dashboard', 'Markets', 'Signals', 'Copy', 'Wallet'].map((item) => (
              <a key={item} className="rounded-xl px-4 py-2 hover:bg-white/10 hover:text-white" href={`#${item.toLowerCase()}`}>{item}</a>
            ))}
          </nav>
          <a href="#dashboard" className="rounded-2xl bg-accent px-5 py-3 text-sm font-black text-black shadow-glow">Launch Demo</a>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[1.1fr_.9fr] lg:py-14">
        <div className="rounded-[2.25rem] border border-white/10 bg-gradient-to-br from-white/[0.09] to-white/[0.025] p-8 shadow-glow backdrop-blur">
          <div className="mb-5 flex flex-wrap gap-2">
            <Pill tone="orange">Demo-only platform</Pill>
            <Pill tone="green">Risk-controlled simulation</Pill>
            <Pill>Next.js + Tailwind</Pill>
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
            Premium AI market intelligence and demo trading ecosystem.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/60">
            RegnantX combines simulated market movement, AI-style scoring, smart alerts, watchlists and copy-trader mock flows in one premium fintech interface.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#dashboard" className="rounded-2xl bg-accent px-6 py-4 font-black text-black transition hover:bg-gold">Open Dashboard</a>
            <a href="#markets" className="rounded-2xl border border-white/15 px-6 py-4 font-bold text-white/80 transition hover:bg-white/10">View Markets</a>
          </div>
          <p className="mt-6 text-xs text-white/40">No real funds, deposits, withdrawals, custody, payment processing or live execution.</p>
        </div>

        <div id="dashboard" className="rounded-[2.25rem] border border-white/10 bg-card/70 p-5 shadow-soft backdrop-blur">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-white/50">Live-feel dashboard</p>
              <h2 className="text-2xl font-black">BTC/USDT</h2>
            </div>
            <Pill tone="orange">AI {assets[0].score}%</Pill>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
            <MiniChart />
            <div className="grid gap-3 md:grid-cols-2">
              <button className="rounded-2xl bg-emerald-500 px-5 py-4 font-black text-black">LONG</button>
              <button className="rounded-2xl bg-rose-500 px-5 py-4 font-black text-white">SHORT</button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Demo Balance" value={formatMoney(12500)} sub="Starting simulation balance" />
        <StatCard label="AI Confidence" value={`${marketScore}%`} sub="Average market score" />
        <StatCard label="Tracked Assets" value={`${assets.length}+`} sub="Crypto watchlist" />
        <StatCard label="Copy Traders" value={`${traders.length}`} sub="Mock strategy cards" />
      </section>

      <section id="markets" className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[1fr_.8fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-soft backdrop-blur">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-sm text-accent">Market Watchlist</p>
              <h2 className="text-3xl font-black">AI-ranked assets</h2>
            </div>
            <Pill>Tap-ready UI</Pill>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {bestAssets.map((asset) => (
              <div key={asset.symbol} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-black">{asset.symbol}</p>
                    <p className="text-sm text-white/45">{asset.name} · {asset.category}</p>
                  </div>
                  <Pill tone={asset.change >= 0 ? 'green' : 'red'}>{asset.change >= 0 ? '+' : ''}{asset.change}%</Pill>
                </div>
                <div className="mt-4 h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-accent" style={{ width: `${asset.score}%` }} />
                </div>
                <p className="mt-2 text-xs text-white/40">AI score {asset.score} · Volume {asset.volume}</p>
              </div>
            ))}
          </div>
        </div>

        <div id="signals" className="rounded-[2rem] border border-accent/20 bg-gradient-to-br from-accent/15 to-white/[0.035] p-6 shadow-glow backdrop-blur">
          <p className="text-sm text-accent">Regnant AI Signal</p>
          <h2 className="mt-2 text-3xl font-black">Bullish continuation probability detected.</h2>
          <p className="mt-4 text-sm leading-7 text-white/60">The demo engine combines sentiment-style scoring, market volume, simulated volatility and watchlist ranking to create a premium AI insights experience.</p>
          <div className="mt-6 space-y-3">
            {['Whale activity positive', 'News sentiment stable', 'Volatility breakout zone', 'Risk guard enabled'].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-3 text-sm">
                <span>{item}</span>
                <Pill tone="green">Active</Pill>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="copy" className="mx-auto max-w-7xl px-5 pb-10">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-soft backdrop-blur">
          <div className="mb-5">
            <p className="text-sm text-accent">Copy Trader Hub</p>
            <h2 className="text-3xl font-black">Mock strategy marketplace</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {traders.map((trader) => (
              <div key={trader.id} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xl font-black">{trader.name}</p>
                    <p className="text-sm text-white/45">{trader.style} · {trader.followers}</p>
                  </div>
                  <Pill tone={trader.risk === 'Low' ? 'green' : trader.risk === 'High' ? 'red' : 'orange'}>{trader.risk}</Pill>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-2xl bg-white/5 p-3"><p className="text-white/40">ROI</p><p className="font-black text-emerald-300">+{trader.roi}%</p></div>
                  <div className="rounded-2xl bg-white/5 p-3"><p className="text-white/40">Win</p><p className="font-black">{trader.win}%</p></div>
                  <div className="rounded-2xl bg-white/5 p-3"><p className="text-white/40">DD</p><p className="font-black text-rose-300">{trader.drawdown}%</p></div>
                </div>
                <button className="mt-5 w-full rounded-2xl bg-accent py-3 font-black text-black">Mock Copy</button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
