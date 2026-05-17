'use client';

import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { assets as baseAssets, STARTING_BALANCE } from '@/data/market';
import { calculatePnl, canOpenTrade, formatMoney } from '@/lib/trading';

type Side = 'LONG' | 'SHORT';
type View = 'trading' | 'finance' | 'profile' | 'market' | 'signals' | 'tournaments' | 'chat';
type Expiry = '5s' | '15s' | '30s' | '1m';
type ChartMode = 'Line' | 'Candles' | 'Bars' | 'Heikin Ashi';
type Position = { id: string; symbol: string; side: Side; amount: number; entry: number; current: number; pnl: number; openedAt: string; expiry: Expiry };
type LiveAsset = typeof baseAssets[number] & { price: number; liveChange: number; payout: number };

const STORAGE_KEY = 'regnantx-pocket-terminal-v2';
const menu: Array<{ id: View; icon: string; label: string }> = [
  { id: 'trading', icon: '↗', label: 'Trading' },
  { id: 'finance', icon: '$', label: 'Finance' },
  { id: 'profile', icon: '●', label: 'Profile' },
  { id: 'market', icon: '◆', label: 'Market' },
  { id: 'signals', icon: '⇅', label: 'Signals' },
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
  const [chartMode, setChartMode] = useState<ChartMode>('Line');
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
    <section className="grid h-[calc(100vh-48px)] grid-cols-[72px_1fr_310px_290px] overflow-hidden"><aside className="border-r border-white/10 bg-[#171c2f] py-3"><div className="space-y-1 px-2">{menu.map((item) => <button key={item.id} onClick={() => setView(item.id)} className={cx('flex h-[58px] w-full flex-col items-center justify-center rounded-xl text-[10px] transition', view === item.id ? 'bg-cyan-400/15 text-cyan-200' : 'text-white/55 hover:bg-white/5')}><span className="text-lg">{item.icon}</span><span>{item.label}</span></button>)}</div></aside>
      {view === 'trading' && <><ChartArea asset={selectedAsset} data={chartData} chartMode={chartMode} setChartMode={setChartMode} /><TradePanel asset={selectedAsset} expiry={expiry} setExpiry={setExpiry} amount={amount} setAmount={setAmount} openTrade={openTrade} /><RightPanel positions={livePositions} closeTrade={closeTrade} assets={filtered} selected={selected} setSelected={setSelected} search={search} setSearch={setSearch} /></>}
      {view !== 'trading' && <WidePanel title={view}><UtilityView view={view} balance={balance} assets={filtered} selected={selected} setSelected={setSelected} search={search} setSearch={setSearch} /></WidePanel>}
    </section>{toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-cyan-300/30 bg-[#202841] px-5 py-3 text-sm font-bold shadow-2xl">{toast}</div>}
  </main>;
}

function ChartArea({ asset, data, chartMode, setChartMode }: { asset: LiveAsset; data: Array<{ t: number; price: number }>; chartMode: ChartMode; setChartMode: (m: ChartMode)=>void }) { return <section className="relative overflow-hidden bg-[#12182b]"><div className="flex h-12 items-center gap-2 border-b border-white/10 bg-[#171c2f] px-4"><button className="rounded-lg bg-[#29324d] px-3 py-2 font-bold">{asset.symbol}/USDT ▾</button>{['📈','⚙','✎','⋯','▦'].map((x) => <button key={x} className="h-9 w-9 rounded-lg bg-[#29324d] text-white/80">{x}</button>)}</div><div className="pointer-events-none absolute inset-x-0 top-12 z-10 flex items-start justify-between px-4 py-3"><div><p className="text-xs text-white/40">{asset.name}</p><h1 className="text-3xl font-black">{asset.symbol}/USDT</h1></div><div className="text-right"><p className="text-2xl font-black">{priceFormat(asset.price)}</p><p className={asset.liveChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{asset.liveChange >= 0 ? '+' : ''}{asset.liveChange.toFixed(2)}%</p></div></div><ToolStrip /><div className="h-[calc(100%-48px)] bg-[linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] bg-[size:80px_80px] px-4 pt-16"><TradingChart data={data} positive={asset.liveChange >= 0} mode={chartMode} /></div><ChartSettings chartMode={chartMode} setChartMode={setChartMode} /><div className="absolute bottom-4 left-4 rounded-xl bg-[#202841] px-4 py-2 text-sm font-bold">M6⌃</div></section>; }
function ToolStrip() { const tools = ['Line','Vertical','Ray','Fibo','Trend','Channel','Rect']; return <div className="absolute left-3 top-28 z-20 space-y-2 rounded-2xl border border-white/10 bg-[#202841]/95 p-2">{tools.map((t)=><button key={t} title={t} className="block h-9 w-9 rounded-xl bg-white/5 text-xs text-white/70 hover:bg-cyan-400/20">{t.slice(0,2)}</button>)}</div>; }
function ChartSettings({ chartMode, setChartMode }: { chartMode: ChartMode; setChartMode: (m: ChartMode)=>void }) { const modes: ChartMode[] = ['Line','Candles','Bars','Heikin Ashi']; return <div className="absolute bottom-4 right-4 z-20 rounded-2xl border border-white/10 bg-[#202841]/95 p-3"><p className="mb-2 text-xs text-white/40">Chart types</p><div className="grid grid-cols-4 gap-2">{modes.map((m)=><button key={m} onClick={()=>setChartMode(m)} className={cx('rounded-xl px-3 py-2 text-xs font-bold', chartMode===m?'bg-cyan-400 text-black':'bg-white/5 text-white/60')}>{m}</button>)}</div></div>; }
function TradingChart({ data, positive, mode }: { data: Array<{ t: number; price: number }>; positive: boolean; mode: ChartMode }) { return <ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ left: 0, right: 30, top: 80, bottom: 16 }}><defs><linearGradient id="pocketFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={positive ? '#60a5fa' : '#f43f5e'} stopOpacity={mode==='Line'?0.38:0.18}/><stop offset="95%" stopColor={positive ? '#60a5fa' : '#f43f5e'} stopOpacity={0}/></linearGradient></defs><XAxis dataKey="t" stroke="rgba(255,255,255,.25)" tickLine={false} axisLine={false}/><YAxis orientation="right" stroke="rgba(255,255,255,.25)" tickLine={false} axisLine={false} domain={['dataMin','dataMax']} tickFormatter={(v)=>Number(v).toFixed(4)}/><Tooltip contentStyle={{ background: '#202841', border: '1px solid rgba(96,165,250,.25)', borderRadius: 12 }} formatter={(v)=>[priceFormat(Number(v)), 'Price']} /><Area type={mode==='Bars'?'step':'monotone'} dataKey="price" stroke={positive ? '#60a5fa' : '#f43f5e'} strokeWidth={mode==='Candles'?4:2.5} fill="url(#pocketFill)" /></AreaChart></ResponsiveContainer>; }

function TradePanel({ asset, expiry, setExpiry, amount, setAmount, openTrade }: { asset: LiveAsset; expiry: Expiry; setExpiry: (v: Expiry) => void; amount: number; setAmount: (v: number) => void; openTrade: (side: Side) => void }) { return <aside className="border-l border-white/10 bg-[#22283c] p-4"><div className="mb-4 h-2 rounded-full bg-gradient-to-b from-emerald-400 to-rose-500" /><p className="text-xs text-white/40">Payout</p><div className="mb-4 rounded-xl border border-emerald-400/20 bg-black/20 p-3 text-center"><p className="text-emerald-300">+{asset.payout}%</p><p className="text-xs text-white/40">+{formatMoney(amount * asset.payout / 100)}</p></div><label className="text-xs text-white/45">Time</label><div className="mt-2 grid grid-cols-4 gap-2">{(['5s','15s','30s','1m'] as Expiry[]).map((x) => <button key={x} onClick={() => setExpiry(x)} className={cx('rounded-lg py-2 text-xs font-bold', expiry === x ? 'bg-cyan-400 text-black' : 'bg-[#171c2f] text-white/60')}>{x}</button>)}</div><label className="mt-4 block text-xs text-white/45">Amount</label><input value={amount} onChange={(e) => setAmount(Number(e.target.value))} type="number" className="mt-2 w-full rounded-xl border border-white/10 bg-[#171c2f] px-4 py-3 text-xl font-black outline-none" /><button onClick={() => openTrade('LONG')} className="mt-4 w-full rounded-xl bg-[#31b545] py-4 text-lg font-black">BUY</button><button onClick={() => openTrade('SHORT')} className="mt-3 w-full rounded-xl bg-[#ff3b30] py-4 text-lg font-black">SELL</button><button className="mt-4 w-full rounded-xl bg-cyan-400 py-4 text-lg font-black text-white shadow-[0_0_30px_rgba(34,211,238,.5)]">AI TRADING</button></aside>; }

function RightPanel({ positions, closeTrade, assets, selected, setSelected, search, setSearch }: { positions: Position[]; closeTrade: (id: string)=>void; assets: LiveAsset[]; selected: string; setSelected: (s:string)=>void; search: string; setSearch: (s:string)=>void }) { return <aside className="border-l border-white/10 bg-[#1b2135]"><div className="border-b border-white/10 p-3 text-center font-bold">Trades</div><div className="grid grid-cols-2 border-b border-white/10 text-sm"><button className="border-b border-cyan-400 py-3">Opened</button><button className="py-3 text-white/45">Closed</button></div><div className="max-h-[220px] overflow-auto p-3">{positions.length === 0 ? <p className="py-8 text-center text-sm text-white/45">No opened trades</p> : positions.map((p) => <div key={p.id} className="mb-2 rounded-xl bg-[#252c43] p-3"><div className="flex justify-between"><b>{p.symbol}</b><span className={p.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{formatMoney(p.pnl)}</span></div><p className="text-xs text-white/45">{p.side} · {p.expiry} · {formatMoney(p.amount)}</p><button onClick={() => closeTrade(p.id)} className="mt-2 rounded-lg bg-white/10 px-3 py-1 text-xs">Close</button></div>)}</div><div className="border-y border-white/10 p-3"><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search assets" className="w-full rounded-lg bg-[#111528] px-3 py-2 text-sm outline-none" /></div><div className="max-h-[calc(100vh-380px)] overflow-auto p-3">{assets.slice(0,16).map((a) => <button key={a.symbol} onClick={()=>setSelected(a.symbol)} className={cx('mb-2 grid w-full grid-cols-[1fr_auto] rounded-xl p-3 text-left', selected === a.symbol ? 'bg-cyan-400/15' : 'bg-[#252c43] hover:bg-[#303851]')}><span><b>{a.symbol}</b><p className="text-xs text-white/40">{a.name}</p></span><span className="text-sm text-cyan-200">+{a.payout}%</span></button>)}</div></aside>; }

function WidePanel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="col-span-3 overflow-auto bg-[#111528] p-6"><h1 className="mb-5 capitalize text-3xl font-black">{title}</h1>{children}</section>; }
function UtilityView({ view, balance, assets, selected, setSelected, search, setSearch }: { view: View; balance: number; assets: LiveAsset[]; selected: string; setSelected: (s:string)=>void; search: string; setSearch: (s:string)=>void }) {
  if (view === 'market') return <AssetBrowser assets={assets} selected={selected} setSelected={setSelected} search={search} setSearch={setSearch} />;
  if (view === 'finance') return <Finance balance={balance} />;
  if (view === 'signals') return <Signals assets={assets} setSelected={setSelected} />;
  if (view === 'profile') return <SimpleList items={['Trading profile','Profile','Loyalty Program','Security','Trading history','Achievements','Community help','Pocket Pass']} />;
  if (view === 'tournaments') return <SimpleList items={['Day off · Prize $250 · Free','Hour play · Prize $100 · Fee $1','Rumble · Prize $2,500 · Fee $25']} />;
  return <SimpleList items={['Support Chat (Online)','General chat (English)']} />;
}
function AssetBrowser({ assets, selected, setSelected, search, setSearch }: { assets: LiveAsset[]; selected: string; setSelected: (s:string)=>void; search: string; setSearch: (s:string)=>void }) { const cats = ['Currencies','Cryptocurrencies','Commodities','Stocks','Indices','Favorites']; return <div className="grid max-w-5xl grid-cols-[190px_1fr] gap-6"><div className="space-y-2">{cats.map((c, i)=><button key={c} className={cx('w-full rounded-lg border px-4 py-3 text-left', i===1?'border-cyan-400 bg-cyan-400/15':'border-white/10 bg-[#202841]')}>{c}</button>)}</div><div><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search" className="mb-4 w-full rounded-lg bg-[#202841] px-4 py-3 outline-none" />{assets.map((a)=><button key={a.symbol} onClick={()=>setSelected(a.symbol)} className={cx('mb-2 flex w-full justify-between rounded-lg px-4 py-3', selected===a.symbol?'bg-cyan-400/15':'bg-[#202841]')}><span>☆ {a.name} OTC</span><span>+{a.payout}%</span></button>)}</div></div>; }
function Signals({ assets, setSelected }: { assets: LiveAsset[]; setSelected: (s:string)=>void }) { return <div className="grid max-w-3xl gap-3">{assets.slice(0,12).map((a, i)=><button key={a.symbol} onClick={()=>setSelected(a.symbol)} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-xl bg-[#202841] p-4 text-left"><div><b>{a.symbol}/USDT OTC</b><p className="text-xs text-white/40">Copied: {i * 2} times · just now</p></div><span className={a.liveChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{a.liveChange >= 0 ? '⇈' : '⇊'}</span><span className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold">Copy signal</span></button>)}</div>; }
function Finance({ balance }: { balance: number }) { const methods = ['Tether USDT TRC-20','Visa / Mastercard','Binance Pay','ByBit Pay','Gate Pay','Ethereum ERC-20','Tron TRX','Solana SOL','IBAN Bank Transfer']; return <div><div className="mb-6 rounded-2xl bg-[#202841] p-5"><p className="text-white/45">Demo balance</p><p className="text-4xl font-black text-cyan-200">{formatMoney(balance)}</p></div><h2 className="mb-3 text-xl font-bold">Account top-up</h2><div className="grid gap-3 md:grid-cols-3">{methods.map((m)=><div key={m} className="rounded-xl border border-white/10 bg-[#202841] p-4"><b>{m}</b><p className="mt-3 text-xs text-white/40">Min: $5 · ~5 min.</p></div>)}</div></div>; }
function SimpleList({ items }: { items: string[] }) { return <div className="grid max-w-3xl gap-3">{items.map((x)=><button key={x} className="rounded-xl bg-[#202841] p-5 text-left text-lg">{x}</button>)}</div>; }
