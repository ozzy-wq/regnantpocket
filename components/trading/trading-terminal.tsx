'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DemoTrade, Instrument, QuotePoint, TradeDirection } from '@/types/trading';

function MiniChart({ points }: { points: QuotePoint[] }) {
  const path = useMemo(() => {
    if (points.length < 2) return '';
    const prices = points.map((point) => point.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = Math.max(max - min, 0.000001);
    return points.map((point, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 88 - ((point.price - min) / range) * 72;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [points]);

  return (
    <div className="relative h-[360px] overflow-hidden rounded-2xl border border-white/10 bg-[#070b14]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:44px_44px]" />
      {path ? (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Demo price chart">
          <defs><linearGradient id="regnantFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity="0.28" /><stop offset="100%" stopColor="#22c55e" stopOpacity="0" /></linearGradient></defs>
          <path d={`${path} L 100 100 L 0 100 Z`} fill="url(#regnantFill)" />
          <path d={path} fill="none" stroke="#4ade80" strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
        </svg>
      ) : null}
      <div className="absolute bottom-3 left-4 rounded-lg border border-white/10 bg-black/50 px-3 py-1 text-xs text-white/55 backdrop-blur">Deterministic demo feed</div>
    </div>
  );
}

function formatPrice(instrument: Instrument) {
  return instrument.price >= 100 ? instrument.price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : instrument.price.toFixed(5);
}

export function TradingTerminal() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [activeSymbol, setActiveSymbol] = useState('EUR/USD');
  const [points, setPoints] = useState<QuotePoint[]>([]);
  const [stake, setStake] = useState(10);
  const [expirySeconds, setExpirySeconds] = useState(60);
  const [balance, setBalance] = useState(0);
  const [openTrades, setOpenTrades] = useState<DemoTrade[]>([]);
  const [recentTrades, setRecentTrades] = useState<DemoTrade[]>([]);
  const [authRequired, setAuthRequired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = instruments.find((item) => item.symbol === activeSymbol) ?? instruments[0];
  const expectedReturn = active ? stake * (1 + active.payoutPercent / 100) : stake;

  async function refreshPortfolio() {
    const response = await fetch('/api/trades', { cache: 'no-store' });
    if (response.status === 401) {
      setAuthRequired(true);
      return;
    }
    if (!response.ok) throw new Error('Portfolio could not be loaded.');
    const data = await response.json();
    setBalance(data.balance);
    setOpenTrades(data.openTrades);
    setRecentTrades(data.recentTrades);
    setAuthRequired(false);
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/markets', { cache: 'no-store' }).then((response) => response.json()),
      refreshPortfolio().catch(() => undefined)
    ]).then(([marketData]) => {
      if (!cancelled && Array.isArray(marketData.instruments)) setInstruments(marketData.instruments);
    }).catch(() => setError('Terminal data could not be loaded.'));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!activeSymbol) return;
    let cancelled = false;
    const loadQuote = async () => {
      try {
        const response = await fetch(`/api/quotes?symbol=${encodeURIComponent(activeSymbol)}&points=80`, { cache: 'no-store' });
        const data = await response.json();
        if (cancelled) return;
        setPoints(data.points ?? []);
        setInstruments((items) => items.map((item) => item.symbol === activeSymbol ? { ...item, price: data.price } : item));
      } catch {
        if (!cancelled) setError('Quote feed temporarily unavailable.');
      }
    };
    loadQuote();
    const timer = window.setInterval(loadQuote, 2000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [activeSymbol]);

  useEffect(() => {
    if (authRequired) return;
    const timer = window.setInterval(() => refreshPortfolio().catch(() => undefined), 3000);
    return () => window.clearInterval(timer);
  }, [authRequired]);

  async function placeTrade(direction: TradeDirection) {
    if (!active || busy || authRequired || stake < 1 || stake > balance) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          symbol: active.symbol,
          direction,
          stake,
          expirySeconds,
          idempotencyKey: crypto.randomUUID()
        })
      });
      const data = await response.json();
      if (response.status === 401) {
        setAuthRequired(true);
        return;
      }
      if (!response.ok) throw new Error(data.error || 'Trade could not be opened.');
      setBalance(data.balance);
      setOpenTrades((trades) => [data.trade, ...trades]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Trade could not be opened.');
    } finally {
      setBusy(false);
    }
  }

  if (!active) {
    return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center text-white/55">Loading demo markets…</div>;
  }

  return (
    <section className="space-y-4">
      {authRequired ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100"><span>Sign in to use your persistent demo balance and place simulated trades.</span><div className="flex gap-2"><a className="rounded-lg bg-white/10 px-3 py-1.5" href="/login">Sign in</a><a className="rounded-lg bg-emerald-400 px-3 py-1.5 font-semibold text-black" href="/register">Create account</a></div></div> : null}
      {error ? <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {instruments.map((instrument) => <button key={instrument.symbol} onClick={() => setActiveSymbol(instrument.symbol)} className={`min-w-[150px] rounded-xl border px-3 py-2 text-left transition ${activeSymbol === instrument.symbol ? 'border-emerald-400/60 bg-emerald-400/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-white">{instrument.symbol}</span><span className="text-xs text-emerald-300">{instrument.payoutPercent}%</span></div><p className="mt-1 text-xs text-white/50">{formatPrice(instrument)}</p></button>)}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.22em] text-white/40">{active.name}</p><h1 className="mt-1 text-2xl font-semibold text-white">{formatPrice(active)}</h1></div><div className="text-right"><p className="text-xs text-white/45">Demo credits</p><p className="text-lg font-semibold text-white">{balance.toFixed(2)} RP</p></div></div>
            <MiniChart points={points} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TradeList title="Open demo trades" trades={openTrades} empty="No open trades yet." />
            <TradeList title="Recent results" trades={recentTrades.slice(0, 8)} empty="No settled trades yet." />
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-white/10 bg-[#0b101b] p-4 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between border-b border-white/8 pb-4"><div><p className="text-xs uppercase tracking-[0.18em] text-white/40">Quick trade</p><p className="mt-1 font-semibold">{active.symbol}</p></div><span className="rounded-lg bg-emerald-400/10 px-2.5 py-1 text-sm font-semibold text-emerald-300">{active.payoutPercent}%</span></div>
          <label className="mt-5 block text-xs font-medium uppercase tracking-wider text-white/45">Amount</label><div className="mt-2 flex items-center rounded-xl border border-white/10 bg-black/25 px-3"><span className="text-white/45">RP</span><input aria-label="Trade amount" type="number" min={1} max={Math.max(balance, 1)} value={stake} onChange={(event) => setStake(Number(event.target.value))} className="w-full bg-transparent px-2 py-3 text-right text-lg font-semibold outline-none" /></div>
          <label className="mt-4 block text-xs font-medium uppercase tracking-wider text-white/45">Expiry</label><div className="mt-2 grid grid-cols-4 gap-2">{[30, 60, 120, 300].map((seconds) => <button key={seconds} onClick={() => setExpirySeconds(seconds)} className={`rounded-xl border py-2 text-xs ${expirySeconds === seconds ? 'border-white/25 bg-white/10 text-white' : 'border-white/8 bg-white/[0.03] text-white/55'}`}>{seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}</button>)}</div>
          <div className="mt-5 rounded-xl border border-white/8 bg-black/20 p-3"><div className="flex justify-between text-sm"><span className="text-white/45">Expected return</span><span className="font-semibold text-white">{expectedReturn.toFixed(2)} RP</span></div><div className="mt-2 flex justify-between text-xs"><span className="text-white/35">Potential profit</span><span className="text-emerald-300">+{Math.max(expectedReturn - stake, 0).toFixed(2)} RP</span></div></div>
          <div className="mt-5 grid gap-2"><button disabled={busy || authRequired} onClick={() => placeTrade('up')} className="rounded-xl bg-emerald-500 px-4 py-3.5 font-semibold text-[#06110a] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40">{busy ? 'Submitting…' : 'UP'}</button><button disabled={busy || authRequired} onClick={() => placeTrade('down')} className="rounded-xl bg-rose-500 px-4 py-3.5 font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-40">DOWN</button></div>
          <p className="mt-4 text-center text-[11px] leading-5 text-white/35">Simulation only. RP credits have no monetary value. No brokerage execution or financial advice.</p>
        </aside>
      </div>
    </section>
  );
}

function TradeList({ title, trades, empty }: { title: string; trades: DemoTrade[]; empty: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="flex items-center justify-between"><h2 className="font-semibold">{title}</h2><span className="text-xs text-white/45">{trades.length}</span></div><div className="mt-3 space-y-2">{trades.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-white/45">{empty}</p> : trades.map((trade) => <div key={trade.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border border-white/8 bg-black/20 p-3 text-sm"><div><p className="font-medium">{trade.symbol}</p><p className="text-xs text-white/45">Entry {trade.entryPrice}</p></div><span className={trade.direction === 'up' ? 'text-emerald-300' : 'text-rose-300'}>{trade.status === 'open' ? trade.direction.toUpperCase() : trade.status.toUpperCase()}</span><span className="text-white/65">{trade.stake.toFixed(2)} RP</span></div>)}</div></div>;
}
