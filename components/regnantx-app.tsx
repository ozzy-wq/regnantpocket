'use client';

import { useEffect, useMemo, useState } from 'react';
import { AMOUNT_PRESETS, DEFAULT_TRADE_AMOUNT, DEFAULT_DURATION, DURATIONS, STARTING_BALANCE, assets as baseAssets, traders } from '@/data/market';
import { calculateMarketScore, calculatePnl, canOpenTrade, formatMoney } from '@/lib/trading';

type Side = 'LONG' | 'SHORT';
type RiskMode = 'Conservative' | 'Balanced' | 'Aggressive';
type Position = {
  id: string;
  symbol: string;
  pair: string;
  side: Side;
  amount: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  duration: string;
  source: string;
  confidence: number;
  openedAt: string;
};

type Alert = { id: string; text: string; active: boolean };
type Screen = 'trade' | 'markets' | 'copy' | 'wallet' | 'history' | 'settings';
const STORAGE_KEY = 'regnantx-demo-v1';

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function priceFormat(value: number) {
  const decimals = value >= 100 ? 2 : value >= 1 ? 3 : 4;
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

function Pill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'green' | 'orange' | 'red' | 'blue' }) {
  const tones = {
    neutral: 'border-white/10 bg-white/5 text-white/65',
    green: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    orange: 'border-accent/20 bg-accent/10 text-accent',
    red: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
    blue: 'border-sky-400/20 bg-sky-400/10 text-sky-300'
  };
  return <span className={cn('rounded-full border px-3 py-1 text-xs font-semibold', tones[tone])}>{children}</span>;
}

function StatCard({ label, value, sub, tone = 'white' }: { label: string; value: string; sub: string; tone?: 'white' | 'green' | 'red' | 'orange' }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/[0.065]">
      <p className="text-sm text-white/45">{label}</p>
      <p className={cn('mt-2 text-3xl font-black', tone === 'green' && 'text-emerald-300', tone === 'red' && 'text-rose-300', tone === 'orange' && 'text-accent', tone === 'white' && 'text-white')}>{value}</p>
      <p className="mt-1 text-xs text-white/35">{sub}</p>
    </div>
  );
}

