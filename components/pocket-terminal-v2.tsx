'use client';

import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { assets as baseAssets, STARTING_BALANCE } from '@/data/market';
import { calculatePnl, canOpenTrade, formatMoney } from '@/lib/trading';

type Side = 'LONG' | 'SHORT';
type Panel = 'terminal' | 'finance' | 'market' | 'signals' | 'social' | 'tournaments' | 'profile' | 'chat';
type Expiry = '5s' | '15s' | '30s' | '1m';
type Mode = 'Line' | 'Candles' | 'Bars';
type Pos = { id: string; symbol: string; side: Side; amount: number; entry: number; current: number; pnl: number; expiry: Expiry; openedAt: string; status: 'open' | 'pending' };
type Asset = typeof baseAssets[number] & { price: number; liveChange: number; payout: number };

const STORAGE_KEY = 'regnantx-pocket-terminal-v2-clean';
const panels: Array<{ id: Panel; icon: string; label: string }> = [
  { id: 'terminal', icon: '↗', label: 'Trade' },
  { id: 'finance', icon: '$', label: 'Finance' },
  { id: 'market', icon: '◆', label: 'Market' },
  { id: 'signals', icon: '⇅', label: 'Signals' },
  { id: 'social', icon: '♚', label: 'Social' },
  { id: 'tournaments', icon: '♛', label: 'Tour' },
  { id: 'profile', icon: '●', label: 'Profile' },
  { id: 'chat', icon: '◎', label: 'Chat' }
];
const names = ['QT Alpha', 'Aizat', 'BandA', 'KingKilo', 'DmacGFL', 'Regnant AI', 'user1315'];

