'use client';

import { useEffect, useMemo, useState } from 'react';
import { assets as baseAssets, traders, STARTING_BALANCE } from '@/data/market';
import { calculateMarketScore, calculatePnl, canOpenTrade, formatMoney } from '@/lib/trading';

type Side = 'LONG' | 'SHORT';
type Tab = 'trade' | 'markets' | 'copy' | 'wallet' | 'history' | 'settings';
type Risk = 'Conservative' | 'Balanced' | 'Aggressive';
type Position = { id: string; symbol: string; side: Side; amount: number; entry: number; current: number; pnl: number; source: string; openedAt: string };
type LiveAsset = typeof baseAssets[number] & { price: number; liveChange: number };

const STORAGE_KEY = 'regnantx-demo-stable-v1';
const nav: Array<{ id: Tab; label: string }> = [
  { id: 'trade', label: 'Trade' },
  { id: 'markets', label: 'Markets' },
  { id: 'copy', label: 'Copy' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' }
];

function cx(...items: Array<string | false | undefined>) { return items.filter(Boolean).join(' '); }
function priceFormat(value: number) { const decimals = value >= 100 ? 2 : value >= 1 ? 3 : 4; return `$${value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`; }
function timeStamp() { return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
function maxByRisk(risk: Risk) { return risk === 'Conservative' ? 500 : risk === 'Aggressive' ? 2500 : 1000; }

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <div className={`rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-soft backdrop-blur ${className}`}>{children}</div>; }
function Pill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'green' | 'red' | 'gold' }) { const color = { neutral: 'border-white/10 bg-white/5 text-white/60', green: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300', red: 'border-rose-400/20 bg-rose-400/10 text-rose-300', gold: 'border-accent/20 bg-accent/10 text-accent' }[tone]; return <span className={`rounded-full border px-3 py-1 text-xs font-bold ${color}`}>{children}</span>; }
function Stat({ label, value, sub, tone = 'white' }: { label: string; value: string; sub: string; tone?: 'white' | 'green' | 'red' | 'gold' }) { return <Card><p className="text-sm text-white/45">{label}</p><p className={cx('mt-2 text-3xl font-black', tone === 'green' && 'text-emerald-300', tone === 'red' && 'text-rose-300', tone === 'gold' && 'text-accent')}>{value}</p><p className="mt-1 text-xs text-white/35">{sub}</p></Card>; }
function MiniChart({ positive }: { positive: boolean }) { const points = positive ? '0,72 35,65 70,68 105,42 140,49 175,30 210,37 245,18 280,25 320,15' : '0,24 35,30 70,26 105,42 140,38 175,56 210,50 245,63 280,58 320,70'; return <svg viewBox="0 0 320 90" className="h-48 w-full"><polyline points={points} fill="none" stroke={positive ? '#f59e0b' : '#f43f5e'} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>; }

export function RegnantXApp() {
  const [tab, setTab] = useState<Tab>('trade');
  const [tick, setTick] = useState(1);
  const [selected, setSelected] = useState('BTC');
  const [amount, setAmount] = useState(250);
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [risk, setRisk] = useState<Risk>('Balanced');
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<Position[]>([]);
  const [alerts, setAlerts] = useState<string[]>(['BTC breakout zone', 'ETH volume expansion', 'Risk guard enabled']);
  const [alertText, setAlertText] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as Partial<{ balance: number; risk: Risk; positions: Position[]; history: Position[]; alerts: string[] }>;
        if (typeof data.balance === 'number') setBalance(data.balance);
        if (data.risk) setRisk(data.risk);
        if (Array.isArray(data.positions)) setPositions(data.positions);
        if (Array.isArray(data.history)) setHistory(data.history);
        if (Array.isArray(data.alerts)) setAlerts(data.alerts);
      }
    } catch { localStorage.removeItem(STORAGE_KEY); }
    setLoaded(true);
  }, []);

  useEffect(() => { const timer = setInterval(() => setTick((v) => v + 1), 1500); return () => clearInterval(timer); }, []);
  useEffect(() => { if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify({ balance, risk, positions, history, alerts })); }, [loaded, balance, risk, positions, history, alerts]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 2200); return () => clearTimeout(timer); }, [toast]);

  const assets: LiveAsset[] = useMemo(() => baseAssets.map((asset, i) => { const drift = Math.sin((tick + i * 3) / 5) * asset.volatility + Math.cos((tick + i) / 7) * asset.volatility * 0.6; return { ...asset, price: asset.basePrice * (1 + drift), liveChange: asset.change + drift * 100 }; }), [tick]);
  const selectedAsset = assets.find((asset) => asset.symbol === selected) || assets[0];
  const maxTrade = maxByRisk(risk);
  const livePositions = positions.map((p) => { const asset = assets.find((x) => x.symbol === p.symbol); return asset ? { ...p, current: asset.price, pnl: calculatePnl(p.amount, p.entry, asset.price, p.side) } : p; });
  const openPnl = livePositions.reduce((sum, p) => sum + p.pnl, 0);
  const equity = balance + openPnl;
  const score = calculateMarketScore(assets.map((asset) => asset.score));
  const filteredAssets = assets.filter((asset) => `${asset.symbol} ${asset.name}`.toLowerCase().includes(search.toLowerCase()));
  const allocation = livePositions.reduce<Record<string, number>>((acc, p) => { acc[p.symbol] = (acc[p.symbol] || 0) + p.amount; return acc; }, {});
  const allocationTotal = Object.values(allocation).reduce((a, b) => a + b, 0);

  function openPosition(side: Side, customAmount = amount, source = 'Manual') {
    if (!canOpenTrade(balance, customAmount)) return setToast('Demo balance is not enough.');
    if (customAmount > maxTrade) return setToast(`${risk} max trade is ${formatMoney(maxTrade)}.`);
    const next: Position = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, symbol: selectedAsset.symbol, side, amount: customAmount, entry: selectedAsset.price, current: selectedAsset.price, pnl: 0, source, openedAt: timeStamp() };
    setBalance((v) => v - customAmount);
    setPositions((v) => [next, ...v]);
    setToast(`${side} opened on ${selectedAsset.symbol}`);
  }

  function closePosition(id: string) {
    const item = livePositions.find((p) => p.id === id);
    if (!item) return;
    setBalance((v) => v + item.amount + item.pnl);
    setPositions((v) => v.filter((p) => p.id !== id));
    setHistory((v) => [{ ...item, source: `${item.source} · Closed` }, ...v]);
    setToast(`${item.symbol} closed · ${formatMoney(item.pnl)}`);
  }

  function resetDemo() { setBalance(STARTING_BALANCE); setPositions([]); setHistory([]); setRisk('Balanced'); localStorage.removeItem(STORAGE_KEY); setToast('Demo reset complete.'); }
  function addAlert() { if (!alertText.trim()) return; setAlerts((v) => [alertText.trim(), ...v]); setAlertText(''); setToast('Alert added.'); }
  function copyReport() { navigator.clipboard?.writeText(`REGNANT X DEMO REPORT\nBalance: ${formatMoney(balance)}\nOpen PnL: ${formatMoney(openPnl)}\nEquity: ${formatMoney(equity)}\nOpen positions: ${positions.length}\nClosed trades: ${history.length}\nRisk mode: ${risk}`); setToast('Report copied.'); }

  return <main className="min-h-screen bg-bg pb-24 text-white lg:pb-0">
    <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(37,99,235,.16),transparent_35%)]" />
    <header className="sticky top-0 z-50 border-b border-white/10 bg-bg/80 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><button onClick={() => setTab('trade')} className="text-left"><p className="text-xl font-black tracking-[.28em] text-gold">REGNANT X</p><p className="text-xs text-white/40">AI crypto intelligence demo</p></button><nav className="hidden rounded-2xl border border-white/10 bg-white/[.035] p-1 lg:flex">{nav.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={cx('rounded-xl px-4 py-2 text-sm font-bold', tab === item.id ? 'bg-accent text-black' : 'text-white/60 hover:bg-white/10')}>{item.label}</button>)}</nav><button onClick={resetDemo} className="rounded-2xl bg-accent px-5 py-3 text-sm font-black text-black">Reset</button></div></header>
    <section className="mx-auto grid max-w-7xl gap-4 px-5 py-6 md:grid-cols-2 xl:grid-cols-4"><Stat label="Balance" value={formatMoney(balance)} sub="Available demo balance" tone="gold" /><Stat label="Open PnL" value={formatMoney(openPnl)} sub={`Equity ${formatMoney(equity)}`} tone={openPnl >= 0 ? 'green' : 'red'} /><Stat label="AI Score" value={`${score}%`} sub="Average market score" /><Stat label="Risk" value={risk} sub={`Max ${formatMoney(maxTrade)}`} /></section>

    {tab === 'trade' && <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-10 lg:grid-cols-[1.1fr_.9fr]"><Card><div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-sm text-white/45">Live-feel dashboard</p><h1 className="text-4xl font-black md:text-5xl">{selectedAsset.symbol}/USDT</h1><p className="mt-2 text-white/50">{selectedAsset.name} · {selectedAsset.category}</p></div><div className="text-right"><Pill tone="gold">AI {selectedAsset.score}%</Pill><p className="mt-3 text-2xl font-black md:text-3xl">{priceFormat(selectedAsset.price)}</p><p className={selectedAsset.liveChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{selectedAsset.liveChange >= 0 ? '+' : ''}{selectedAsset.liveChange.toFixed(2)}%</p></div></div><div className="rounded-3xl border border-white/10 bg-black/25 p-4"><MiniChart positive={selectedAsset.liveChange >= 0} /><div className="grid gap-3 md:grid-cols-[1fr_160px_140px_140px]"><div className="rounded-2xl border border-accent/20 bg-accent/10 p-4"><p className="text-xs text-white/45">Demo guide</p><p className="mt-1 text-sm font-bold">Coin seç, tutar gir, LONG/SHORT aç. Close ile history’ye aktar.</p></div><input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-black outline-none" /><button onClick={() => openPosition('LONG')} className="rounded-2xl bg-emerald-500 px-5 py-4 font-black text-black">LONG</button><button onClick={() => openPosition('SHORT')} className="rounded-2xl bg-rose-500 px-5 py-4 font-black text-white">SHORT</button></div></div></Card><div className="space-y-5"><Watchlist assets={assets.slice(0, 6)} selected={selected} setSelected={setSelected} /><Alerts alerts={alerts} alertText={alertText} setAlertText={setAlertText} addAlert={addAlert} /><Positions positions={livePositions} closePosition={closePosition} /></div></section>}

    {tab === 'markets' && <section className="mx-auto max-w-7xl px-5 pb-10"><Card><div className="mb-4 flex items-center justify-between"><div><h2 className="text-2xl font-black">Markets</h2><p className="text-sm text-white/40">Search and select an asset.</p></div><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-44 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none" /></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredAssets.map((asset) => <button key={asset.symbol} onClick={() => { setSelected(asset.symbol); setTab('trade'); }} className="rounded-3xl border border-white/10 bg-black/20 p-5 text-left"><div className="flex justify-between"><div><p className="text-2xl font-black">{asset.symbol}</p><p className="text-white/40">{asset.name}</p></div><Pill tone={asset.liveChange >= 0 ? 'green' : 'red'}>{asset.liveChange >= 0 ? '+' : ''}{asset.liveChange.toFixed(2)}%</Pill></div><p className="mt-4 text-3xl font-black">{priceFormat(asset.price)}</p></button>)}</div></Card></section>}
    {tab === 'copy' && <Copy openPosition={openPosition} />}
    {tab === 'wallet' && <Wallet balance={balance} openPnl={openPnl} equity={equity} allocation={allocation} allocationTotal={allocationTotal} />}
    {tab === 'history' && <History history={history} copyReport={copyReport} />}
    {tab === 'settings' && <Settings risk={risk} setRisk={setRisk} />}
    <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-6 gap-1 border-t border-white/10 bg-bg/90 p-2 backdrop-blur-xl lg:hidden">{nav.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={cx('rounded-xl px-1 py-2 text-xs font-bold', tab === item.id ? 'bg-accent text-black' : 'text-white/45')}>{item.label}</button>)}</nav>{toast && <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-accent/20 bg-card px-5 py-3 text-sm font-bold shadow-glow lg:bottom-6">{toast}</div>}
  </main>;
}

function Watchlist({ assets, selected, setSelected }: { assets: LiveAsset[]; selected: string; setSelected: (symbol: string) => void }) { return <Card><h2 className="text-2xl font-black">Market Watchlist</h2><div className="mt-4 space-y-2">{assets.map((asset) => <button key={asset.symbol} onClick={() => setSelected(asset.symbol)} className={cx('grid w-full grid-cols-[1fr_auto] rounded-2xl border p-4 text-left', selected === asset.symbol ? 'border-accent/50 bg-accent/10' : 'border-white/10 bg-black/20')}><div><p className="font-black">{asset.symbol} <span className="text-sm font-normal text-white/40">{asset.name}</span></p><p className="text-xs text-white/35">AI {asset.score} · {asset.volume}</p></div><p className={asset.liveChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{asset.liveChange >= 0 ? '+' : ''}{asset.liveChange.toFixed(2)}%</p></button>)}</div></Card>; }
function Alerts({ alerts, alertText, setAlertText, addAlert }: { alerts: string[]; alertText: string; setAlertText: (v: string) => void; addAlert: () => void }) { return <Card><h2 className="text-2xl font-black">Smart Alerts</h2><div className="mt-4 flex gap-2"><input value={alertText} onChange={(e) => setAlertText(e.target.value)} placeholder="Create alert..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none" /><button onClick={addAlert} className="rounded-xl bg-accent px-4 py-2 text-sm font-black text-black">Add</button></div><div className="mt-3 space-y-2">{alerts.map((alert) => <div key={alert} className="flex justify-between rounded-2xl border border-white/10 bg-black/20 p-3 text-sm"><span>{alert}</span><Pill tone="green">Active</Pill></div>)}</div></Card>; }
function Positions({ positions, closePosition }: { positions: Position[]; closePosition: (id: string) => void }) { return <Card><h2 className="text-2xl font-black">Open Positions</h2>{positions.length === 0 ? <p className="mt-4 rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/40">No open positions yet.</p> : <div className="mt-4 space-y-2">{positions.map((p) => <div key={p.id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex justify-between gap-4"><div><p className="font-black">{p.symbol}/USDT <span className={p.side === 'LONG' ? 'text-emerald-300' : 'text-rose-300'}>{p.side}</span></p><p className="text-xs text-white/35">{formatMoney(p.amount)} · {p.openedAt} · {p.source}</p></div><div className="text-right"><p className={p.pnl >= 0 ? 'font-black text-emerald-300' : 'font-black text-rose-300'}>{formatMoney(p.pnl)}</p><button onClick={() => closePosition(p.id)} className="mt-2 rounded-xl bg-white/10 px-3 py-1 text-xs font-bold">Close</button></div></div></div>)}</div>}</Card>; }
function Copy({ openPosition }: { openPosition: (side: Side, amount?: number, source?: string) => void }) { return <section className="mx-auto max-w-7xl px-5 pb-10"><Card><h2 className="text-2xl font-black">Copy Trader Hub</h2><p className="mb-5 text-sm text-white/40">Mock strategy marketplace.</p><div className="grid gap-4 md:grid-cols-3">{traders.map((t) => <div key={t.id} className="rounded-3xl border border-white/10 bg-black/20 p-5"><div className="flex justify-between"><div><p className="text-xl font-black">{t.name}</p><p className="text-sm text-white/40">{t.style} · {t.followers}</p></div><Pill tone={t.risk === 'Low' ? 'green' : t.risk === 'High' ? 'red' : 'gold'}>{t.risk}</Pill></div><button onClick={() => openPosition('LONG', t.allocation, `Copy · ${t.name}`)} className="mt-5 w-full rounded-2xl bg-accent py-3 font-black text-black">Mock Copy · {formatMoney(t.allocation)}</button></div>)}</div></Card></section>; }
function Wallet({ balance, openPnl, equity, allocation, allocationTotal }: { balance: number; openPnl: number; equity: number; allocation: Record<string, number>; allocationTotal: number }) { return <section className="mx-auto max-w-7xl px-5 pb-10"><Card><h2 className="text-2xl font-black">Demo Wallet</h2><div className="mt-5 grid gap-4 md:grid-cols-3"><Stat label="Balance" value={formatMoney(balance)} sub="Available" tone="gold" /><Stat label="Open PnL" value={formatMoney(openPnl)} sub="Unrealized" tone={openPnl >= 0 ? 'green' : 'red'} /><Stat label="Equity" value={formatMoney(equity)} sub="Balance + PnL" /></div><div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-5"><h3 className="font-black">Portfolio Allocation</h3>{allocationTotal === 0 ? <p className="mt-2 text-sm text-white/40">No open allocation yet.</p> : <div className="mt-4 space-y-3">{Object.entries(allocation).map(([symbol, value]) => <div key={symbol}><div className="mb-1 flex justify-between text-sm"><span>{symbol}</span><span>{Math.round((value / allocationTotal) * 100)}%</span></div><div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-accent" style={{ width: `${(value / allocationTotal) * 100}%` }} /></div></div>)}</div>}</div></Card></section>; }
function History({ history, copyReport }: { history: Position[]; copyReport: () => void }) { return <section className="mx-auto max-w-7xl px-5 pb-10"><Card><div className="mb-5 flex justify-between"><div><h2 className="text-2xl font-black">Trade History</h2><p className="text-sm text-white/40">Closed demo positions.</p></div><button onClick={copyReport} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">Copy report</button></div>{history.length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/40">No closed trades yet.</p> : <div className="space-y-2">{history.map((p) => <div key={p.id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex justify-between"><div><p className="font-black">{p.symbol}/USDT · {p.side}</p><p className="text-xs text-white/35">{p.openedAt} · {p.source}</p></div><p className={p.pnl >= 0 ? 'font-black text-emerald-300' : 'font-black text-rose-300'}>{formatMoney(p.pnl)}</p></div></div>)}</div>}</Card></section>; }
function Settings({ risk, setRisk }: { risk: Risk; setRisk: (mode: Risk) => void }) { return <section className="mx-auto max-w-7xl px-5 pb-10"><Card><h2 className="text-2xl font-black">Settings</h2><p className="mb-5 text-sm text-white/40">Demo risk controls.</p><div className="grid gap-3 md:grid-cols-3">{(['Conservative', 'Balanced', 'Aggressive'] as Risk[]).map((mode) => <button key={mode} onClick={() => setRisk(mode)} className={cx('rounded-2xl border p-5 text-left font-black', risk === mode ? 'border-accent bg-accent text-black' : 'border-white/10 bg-black/20')}>{mode}<p className="mt-2 text-sm font-normal opacity-70">Max trade {formatMoney(maxByRisk(mode))}</p></button>)}</div></Card></section>; }
