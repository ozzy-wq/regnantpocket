'use client';

import { useMemo, useState } from 'react';
import type { DemoTrade, Instrument, QuotePoint, TradeDirection } from '@/types/trading';

const instruments: Instrument[] = [
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', category: 'forex', price: 1.08742, payoutPercent: 87, changePercent: 0.18 },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', category: 'forex', price: 1.27861, payoutPercent: 84, changePercent: -0.09 },
  { symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', category: 'crypto', price: 115240.2, payoutPercent: 82, changePercent: 1.34 },
  { symbol: 'ETH/USD', name: 'Ethereum / US Dollar', category: 'crypto', price: 4218.4, payoutPercent: 80, changePercent: 0.72 },
  { symbol: 'XAU/USD', name: 'Gold / US Dollar', category: 'commodity', price: 3358.18, payoutPercent: 78, changePercent: 0.22 },
];

function buildSeries(base: number): QuotePoint[] {
  return Array.from({ length: 48 }, (_, index) => {
    const wave = Math.sin(index / 4.2) * base * 0.0015;
    const drift = index * base * 0.000035;
    return { time: Date.now() - (47 - index) * 5000, price: base + wave + drift };
  });
}

function MiniChart({ points }: { points: QuotePoint[] }) {
  const path = useMemo(() => {
    const prices = points.map((point) => point.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = Math.max(max - min, 0.000001);
    return points
      .map((point, index) => {
        const x = (index / (points.length - 1)) * 100;
        const y = 88 - ((point.price - min) / range) * 72;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [points]);

  return (
    <div className="relative h-[360px] overflow-hidden rounded-2xl border border-white/10 bg-[#070b14]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Demo price chart">
        <defs>
          <linearGradient id="regnantFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L 100 100 L 0 100 Z`} fill="url(#regnantFill)" />
        <path d={path} fill="none" stroke="#4ade80" strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="absolute bottom-3 left-4 rounded-lg border border-white/10 bg-black/50 px-3 py-1 text-xs text-white/55 backdrop-blur">Synthetic demo feed</div>
    </div>
  );
}

function formatPrice(instrument: Instrument) {
  return instrument.price >= 100 ? instrument.price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : instrument.price.toFixed(5);
}

export function TradingTerminal() {
  const [activeSymbol, setActiveSymbol] = useState(instruments[0].symbol);
  const [stake, setStake] = useState(10);
  const [expirySeconds, setExpirySeconds] = useState(60);
  const [balance, setBalance] = useState(10000);
  const [openTrades, setOpenTrades] = useState<DemoTrade[]>([]);

  const active = instruments.find((item) => item.symbol === activeSymbol) ?? instruments[0];
  const points = useMemo(() => buildSeries(active.price), [active.symbol, active.price]);
  const expectedReturn = stake * (1 + active.payoutPercent / 100);

  function placeTrade(direction: TradeDirection) {
    if (!Number.isFinite(stake) || stake <= 0 || stake > balance) return;
    const now = Date.now();
    const trade: DemoTrade = {
      id: crypto.randomUUID(),
      symbol: active.symbol,
      direction,
      stake,
      entryPrice: active.price,
      payoutPercent: active.payoutPercent,
      openedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + expirySeconds * 1000).toISOString(),
      status: 'open',
    };
    setBalance((value) => value - stake);
    setOpenTrades((trades) => [trade, ...trades]);
  }

  return (
    <section className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {instruments.map((instrument) => (
          <button
            key={instrument.symbol}
            onClick={() => setActiveSymbol(instrument.symbol)}
            className={`min-w-[150px] rounded-xl border px-3 py-2 text-left transition ${activeSymbol === instrument.symbol ? 'border-emerald-400/60 bg-emerald-400/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-white">{instrument.symbol}</span>
              <span className="text-xs text-emerald-300">{instrument.payoutPercent}%</span>
            </div>
            <p className="mt-1 text-xs text-white/50">{formatPrice(instrument)}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/40">{active.name}</p>
                <div className="mt-1 flex items-baseline gap-3">
                  <h1 className="text-2xl font-semibold text-white">{formatPrice(active)}</h1>
                  <span className={active.changePercent >= 0 ? 'text-sm text-emerald-300' : 'text-sm text-rose-300'}>{active.changePercent >= 0 ? '+' : ''}{active.changePercent}%</span>
                </div>
              </div>
              <div className="text-right"><p className="text-xs text-white/45">Demo balance</p><p className="text-lg font-semibold text-white">${balance.toFixed(2)}</p></div>
            </div>
            <MiniChart points={points} />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-center justify-between"><h2 className="font-semibold">Open demo trades</h2><span className="text-xs text-white/45">{openTrades.length} active</span></div>
            <div className="mt-3 space-y-2">
              {openTrades.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-white/45">No open trades yet.</p> : openTrades.map((trade) => (
                <div key={trade.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border border-white/8 bg-black/20 p-3 text-sm">
                  <div><p className="font-medium">{trade.symbol}</p><p className="text-xs text-white/45">Entry {trade.entryPrice}</p></div>
                  <span className={trade.direction === 'up' ? 'text-emerald-300' : 'text-rose-300'}>{trade.direction.toUpperCase()}</span>
                  <span className="text-white/65">${trade.stake.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-white/10 bg-[#0b101b] p-4 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between border-b border-white/8 pb-4"><div><p className="text-xs uppercase tracking-[0.18em] text-white/40">Quick trade</p><p className="mt-1 font-semibold">{active.symbol}</p></div><span className="rounded-lg bg-emerald-400/10 px-2.5 py-1 text-sm font-semibold text-emerald-300">{active.payoutPercent}%</span></div>

          <label className="mt-5 block text-xs font-medium uppercase tracking-wider text-white/45">Amount</label>
          <div className="mt-2 flex items-center rounded-xl border border-white/10 bg-black/25 px-3"><span className="text-white/45">$</span><input aria-label="Trade amount" type="number" min={1} max={balance} value={stake} onChange={(event) => setStake(Number(event.target.value))} className="w-full bg-transparent px-2 py-3 text-right text-lg font-semibold outline-none" /></div>

          <label className="mt-4 block text-xs font-medium uppercase tracking-wider text-white/45">Expiry</label>
          <div className="mt-2 grid grid-cols-3 gap-2">{[30, 60, 120].map((seconds) => <button key={seconds} onClick={() => setExpirySeconds(seconds)} className={`rounded-xl border py-2 text-sm ${expirySeconds === seconds ? 'border-white/25 bg-white/10 text-white' : 'border-white/8 bg-white/[0.03] text-white/55'}`}>{seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}</button>)}</div>

          <div className="mt-5 rounded-xl border border-white/8 bg-black/20 p-3"><div className="flex justify-between text-sm"><span className="text-white/45">Expected return</span><span className="font-semibold text-white">${expectedReturn.toFixed(2)}</span></div><div className="mt-2 flex justify-between text-xs"><span className="text-white/35">Potential profit</span><span className="text-emerald-300">+${(expectedReturn - stake).toFixed(2)}</span></div></div>

          <div className="mt-5 grid gap-2"><button onClick={() => placeTrade('up')} className="rounded-xl bg-emerald-500 px-4 py-3.5 font-semibold text-[#06110a] transition hover:bg-emerald-400 active:scale-[0.99]">UP</button><button onClick={() => placeTrade('down')} className="rounded-xl bg-rose-500 px-4 py-3.5 font-semibold text-white transition hover:bg-rose-400 active:scale-[0.99]">DOWN</button></div>
          <p className="mt-4 text-center text-[11px] leading-5 text-white/35">Simulation only. No real money, brokerage execution, or financial advice.</p>
        </aside>
      </div>
    </section>
  );
}