function cx(...x: Array<string | false | undefined>) { return x.filter(Boolean).join(' '); }
function money(n: number) { return formatMoney(n); }
function price(n: number) { const d = n >= 100 ? 2 : n >= 1 ? 3 : 5; return `$${n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`; }
function now() { return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
function payout(score: number) { return Math.max(68, Math.min(94, Math.round(score * 0.7 + 27))); }
function buildSeries(symbol: string, priceNow: number, tick: number) {
  return Array.from({ length: 72 }, (_, i) => {
    const wave = Math.sin((i + tick) / 5.5) * 0.012;
    const micro = Math.cos((i + tick + symbol.length * 4) / 2.2) * 0.006;
    const trend = (i - 36) * 0.00035;
    return { t: i + 1, price: Math.max(0.0001, priceNow * (1 + wave + micro + trend)) };
  });
}

export function PocketTerminalV2() {
  const [panel, setPanel] = useState<Panel>('terminal');
  const [tick, setTick] = useState(1);
  const [selected, setSelected] = useState('BTC');
  const [expiry, setExpiry] = useState<Expiry>('30s');
  const [mode, setMode] = useState<Mode>('Line');
  const [amount, setAmount] = useState(250);
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [auto, setAuto] = useState(false);
  const [positions, setPositions] = useState<Pos[]>([]);
  const [closed, setClosed] = useState<Pos[]>([]);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [feed, setFeed] = useState<Array<{ id: string; user: string; side: Side; symbol: string; amount: number }>>([]);

  useEffect(() => { const timer = setInterval(() => setTick((v) => v + 1), 1400); return () => clearInterval(timer); }, []);
  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const d = JSON.parse(s) as Partial<{ balance: number; positions: Pos[]; closed: Pos[] }>;
        if (typeof d.balance === 'number') setBalance(d.balance);
        if (Array.isArray(d.positions)) setPositions(d.positions);
        if (Array.isArray(d.closed)) setClosed(d.closed);
      }
    } catch { localStorage.removeItem(STORAGE_KEY); }
  }, []);
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify({ balance, positions, closed })), [balance, positions, closed]);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 2400); return () => clearTimeout(t); }, [notice]);

  const assets: Asset[] = useMemo(() => baseAssets.map((a, i) => {
    const drift = Math.sin((tick + i * 3) / 5) * a.volatility + Math.cos((tick + i) / 7) * a.volatility * 0.6;
    return { ...a, price: a.basePrice * (1 + drift), liveChange: a.change + drift * 100, payout: payout(a.score) };
  }), [tick]);
  const asset = assets.find((a) => a.symbol === selected) || assets[0];
  const data = useMemo(() => buildSeries(asset.symbol, asset.price, tick), [asset.symbol, asset.price, tick]);
  const livePositions = positions.map((p) => { const a = assets.find((x) => x.symbol === p.symbol); return a ? { ...p, current: a.price, pnl: calculatePnl(p.amount, p.entry, a.price, p.side) } : p; });
  const openPnl = livePositions.filter((p) => p.status === 'open').reduce((s, p) => s + p.pnl, 0);
  const equity = balance + openPnl;
  const filtered = assets.filter((a) => `${a.symbol} ${a.name} ${a.category}`.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const t = setInterval(() => {
      const side: Side = Math.random() > .5 ? 'LONG' : 'SHORT';
      const item = { id: `${Date.now()}-${Math.random()}`, user: names[Math.floor(Math.random() * names.length)], side, symbol: assets[Math.floor(Math.random() * assets.length)]?.symbol || 'BTC', amount: [25, 50, 100, 250, 500][Math.floor(Math.random() * 5)] };
      setFeed((v) => [item, ...v].slice(0, 9));
    }, 2600);
    return () => clearInterval(t);
  }, [assets]);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => {
      const side: Side = asset.liveChange >= 0 ? 'LONG' : 'SHORT';
      openTrade(side, 50, 'pending');
    }, 8000);
    return () => clearInterval(t);
  }, [auto, asset.liveChange, asset.symbol, balance]);

  function openTrade(side: Side, customAmount = amount, status: Pos['status'] = 'open') {
    if (!canOpenTrade(balance, customAmount)) return setNotice('Demo balance is not enough');
    const next: Pos = { id: `${Date.now()}-${Math.random()}`, symbol: asset.symbol, side, amount: customAmount, entry: asset.price, current: asset.price, pnl: 0, expiry, openedAt: now(), status };
    setBalance((v) => v - customAmount);
    setPositions((v) => [next, ...v]);
    setNotice(`${side === 'LONG' ? 'BUY' : 'SELL'} ${status === 'pending' ? 'pending' : 'opened'} · ${asset.symbol}`);
  }
  function closeTrade(id: string) {
    const item = livePositions.find((p) => p.id === id);
    if (!item) return;
    setBalance((v) => v + item.amount + item.pnl);
    setPositions((v) => v.filter((p) => p.id !== id));
    setClosed((v) => [{ ...item }, ...v]);
    setNotice(`Closed ${item.symbol} · ${money(item.pnl)}`);
  }
  function activatePending(id: string) { setPositions((v) => v.map((p) => p.id === id ? { ...p, status: 'open' } : p)); }
  function reset() { setBalance(STARTING_BALANCE); setPositions([]); setClosed([]); setAuto(false); localStorage.removeItem(STORAGE_KEY); setNotice('Demo reset complete'); }

  return <main className="h-screen overflow-hidden bg-[#101524] text-white">
    <header className="flex h-12 items-center justify-between border-b border-white/10 bg-[#171d30] px-4">
      <div className="flex items-center gap-3"><div className="h-7 w-7 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600" /><b className="text-lg">Regnant<span className="text-cyan-300">X</span></b><Ticker assets={assets} setSelected={setSelected} /></div>
      <div className="flex items-center gap-3"><button onClick={() => setAuto((v) => !v)} className={cx('rounded-xl px-3 py-2 text-xs font-black', auto ? 'bg-cyan-400 text-black' : 'bg-[#252c43]')}>AI AUTO {auto ? 'ON' : 'OFF'}</button><div className="rounded-xl bg-[#252c43] px-4 py-1 text-right"><p className="text-[10px] text-white/35">QT Demo</p><b className="text-cyan-200">{money(equity)}</b></div><button onClick={reset} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black">TOP UP</button></div>
    </header>
    <section className="grid h-[calc(100vh-48px)] grid-cols-[72px_1fr_310px_300px] overflow-hidden">
      <aside className="border-r border-white/10 bg-[#171d30] p-2">{panels.map((p) => <button key={p.id} onClick={() => setPanel(p.id)} className={cx('mb-1 flex h-[54px] w-full flex-col items-center justify-center rounded-xl text-[10px]', panel === p.id ? 'bg-cyan-400/15 text-cyan-200' : 'text-white/55 hover:bg-white/5')}><span className="text-base">{p.icon}</span>{p.label}</button>)}</aside>
      {panel === 'terminal' ? <><ChartDesk asset={asset} data={data} mode={mode} setMode={setMode} /><TradeBox asset={asset} expiry={expiry} setExpiry={setExpiry} amount={amount} setAmount={setAmount} openTrade={openTrade} auto={auto} /><SideDesk positions={livePositions} closeTrade={closeTrade} activatePending={activatePending} assets={filtered} selected={selected} setSelected={setSelected} search={search} setSearch={setSearch} feed={feed} /></> : <Wide title={panel}><Utility panel={panel} balance={balance} assets={filtered} selected={selected} setSelected={setSelected} search={search} setSearch={setSearch} feed={feed} /></Wide>}
    </section>
    {notice && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-cyan-300/30 bg-[#252c43] px-5 py-3 text-sm font-bold shadow-2xl">{notice}</div>}
  </main>;
}

function Ticker({ assets, setSelected }: { assets: Asset[]; setSelected: (s: string) => void }) { return <div className="hidden max-w-[700px] gap-2 overflow-hidden lg:flex">{assets.slice(0,6).map((a) => <button key={a.symbol} onClick={() => setSelected(a.symbol)} className="rounded-lg bg-[#252c43] px-3 py-1 text-xs"><b>{a.symbol}</b> <span className={a.liveChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{a.liveChange >= 0 ? '+' : ''}{a.liveChange.toFixed(2)}%</span></button>)}</div>; }
function ChartDesk({ asset, data, mode, setMode }: { asset: Asset; data: Array<{t:number;price:number}>; mode: Mode; setMode: (m: Mode) => void }) { return <section className="relative bg-[#12182b]"><div className="flex h-12 items-center gap-2 border-b border-white/10 bg-[#171d30] px-4"><b className="rounded-lg bg-[#29324d] px-3 py-2">{asset.symbol}/USDT</b>{['Line','Candles','Bars'].map((m) => <button key={m} onClick={() => setMode(m as Mode)} className={cx('rounded-lg px-3 py-2 text-xs font-bold', mode === m ? 'bg-cyan-400 text-black' : 'bg-[#29324d]')}>{m}</button>)}</div><div className="absolute left-4 top-16 z-10"><p className="text-xs text-white/40">{asset.name}</p><h1 className="text-3xl font-black">{price(asset.price)}</h1><p className={asset.liveChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{asset.liveChange >= 0 ? '+' : ''}{asset.liveChange.toFixed(2)}%</p></div><AiBadge asset={asset} /><div className="h-[calc(100%-48px)] bg-[linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] bg-[size:80px_80px] p-4 pt-20"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ right: 30, top: 30, bottom: 10 }}><XAxis dataKey="t" stroke="rgba(255,255,255,.25)" tickLine={false} axisLine={false}/><YAxis orientation="right" stroke="rgba(255,255,255,.25)" tickLine={false} axisLine={false} domain={['dataMin','dataMax']} tickFormatter={(v)=>Number(v).toFixed(4)}/><Tooltip contentStyle={{ background: '#202841', border: '1px solid rgba(96,165,250,.25)', borderRadius: 12 }} formatter={(v)=>[price(Number(v)), 'Price']} /><Area type={mode === 'Bars' ? 'step' : 'monotone'} dataKey="price" stroke={asset.liveChange >= 0 ? '#60a5fa' : '#f43f5e'} strokeWidth={mode === 'Candles' ? 4 : 2.5} fillOpacity={0.22} fill={asset.liveChange >= 0 ? '#60a5fa' : '#f43f5e'} /></AreaChart></ResponsiveContainer></div></section>; }
function AiBadge({ asset }: { asset: Asset }) { return <div className="absolute right-4 top-16 z-10 w-56 rounded-2xl border border-cyan-400/20 bg-[#202841]/90 p-3"><div className="flex justify-between"><b className="text-cyan-200">AI BOT</b><span className="h-2 w-2 rounded-full bg-emerald-400" /></div><p className={asset.liveChange >= 0 ? 'mt-2 text-emerald-300' : 'mt-2 text-rose-300'}>{asset.liveChange >= 0 ? 'BUY pressure detected' : 'SELL pressure detected'}</p><div className="mt-3 h-2 rounded-full bg-black/30"><div className="h-2 rounded-full bg-cyan-400" style={{width:`${asset.payout}%`}} /></div><p className="mt-2 text-xs text-white/40">Confidence {asset.payout}%</p></div>; }
function TradeBox({ asset, expiry, setExpiry, amount, setAmount, openTrade, auto }: { asset: Asset; expiry: Expiry; setExpiry: (e: Expiry) => void; amount: number; setAmount: (n: number) => void; openTrade: (s: Side, a?: number, st?: Pos['status']) => void; auto: boolean }) { return <aside className="border-l border-white/10 bg-[#22283c] p-4"><p className="text-xs text-white/40">Payout</p><div className="mb-4 rounded-xl border border-emerald-400/20 bg-black/20 p-3 text-center"><p className="text-emerald-300">+{asset.payout}%</p><p className="text-xs text-white/40">+{money(amount * asset.payout / 100)}</p></div><p className="text-xs text-white/45">Time</p><div className="mt-2 grid grid-cols-4 gap-2">{(['5s','15s','30s','1m'] as Expiry[]).map((e)=><button key={e} onClick={()=>setExpiry(e)} className={cx('rounded-lg py-2 text-xs font-bold', expiry===e?'bg-cyan-400 text-black':'bg-[#171c2f] text-white/60')}>{e}</button>)}</div><p className="mt-4 text-xs text-white/45">Amount</p><input type="number" value={amount} onChange={(e)=>setAmount(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#171c2f] px-4 py-3 text-xl font-black outline-none" /><button onClick={()=>openTrade('LONG')} className="mt-4 w-full rounded-xl bg-[#31b545] py-4 text-lg font-black">BUY</button><button onClick={()=>openTrade('SHORT')} className="mt-3 w-full rounded-xl bg-[#ff3b30] py-4 text-lg font-black">SELL</button><button onClick={()=>openTrade(asset.liveChange >= 0 ? 'LONG' : 'SHORT', 100, 'pending')} className={cx('mt-4 w-full rounded-xl py-4 text-lg font-black text-white shadow-[0_0_30px_rgba(34,211,238,.35)]', auto ? 'bg-cyan-400' : 'bg-[#2e3b57]')}>AI TRADING</button></aside>; }
function SideDesk({ positions, closeTrade, activatePending, assets, selected, setSelected, search, setSearch, feed }: { positions: Pos[]; closeTrade: (id: string) => void; activatePending: (id:string)=>void; assets: Asset[]; selected: string; setSelected: (s:string)=>void; search: string; setSearch: (s:string)=>void; feed: Array<{id:string;user:string;side:Side;symbol:string;amount:number}> }) { return <aside className="border-l border-white/10 bg-[#1b2135]"><div className="border-b border-white/10 p-3 text-center font-bold">Trades</div><div className="max-h-[190px] overflow-auto p-3">{positions.length === 0 ? <p className="py-6 text-center text-sm text-white/45">No opened trades</p> : positions.map((p)=><div key={p.id} className="mb-2 rounded-xl bg-[#252c43] p-3"><div className="flex justify-between"><b>{p.symbol}</b><span className={p.pnl>=0?'text-emerald-300':'text-rose-300'}>{money(p.pnl)}</span></div><p className="text-xs text-white/45">{p.status} · {p.side} · {p.expiry} · {money(p.amount)}</p>{p.status==='pending' && <button onClick={()=>activatePending(p.id)} className="mr-2 mt-2 rounded-lg bg-cyan-500 px-3 py-1 text-xs font-bold">Activate</button>}<button onClick={()=>closeTrade(p.id)} className="mt-2 rounded-lg bg-white/10 px-3 py-1 text-xs">Close</button></div>)}</div><div className="border-y border-white/10 p-3"><b className="text-sm">Live Trade Feed</b>{feed.slice(0,4).map((f)=><p key={f.id} className="mt-2 text-xs text-white/55"><span className={f.side==='LONG'?'text-emerald-300':'text-rose-300'}>{f.user}</span> {f.side==='LONG'?'BUY':'SELL'} {f.symbol} · ${f.amount}</p>)}</div><div className="border-b border-white/10 p-3"><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search assets" className="w-full rounded-lg bg-[#111528] px-3 py-2 text-sm outline-none" /></div><div className="max-h-[calc(100vh-460px)] overflow-auto p-3">{assets.slice(0,16).map((a)=><button key={a.symbol} onClick={()=>setSelected(a.symbol)} className={cx('mb-2 grid w-full grid-cols-[1fr_auto] rounded-xl p-3 text-left', selected===a.symbol?'bg-cyan-400/15':'bg-[#252c43] hover:bg-[#303851]')}><span><b>{a.symbol}</b><p className="text-xs text-white/40">{a.name}</p></span><span className="text-sm text-cyan-200">+{a.payout}%</span></button>)}</div></aside>; }
function Wide({ title, children }: { title: string; children: React.ReactNode }) { return <section className="col-span-3 overflow-auto bg-[#111528] p-6"><h1 className="mb-5 capitalize text-3xl font-black">{title}</h1>{children}</section>; }
function Utility({ panel, balance, assets, selected, setSelected, search, setSearch, feed }: { panel: Panel; balance: number; assets: Asset[]; selected: string; setSelected:(s:string)=>void; search:string; setSearch:(s:string)=>void; feed: Array<{id:string;user:string;side:Side;symbol:string;amount:number}> }) { if (panel==='market') return <Market assets={assets} selected={selected} setSelected={setSelected} search={search} setSearch={setSearch}/>; if (panel==='finance') return <Finance balance={balance}/>; if (panel==='signals') return <Signals assets={assets} setSelected={setSelected}/>; if (panel==='social') return <Social/>; if (panel==='tournaments') return <Tournaments/>; if (panel==='chat') return <Chat feed={feed}/>; return <Simple items={['Trading profile','Security','Trading history','Achievements','Community help','Pocket Pass']}/>; }
function Market({ assets, selected, setSelected, search, setSearch }: { assets:Asset[]; selected:string; setSelected:(s:string)=>void; search:string; setSearch:(s:string)=>void }) { const cats=['Currencies','Cryptocurrencies','Commodities','Stocks','Indices','Favorites']; return <div className="grid max-w-5xl grid-cols-[190px_1fr] gap-6"><div className="space-y-2">{cats.map((c,i)=><button key={c} className={cx('w-full rounded-lg border px-4 py-3 text-left',i===1?'border-cyan-400 bg-cyan-400/15':'border-white/10 bg-[#202841]')}>{c}</button>)}</div><div><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search" className="mb-4 w-full rounded-lg bg-[#202841] px-4 py-3 outline-none" />{assets.map((a)=><button key={a.symbol} onClick={()=>setSelected(a.symbol)} className={cx('mb-2 flex w-full justify-between rounded-lg px-4 py-3',selected===a.symbol?'bg-cyan-400/15':'bg-[#202841]')}><span>☆ {a.name} OTC</span><span>+{a.payout}%</span></button>)}</div></div>; }
function Signals({ assets, setSelected }: { assets:Asset[]; setSelected:(s:string)=>void }) { return <div className="grid max-w-3xl gap-3">{assets.slice(0,12).map((a,i)=><button key={a.symbol} onClick={()=>setSelected(a.symbol)} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-xl bg-[#202841] p-4 text-left"><div><b>{a.symbol}/USDT OTC</b><p className="text-xs text-white/40">Copied: {i*2} times · just now</p></div><span className={a.liveChange>=0?'text-emerald-300':'text-rose-300'}>{a.liveChange>=0?'⇈':'⇊'}</span><span className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold">Copy signal</span></button>)}</div>; }
function Social(){ const users=['Trading','Aizat','BanDa','KingKilo','DmacGFL','user120738702','user131507415']; return <div className="grid max-w-2xl gap-2">{users.map((u,i)=><div key={u} className="grid grid-cols-[48px_1fr_auto] items-center gap-3 rounded-xl bg-[#202841] p-3"><div className="h-11 w-11 rounded-full bg-cyan-400/20"/><div><b>{u}</b><p className="text-xs text-white/40">Trades: {46+i*73}</p></div><div className="text-right text-emerald-300"><b>+${(8711-i*720).toLocaleString('en-US')}</b><p className="text-xs text-white/40">{100-i*7}% profitable</p></div></div>)}</div>; }
function Tournaments(){ return <Simple items={['Day off · Prize $250 · Free','Hour play · Prize $100 · Fee $1','Rumble · Prize $2,500 · Fee $25','Night sprint · Prize $500 · Fee $3']}/>; }
function Chat({feed}:{feed:Array<{id:string;user:string;side:Side;symbol:string;amount:number}>}){ return <div className="max-w-xl space-y-3"><div className="rounded-xl bg-[#202841] p-4"><b>Support Chat</b><p className="text-white/45">Online</p></div>{feed.slice(0,6).map((f)=><div key={f.id} className="rounded-xl bg-[#202841] p-3"><b>{f.user}</b><p className="text-sm text-white/50">Opened {f.side} on {f.symbol}</p></div>)}</div>; }
function Finance({balance}:{balance:number}){ const methods=['Tether USDT TRC-20','Visa / Mastercard','Binance Pay','ByBit Pay','Gate Pay','Ethereum ERC-20','Tron TRX','IBAN Bank Transfer']; return <div><div className="mb-6 rounded-2xl bg-[#202841] p-5"><p className="text-white/45">Demo balance</p><p className="text-4xl font-black text-cyan-200">{money(balance)}</p></div><div className="grid gap-3 md:grid-cols-3">{methods.map((m)=><div key={m} className="rounded-xl border border-white/10 bg-[#202841] p-4"><b>{m}</b><p className="mt-3 text-xs text-white/40">Min: $5 · ~5 min.</p></div>)}</div></div>; }
function Simple({items}:{items:string[]}){ return <div className="grid max-w-3xl gap-3">{items.map((x)=><button key={x} className="rounded-xl bg-[#202841] p-5 text-left text-lg">{x}</button>)}</div>; }
