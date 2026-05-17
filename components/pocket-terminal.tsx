'use client';

import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { assets as baseAssets, STARTING_BALANCE } from '@/data/market';
import { calculatePnl, canOpenTrade, formatMoney } from '@/lib/trading';

type Side = 'LONG' | 'SHORT';
type View = 'trading' | 'finance' | 'profile' | 'market' | 'tournaments' | 'chat';
type Expiry = '5s' | '15s' | '30s' | '1m';
type Position = { id: string; symbol: string; side: Side; amount: number; entry: number; current: number; pnl: number; openedAt: string; expiry: Expiry };
type LiveAsset = typeof baseAssets[number] & { price: number; liveChange: number; payout: number };

const STORAGE_KEY = 'regnantx-pocket-terminal-v1';
const menu: Array<{ id: View; icon: string; label: string }> = [
  { id: 'trading', icon: '↗', label: 'Trading' },
  { id: 'finance', icon: '$', label: 'Finance' },
  { id: 'profile', icon: '●', label: 'Profile' },
  { id: 'market', icon: '◆', label: 'Market' },
  { id: 'tournaments', icon: '♛', label: 'Tourney' },
  { id: 'chat', icon: '◎', label: 'Chat' }
];

function cx(...items: Array<string | false | undefined>) { return items.filter(Boolean).join(' '); }
function priceFormat(value: number) { const d = value >= 100 ? 2 : value >= 1 ? 3 : 5; return `$${value.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`; }
function stamp() { return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
function payout(score: number) { return Math.max(67, Math.min(92, Math.round(score * 0.72 + 26))); }
function series(symbol: string, price: number, tick: number, expiry: Expiry) {
  const points = expiry === '5s' ? 42 : expiry === '15s' ? 56 : expiry === '30s' ? 70 : 90;
  const speed = expiry === '5s' ? 2.8 : expiry === '15s' ? 4.3 : expiry === '30s' ? 5.8 : 8;
  return Array.from({ length: points }, (_, i) => {
    const wave = Math.sin((i + tick) / speed) * 0.013;
    const micro = Math.cos((i + symbol.length * 7 + tick) / 2.4) * 0.006;
    const trend = (i - points / 2) * 0.00036;
    return { t: i + 1, price: Math.max(0.0001, price * (1 + wave + micro + trend)) };
  });
}

export function PocketTerminal() {
  const [view, setView] = useState<View>('trading');
  const [tick, setTick] = useState(1);
  const [selected, setSelected] = useState('BTC');
  const [expiry, setExpiry] = useState<Expiry>('30s');
  const [amount, setAmount] = useState(250);
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<Position[]>([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) { const d = JSON.parse(saved) as Partial<{ balance: number; positions: Position[]; history: Position[] }>; if (typeof d.balance === 'number') setBalance(d.balance); if (Array.isArray(d.positions)) setPositions(d.positions); if (Array.isArray(d.history)) setHistory(d.history); } } catch { localStorage.removeItem(STORAGE_KEY); } setLoaded(true); }, []);
  useEffect(() => { const timer = setInterval(() => setTick((v) => v + 1), 1400); return () => clearInterval(timer); }, []);
  useEffect(() => { if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify({ balance, positions, history })); }, [loaded, balance, positions, history]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 2200); return () => clearTimeout(timer); }, [toast]);

  const assets: LiveAsset[] = useMemo(() => baseAssets.map((asset, i) => { const drift = Math.sin((tick + i * 3) / 5) * asset.volatility + Math.cos((tick + i) / 7) * asset.volatility * 0.6; return { ...asset, price: asset.basePrice * (1 + drift), liveChange: asset.change + drift * 100, payout: payout(asset.score) }; }), [tick]);
  const selectedAsset = assets.find((asset) => asset.symbol === selected) || assets[0];
  const chartData = useMemo(() => series(selectedAsset.symbol, selectedAsset.price, tick, expiry), [selectedAsset.symbol, selectedAsset.price, tick, expiry]);
  const livePositions = positions.map((p) => { const asset = assets.find((x) => x.symbol === p.symbol); return asset ? { ...p, current: asset.price, pnl: calculatePnl(p.amount, p.entry, asset.price, p.side) } : p; });
  const openPnl = livePositions.reduce((sum, p) => sum + p.pnl, 0);
  const equity = balance + openPnl;
  const filtered = assets.filter((asset) => `${asset.symbol} ${asset.name} ${asset.category}`.toLowerCase().includes(search.toLowerCase()));

  function openTrade(side: Side) {
    if (!canOpenTrade(balance, amount)) return setToast('Demo balance is not enough.');
    const next: Position = { id: `${Date.now()}-${Math.random()}`, symbol: selectedAsset.symbol, side, amount, entry: selectedAsset.price, current: selectedAsset.price, pnl: 0, openedAt: stamp(), expiry };
    setBalance((v) => v - amount); setPositions((v) => [next, ...v]); setToast(`${side === 'LONG' ? 'BUY' : 'SELL'} opened on ${selectedAsset.symbol}`);
  }
  function closeTrade(id: string) { const item = livePositions.find((p) => p.id === id); if (!item) return; setBalance((v) => v + item.amount + item.pnl); setPositions((v) => v.filter((p) => p.id !== id)); setHistory((v) => [{ ...item }, ...v]); setToast(`${item.symbol} closed · ${formatMoney(item.pnl)}`); }
  function resetDemo() { setBalance(STARTING_BALANCE); setPositions([]); setHistory([]); localStorage.removeItem(STORAGE_KEY); setToast('Demo reset complete.'); }

  return <main className="h-screen overflow-hidden bg-[#111528] text-white">
    <header className="flex h-12 items-center justify-between border-b border-white/10 bg-[#171c2f] px-4"><div className="flex items-center gap-3"><div className="h-7 w-7 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600" /><p className="text-lg font-black">Regnant<span className="text-cyan-300">X</span></p><button className="rounded-lg border border-white/10 px-3 py-1 text-sm text-white/60">★</button></div><div className="flex items-center gap-3"><div className="hidden rounded-xl bg-[#222940] px-4 py-1.5 text-right sm:block"><p className="text-[10px] text-white/35">QT Demo</p><p className="font-black text-cyan-200">{formatMoney(equity)}</p></div><button onClick={resetDemo} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black text-white">TOP UP</button><div className="h-9 w-9 rounded-full border border-cyan-300/40 bg-cyan-300/10" /></div></header>
    <section className="grid h-[calc(100vh-48px)] grid-cols-[72px_1fr_310px_290px] overflow-hidden"><aside className="border-r border-white/10 bg-[#171c2f] py-3"><div className="space-y-1 px-2">{menu.map((item) => <button key={item.id} onClick={() => setView(item.id)} className={cx('flex h-[62px] w-full flex-col items-center justify-center rounded-xl text-[11px] transition', view === item.id ? 'bg-cyan-400/15 text-cyan-200' : 'text-white/55 hover:bg-white/5')}><span className="text-lg">{item.icon}</span><span>{item.label}</span></button>)}</div></aside>
      {view === 'trading' && <><ChartArea asset={selectedAsset} data={chartData} /><TradePanel asset={selectedAsset} expiry={expiry} setExpiry={setExpiry} amount={amount} setAmount={setAmount} openTrade={openTrade} /><RightPanel positions={livePositions} closeTrade={closeTrade} assets={filtered} selected={selected} setSelected={setSelected} search={search} setSearch={setSearch} /></>}
      {view !== 'trading' && <WidePanel title={view}><UtilityView view={view} balance={balance} assets={filtered} selected={selected} setSelected={setSelected} search={search} setSearch={setSearch} /></WidePanel>}
    </section>{toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-cyan-300/30 bg-[#202841] px-5 py-3 text-sm font-bold shadow-2xl">{toast}</div>}
  </main>;
}

function ChartArea({ asset, data }: { asset: LiveAsset; data: Array<{ t: number; price: number }> }) { return <section className="relative overflow-hidden bg-[#12182b]"><div className="flex h-12 items-center gap-2 border-b border-white/10 bg-[#171c2f] px-4"><button className="rounded-lg bg-[#29324d] px-3 py-2 font-bold">{asset.symbol}/USDT ▾</button>{['📈','⚙','✎','⋯','▦'].map((x) => <button key={x} className="h-9 w-9 rounded-lg bg-[#29324d] text-white/80">{x}</button>)}</div><div className="pointer-events-none absolute inset-x-0 top-12 z-10 flex items-start justify-between px-4 py-3"><div><p className="text-xs text-white/40">{asset.name}</p><h1 className="text-3xl font-black">{asset.symbol}/USDT</h1></div><div className="text-right"><p className="text-2xl font-black">{priceFormat(asset.price)}</p><p className={asset.liveChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{asset.liveChange >= 0 ? '+' : ''}{asset.liveChange.toFixed(2)}%</p></div></div><div className="h-[calc(100%-48px)] bg-[linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] bg-[size:80px_80px] px-4 pt-16"><TradingChart data={data} positive={asset.liveChange >= 0} /></div><div className="absolute bottom-4 left-4 rounded-xl bg-[#202841] px-4 py-2 text-sm font-bold">M6⌃</div></section>; }
function TradingChart({ data, positive }: { data: Array<{ t: number; price: number }>; positive: boolean }) { return <ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ left: 0, right: 30, top: 80, bottom: 16 }}><defs><linearGradient id="pocketFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={positive ? '#60a5fa' : '#f43f5e'} stopOpacity={0.38}/><stop offset="95%" stopColor={positive ? '#60a5fa' : '#f43f5e'} stopOpacity={0}/></linearGradient></defs><XAxis dataKey="t" stroke="rgba(255,255,255,.25)" tickLine={false} axisLine={false}/><YAxis orientation="right" stroke="rgba(255,255,255,.25)" tickLine={false} axisLine={false} domain={['dataMin','dataMax']} tickFormatter={(v)=>Number(v).toFixed(4)}/><Tooltip contentStyle={{ background: '#202841', border: '1px solid rgba(96,165,250,.25)', borderRadius: 12 }} formatter={(v)=>[priceFormat(Number(v)), 'Price']} /><Area type="monotone" dataKey="price" stroke={positive ? '#60a5fa' : '#f43f5e'} strokeWidth={2.5} fill="url(#pocketFill)" /></AreaChart></ResponsiveContainer>; }