function MiniChart({ positive = true }: { positive?: boolean }) {
  const points = positive ? '0,72 32,64 64,70 96,42 128,48 160,30 192,38 224,18 256,26 288,12 320,20' : '0,24 32,30 64,26 96,40 128,36 160,55 192,50 224,63 256,58 288,72 320,66';
  return (
    <svg viewBox="0 0 320 90" className="h-48 w-full overflow-visible">
      <defs>
        <linearGradient id="regnantLine" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={positive ? '#f59e0b' : '#f43f5e'} stopOpacity="0.45" />
          <stop offset="100%" stopColor={positive ? '#f59e0b' : '#f43f5e'} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`${points} 320,90 0,90`} fill="url(#regnantLine)" opacity="0.8" />
      <polyline points={points} fill="none" stroke={positive ? '#f59e0b' : '#f43f5e'} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RegnantXApp() {
  const [screen, setScreen] = useState<Screen>('trade');
  const [tick, setTick] = useState(1);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [amount, setAmount] = useState(DEFAULT_TRADE_AMOUNT);
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [riskMode, setRiskMode] = useState<RiskMode>('Balanced');
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<Position[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: 'btc-breakout', text: 'BTC breaks $69,000', active: true },
    { id: 'eth-volume', text: 'ETH volume expansion', active: true },
    { id: 'risk-guard', text: 'Risk guard enabled', active: true }
  ]);
  const [toast, setToast] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<{ balance: number; riskMode: RiskMode; positions: Position[]; history: Position[]; alerts: Alert[] }>;
        if (typeof parsed.balance === 'number') setBalance(parsed.balance);
        if (parsed.riskMode) setRiskMode(parsed.riskMode);
        if (Array.isArray(parsed.positions)) setPositions(parsed.positions);
        if (Array.isArray(parsed.history)) setHistory(parsed.history);
        if (Array.isArray(parsed.alerts)) setAlerts(parsed.alerts);
      }
    } catch {
      // Ignore corrupted local demo state.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTick((value) => value + 1), 1500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ balance, riskMode, positions, history, alerts }));
  }, [hydrated, balance, riskMode, positions, history, alerts]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const assets = useMemo(() => {
    return baseAssets.map((asset, index) => {
      const drift = Math.sin((tick + index * 3) / 5) * asset.volatility + Math.cos((tick + index) / 7) * asset.volatility * 0.6;
      const price = Math.max(0.0001, asset.basePrice * (1 + drift));
      return { ...asset, price, liveChange: asset.change + drift * 100 };
    });
  }, [tick]);

  const selectedAsset = assets.find((asset) => asset.symbol === selectedSymbol) || assets[0];
  const marketScore = calculateMarketScore(assets.map((asset) => asset.score));
  const maxTrade = riskMode === 'Conservative' ? 500 : riskMode === 'Aggressive' ? 2500 : 1000;

  const livePositions = useMemo(() => {
    return positions.map((position) => {
      const asset = assets.find((item) => item.symbol === position.symbol);
      if (!asset) return position;
      return { ...position, currentPrice: asset.price, pnl: calculatePnl(position.amount, position.entryPrice, asset.price, position.side) };
    });
  }, [assets, positions]);

  const openPnl = livePositions.reduce((sum, position) => sum + position.pnl, 0);
  const equity = balance + openPnl;
  const ready = canOpenTrade(balance, amount) && amount <= maxTrade;

  function openTrade(side: Side, customAmount = amount, source = 'Manual') {
    if (!canOpenTrade(balance, customAmount)) return setToast('Demo balance is not enough.');
    if (customAmount > maxTrade) return setToast(`${riskMode} mode allows max ${formatMoney(maxTrade)} per trade.`);
    const next: Position = {
      id: `${selectedAsset.symbol}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      symbol: selectedAsset.symbol,
      pair: `${selectedAsset.symbol}/USDT`,
      side,
      amount: customAmount,
      entryPrice: selectedAsset.price,
      currentPrice: selectedAsset.price,
      pnl: 0,
      duration,
      source,
      confidence: selectedAsset.score,
      openedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setBalance((value) => value - customAmount);
    setPositions((value) => [next, ...value]);
    setToast(`${side} opened on ${selectedAsset.symbol}`);
  }

  function closePosition(id: string) {
    const current = livePositions.find((position) => position.id === id);
    if (!current) return;
    setBalance((value) => value + current.amount + current.pnl);
    setPositions((value) => value.filter((position) => position.id !== id));
    setHistory((value) => [{ ...current, source: `${current.source} · Closed` }, ...value]);
    setToast(`${current.pair} closed · PnL ${formatMoney(current.pnl)}`);
  }

  function resetDemo() {
    setBalance(STARTING_BALANCE);
    setPositions([]);
    setHistory([]);
    setRiskMode('Balanced');
    setToast('Demo reset complete.');
  }

  const nav: Array<{ id: Screen; label: string }> = [
    { id: 'trade', label: 'Trade' },
    { id: 'markets', label: 'Markets' },
    { id: 'copy', label: 'Copy' },
    { id: 'wallet', label: 'Wallet' },
    { id: 'history', label: 'History' },
    { id: 'settings', label: 'Settings' }
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-bg pb-24 text-white lg:pb-0">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-12rem] top-[-12rem] h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute right-[-12rem] top-10 h-[34rem] w-[34rem] rounded-full bg-blue-700/20 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-bg/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <button onClick={() => setScreen('trade')} className="text-left">
            <p className="text-xl font-black tracking-[0.28em] text-gold">REGNANT X</p>
            <p className="text-xs text-white/40">AI crypto intelligence demo</p>
          </button>
          <nav className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-1 text-sm text-white/70 lg:flex">
            {nav.map((item) => (
              <button key={item.id} onClick={() => setScreen(item.id)} className={cn('rounded-xl px-4 py-2 transition', screen === item.id ? 'bg-accent text-black' : 'hover:bg-white/10 hover:text-white')}>{item.label}</button>
            ))}
          </nav>
          <button onClick={resetDemo} className="rounded-2xl bg-accent px-5 py-3 text-sm font-black text-black shadow-glow">Reset Demo</button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Demo Balance" value={formatMoney(balance)} sub="Available for new trades" tone="orange" />
        <StatCard label="Open PnL" value={formatMoney(openPnl)} sub={`Equity ${formatMoney(equity)}`} tone={openPnl >= 0 ? 'green' : 'red'} />
        <StatCard label="AI Confidence" value={`${marketScore}%`} sub="Average market score" />
        <StatCard label="Risk Mode" value={riskMode} sub={`Max ${formatMoney(maxTrade)}`} />
      </section>

      {screen === 'trade' && (
        <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-10 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-soft backdrop-blur">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/45">Live-feel dashboard</p>
                <h1 className="text-4xl font-black md:text-5xl">{selectedAsset.symbol}/USDT</h1>
                <p className="mt-2 text-white/50">{selectedAsset.name} · {selectedAsset.category}</p>
              </div>
              <div className="text-right">
                <Pill tone="orange">AI {selectedAsset.score}%</Pill>
                <p className="mt-3 text-2xl font-black md:text-3xl">{priceFormat(selectedAsset.price)}</p>
                <p className={selectedAsset.liveChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{selectedAsset.liveChange >= 0 ? '+' : ''}{selectedAsset.liveChange.toFixed(2)}%</p>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
              <MiniChart positive={selectedAsset.liveChange >= 0} />
              <div className="grid gap-4 lg:grid-cols-[1fr_220px_150px_150px] lg:items-end">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/35">Duration</p>
                  <div className="flex flex-wrap gap-2">{DURATIONS.map((item) => <button key={item} onClick={() => setDuration(item)} className={cn('rounded-xl px-4 py-3 text-sm font-bold', duration === item ? 'bg-accent text-black' : 'bg-white/10 text-white/70')}>{item}</button>)}</div>
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/35">Amount</p>
                  <input type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-black outline-none" />
                  <div className="mt-2 flex flex-wrap gap-1">{AMOUNT_PRESETS.map((preset) => <button key={preset} onClick={() => setAmount(preset)} className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white/60">{formatMoney(preset)}</button>)}</div>
                </div>
                <button disabled={!ready} onClick={() => openTrade('LONG')} className="rounded-2xl bg-emerald-500 px-5 py-4 font-black text-black disabled:opacity-40">LONG</button>
                <button disabled={!ready} onClick={() => openTrade('SHORT')} className="rounded-2xl bg-rose-500 px-5 py-4 font-black text-white disabled:opacity-40">SHORT</button>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <Panel title="Market Watchlist" subtitle="Tap asset to trade">
              <div className="space-y-2">{assets.slice(0, 6).map((asset) => <button key={asset.symbol} onClick={() => setSelectedSymbol(asset.symbol)} className={cn('grid w-full grid-cols-[1fr_auto] rounded-2xl border p-4 text-left', selectedSymbol === asset.symbol ? 'border-accent/50 bg-accent/10' : 'border-white/10 bg-black/20')}><div><p className="font-black">{asset.symbol} <span className="text-sm font-normal text-white/40">{asset.name}</span></p><p className="text-xs text-white/35">AI {asset.score} · {asset.volume}</p></div><p className={asset.liveChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{asset.liveChange >= 0 ? '+' : ''}{asset.liveChange.toFixed(2)}%</p></button>)}</div>
            </Panel>
            <Alerts alerts={alerts} setAlerts={setAlerts} />
            <Positions positions={livePositions} closePosition={closePosition} />
          </div>
        </section>
      )}

      {screen === 'markets' && <Markets assets={assets} setSelectedSymbol={setSelectedSymbol} setScreen={setScreen} />}
      {screen === 'copy' && <Copy openTrade={openTrade} />}
      {screen === 'wallet' && <Wallet balance={balance} openPnl={openPnl} equity={equity} resetDemo={resetDemo} />}
      {screen === 'history' && <History history={history} />}
      {screen === 'settings' && <Settings riskMode={riskMode} setRiskMode={setRiskMode} />}

      <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-6 gap-1 border-t border-white/10 bg-bg/90 p-2 backdrop-blur-xl lg:hidden">
        {nav.map((item) => (
          <button key={item.id} onClick={() => setScreen(item.id)} className={cn('rounded-xl px-1 py-2 text-xs font-bold', screen === item.id ? 'bg-accent text-black' : 'text-white/45')}>{item.label}</button>
        ))}
      </nav>

      {toast && <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-accent/20 bg-card px-5 py-3 text-sm font-bold shadow-glow lg:bottom-6">{toast}</div>}
    </main>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-soft backdrop-blur"><div className="mb-4"><h2 className="text-2xl font-black">{title}</h2>{subtitle && <p className="text-sm text-white/40">{subtitle}</p>}</div>{children}</div>;
}

function Alerts({ alerts, setAlerts }: { alerts: Alert[]; setAlerts: (alerts: Alert[]) => void }) {
  return <Panel title="Smart Alerts" subtitle="Demo signal triggers"><div className="space-y-2">{alerts.map((alert) => <button key={alert.id} onClick={() => setAlerts(alerts.map((item) => item.id === alert.id ? { ...item, active: !item.active } : item))} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-3 text-left text-sm"><span>{alert.text}</span><Pill tone={alert.active ? 'blue' : 'neutral'}>{alert.active ? 'Active' : 'Off'}</Pill></button>)}</div></Panel>;
}

function Positions({ positions, closePosition }: { positions: Position[]; closePosition: (id: string) => void }) {
  return <Panel title="Open Positions" subtitle="Close to settle demo PnL">{positions.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/40">No open positions yet.</div> : <div className="space-y-2">{positions.map((position) => <div key={position.id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-center justify-between gap-4"><div><p className="font-black">{position.pair} <span className={position.side === 'LONG' ? 'text-emerald-300' : 'text-rose-300'}>{position.side}</span></p><p className="text-xs text-white/35">{formatMoney(position.amount)} · {position.duration} · {position.source}</p></div><div className="text-right"><p className={position.pnl >= 0 ? 'font-black text-emerald-300' : 'font-black text-rose-300'}>{formatMoney(position.pnl)}</p><button onClick={() => closePosition(position.id)} className="mt-2 rounded-xl bg-white/10 px-3 py-1 text-xs font-bold">Close</button></div></div></div>)}</div>}</Panel>;
}

function Markets({ assets, setSelectedSymbol, setScreen }: { assets: Array<typeof baseAssets[number] & { price: number; liveChange: number }>; setSelectedSymbol: (symbol: string) => void; setScreen: (screen: Screen) => void }) {
  return <section className="mx-auto max-w-7xl px-5 pb-10"><Panel title="Markets" subtitle="AI-ranked assets"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{assets.map((asset) => <button key={asset.symbol} onClick={() => { setSelectedSymbol(asset.symbol); setScreen('trade'); }} className="rounded-3xl border border-white/10 bg-black/20 p-5 text-left"><div className="flex items-start justify-between"><div><p className="text-2xl font-black">{asset.symbol}</p><p className="text-white/40">{asset.name}</p></div><Pill tone={asset.liveChange >= 0 ? 'green' : 'red'}>{asset.liveChange >= 0 ? '+' : ''}{asset.liveChange.toFixed(2)}%</Pill></div><p className="mt-5 text-3xl font-black">{priceFormat(asset.price)}</p><div className="mt-4 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-accent" style={{ width: `${asset.score}%` }} /></div></button>)}</div></Panel></section>;
}

function Copy({ openTrade }: { openTrade: (side: Side, amount?: number, source?: string) => void }) {
  return <section className="mx-auto max-w-7xl px-5 pb-10"><Panel title="Copy Trader Hub" subtitle="Mock strategy marketplace"><div className="grid gap-4 md:grid-cols-3">{traders.map((trader) => <div key={trader.id} className="rounded-3xl border border-white/10 bg-black/20 p-5"><div className="flex items-start justify-between"><div><p className="text-xl font-black">{trader.name}</p><p className="text-sm text-white/40">{trader.style} · {trader.followers}</p></div><Pill tone={trader.risk === 'Low' ? 'green' : trader.risk === 'High' ? 'red' : 'orange'}>{trader.risk}</Pill></div><div className="mt-6 grid grid-cols-3 gap-2 text-center"><div className="rounded-2xl bg-white/5 p-3"><p className="text-xs text-white/35">ROI</p><p className="font-black text-emerald-300">+{trader.roi}%</p></div><div className="rounded-2xl bg-white/5 p-3"><p className="text-xs text-white/35">Win</p><p className="font-black">{trader.win}%</p></div><div className="rounded-2xl bg-white/5 p-3"><p className="text-xs text-white/35">DD</p><p className="font-black text-rose-300">{trader.drawdown}%</p></div></div><button onClick={() => openTrade('LONG', trader.allocation, `Copy · ${trader.name}`)} className="mt-5 w-full rounded-2xl bg-accent py-3 font-black text-black">Mock Copy · {formatMoney(trader.allocation)}</button></div>)}</div></Panel></section>;
}

function Wallet({ balance, openPnl, equity, resetDemo }: { balance: number; openPnl: number; equity: number; resetDemo: () => void }) {
  return <section className="mx-auto max-w-7xl px-5 pb-10"><Panel title="Demo Wallet" subtitle="Safe simulation only"><div className="grid gap-4 md:grid-cols-3"><StatCard label="Balance" value={formatMoney(balance)} sub="Available" /><StatCard label="Open PnL" value={formatMoney(openPnl)} sub="Unrealized" tone={openPnl >= 0 ? 'green' : 'red'} /><StatCard label="Equity" value={formatMoney(equity)} sub="Balance + PnL" /></div><div className="mt-5 rounded-3xl border border-accent/20 bg-accent/10 p-5 text-sm text-white/70">Deposits, withdrawals, cards, custody and real execution are intentionally disabled.</div><button onClick={resetDemo} className="mt-5 rounded-2xl bg-accent px-5 py-3 font-black text-black">Reset Demo Wallet</button></Panel></section>;
}

function History({ history }: { history: Position[] }) {
  return <section className="mx-auto max-w-7xl px-5 pb-10"><Panel title="Trade History" subtitle="Closed demo positions">{history.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/40">No closed trades yet.</div> : <div className="space-y-2">{history.map((position) => <div key={position.id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-center justify-between"><div><p className="font-black">{position.pair} · {position.side}</p><p className="text-xs text-white/35">{position.openedAt} · {position.source}</p></div><p className={position.pnl >= 0 ? 'font-black text-emerald-300' : 'font-black text-rose-300'}>{formatMoney(position.pnl)}</p></div></div>)}</div>}</Panel></section>;
}

function Settings({ riskMode, setRiskMode }: { riskMode: RiskMode; setRiskMode: (mode: RiskMode) => void }) {
  const modes: RiskMode[] = ['Conservative', 'Balanced', 'Aggressive'];
  return <section className="mx-auto max-w-7xl px-5 pb-10"><Panel title="Settings" subtitle="Demo risk controls"><div className="grid gap-3 md:grid-cols-3">{modes.map((mode) => <button key={mode} onClick={() => setRiskMode(mode)} className={cn('rounded-2xl border p-5 text-left font-black', riskMode === mode ? 'border-accent bg-accent text-black' : 'border-white/10 bg-black/20')}>{mode}<p className="mt-2 text-sm font-normal opacity-70">Max trade {formatMoney(mode === 'Conservative' ? 500 : mode === 'Aggressive' ? 2500 : 1000)}</p></button>)}</div></Panel></section>;
}
