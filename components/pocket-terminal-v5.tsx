'use client';

import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { assets as baseAssets, STARTING_BALANCE } from '@/data/market';
import { calculatePnl, canOpenTrade, formatMoney } from '@/lib/trading';

type Side = 'LONG' | 'SHORT';
type Panel = 'terminal' | 'finance' | 'market' | 'signals' | 'social' | 'news' | 'calendar' | 'watchlists' | 'achievements';
type Expiry = '5s' | '15s' | '30s' | '1m';
type ChartType = 'Line' | 'Candles' | 'Bars' | 'Heikin Ashi';
type Position = { id: string; symbol: string; side: Side; amount: number; entry: number; current: number; pnl: number; expiry: Expiry; status: 'open' | 'pending' };
type Asset = typeof baseAssets[number] & { price: number; liveChange: number; payout: number; live?: boolean };
type Candle = { t: number; open: number; high: number; low: number; close: number; price: number; volume: number };

const STORE = 'regnantx-terminal-v5';
const tabs: Array<{ id: Panel; icon: string; label: string }> = [
  { id: 'terminal', icon: '↗', label: 'Trade' },
  { id: 'finance', icon: '$', label: 'Finance' },
  { id: 'market', icon: '◆', label: 'Market' },
  { id: 'signals', icon: '⇅', label: 'Signals' },
  { id: 'social', icon: '♚', label: 'Social' },
  { id: 'news', icon: 'N', label: 'News' },
  { id: 'calendar', icon: 'C', label: 'Calendar' },
  { id: 'watchlists', icon: '☆', label: 'Lists' },
  { id: 'achievements', icon: '★', label: 'Awards' },
];
const traders = ['QT Alpha', 'Aizat', 'BanDa', 'KingKilo', 'DmacGFL', 'Regnant AI'];

function cx(...x: Array<string | false | undefined>) { return x.filter(Boolean).join(' '); }
function money(n: number) { return formatMoney(n); }
function fmt(n: number) { return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function payout(score: number) { return Math.max(68, Math.min(94, Math.round(score * 0.7 + 27))); }
function makeCandles(symbol: string, priceNow: number, tick: number): Candle[] {
  let previous = priceNow * 0.985;
  return Array.from({ length: 74 }, (_, i) => {
    const wave = Math.sin((i + tick) / 5.3) * 0.012;
    const micro = Math.cos((i + tick + symbol.length * 5) / 2.1) * 0.006;
    const trend = (i - 37) * 0.00034;
    const close = Math.max(0.0001, priceNow * (1 + wave + micro + trend));
    const open = previous;
    const high = Math.max(open, close) * 1.004;
    const low = Math.min(open, close) * 0.996;
    previous = close;
    return { t: i + 1, open, high, low, close, price: close, volume: 20 + Math.abs(Math.sin(i + tick)) * 80 };
  });
}

export function PocketTerminalV5() {
  const [panel, setPanel] = useState<Panel>('terminal');
  const [tick, setTick] = useState(1);
  const [selected, setSelected] = useState('BTC');
  const [binancePrice, setBinancePrice] = useState<number | null>(null);
  const [binanceStatus, setBinanceStatus] = useState<'connecting' | 'live' | 'offline'>('connecting');
  const [chartType, setChartType] = useState<ChartType>('Candles');
  const [expiry, setExpiry] = useState<Expiry>('30s');
  const [amount, setAmount] = useState(250);
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [auto, setAuto] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [closed, setClosed] = useState<Position[]>([]);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [feed, setFeed] = useState<Array<{ id: string; user: string; side: Side; symbol: string; amount: number }>>([]);

  useEffect(() => { const t = setInterval(() => setTick((v) => v + 1), 1300); return () => clearInterval(t); }, []);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE);
      if (saved) {
        const data = JSON.parse(saved) as Partial<{ balance: number; positions: Position[]; closed: Position[] }>;
        setBalance(data.balance ?? STARTING_BALANCE);
        setPositions(data.positions ?? []);
        setClosed(data.closed ?? []);
      }
    } catch { localStorage.removeItem(STORE); }
  }, []);
  useEffect(() => localStorage.setItem(STORE, JSON.stringify({ balance, positions, closed })), [balance, positions, closed]);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 2300); return () => clearTimeout(t); }, [notice]);

  useEffect(() => {
    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
      socket.onopen = () => setBinanceStatus('live');
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const livePrice = Number(data.p);
          if (!Number.isNaN(livePrice) && livePrice > 0) setBinancePrice(livePrice);
        } catch {}
      };
      socket.onerror = () => setBinanceStatus('offline');
      socket.onclose = () => setBinanceStatus((s) => (s === 'live' ? 'offline' : s));
    } catch {
      setBinanceStatus('offline');
    }
    return () => socket?.close();
  }, []);

  const assets: Asset[] = useMemo(() => baseAssets.map((a, i) => {
    const drift = Math.sin((tick + i * 3) / 5) * a.volatility + Math.cos((tick + i) / 7) * a.volatility * 0.6;
    const simulatedPrice = a.basePrice * (1 + drift);
    const isLiveBtc = a.symbol === 'BTC' && binancePrice;
    return { ...a, price: isLiveBtc ? binancePrice! : simulatedPrice, liveChange: a.change + drift * 100, payout: payout(a.score), live: Boolean(isLiveBtc) };
  }), [tick, binancePrice]);

  const asset = assets.find((a) => a.symbol === selected) || assets[0];
  const candles = useMemo(() => makeCandles(asset.symbol, asset.price, tick), [asset.symbol, asset.price, tick]);
  const livePositions = positions.map((p) => { const a = assets.find((x) => x.symbol === p.symbol); return a ? { ...p, current: a.price, pnl: calculatePnl(p.amount, p.entry, a.price, p.side) } : p; });
  const openPnl = livePositions.filter((p) => p.status === 'open').reduce((sum, p) => sum + p.pnl, 0);
  const equity = balance + openPnl;
  const filtered = assets.filter((a) => `${a.symbol} ${a.name} ${a.category}`.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const t = setInterval(() => {
      const side: Side = Math.random() > 0.5 ? 'LONG' : 'SHORT';
      const item = { id: `${Date.now()}-${Math.random()}`, user: traders[Math.floor(Math.random() * traders.length)], side, symbol: assets[Math.floor(Math.random() * assets.length)]?.symbol || 'BTC', amount: [25, 50, 100, 250, 500][Math.floor(Math.random() * 5)] };
      setFeed((v) => [item, ...v].slice(0, 10));
    }, 2500);
    return () => clearInterval(t);
  }, [assets]);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => openTrade(asset.liveChange >= 0 ? 'LONG' : 'SHORT', 50, 'pending'), 8000);
    return () => clearInterval(t);
  }, [auto, asset.symbol, asset.liveChange, balance]);

  function openTrade(side: Side, customAmount = amount, status: Position['status'] = 'open') {
    if (!canOpenTrade(balance, customAmount)) return setNotice('Demo balance is not enough');
    const next: Position = { id: `${Date.now()}-${Math.random()}`, symbol: asset.symbol, side, amount: customAmount, entry: asset.price, current: asset.price, pnl: 0, expiry, status };
    setBalance((v) => v - customAmount);
    setPositions((v) => [next, ...v]);
    setNotice(`${side === 'LONG' ? 'BUY' : 'SELL'} ${status} · ${asset.symbol}`);
  }
  function closeTrade(id: string) {
    const item = livePositions.find((p) => p.id === id);
    if (!item) return;
    setBalance((v) => v + item.amount + item.pnl);
    setPositions((v) => v.filter((p) => p.id !== id));
    setClosed((v) => [{ ...item }, ...v]);
    setNotice(`Closed ${item.symbol} · ${money(item.pnl)}`);
  }
  function activate(id: string) { setPositions((v) => v.map((p) => p.id === id ? { ...p, status: 'open' } : p)); }
  function reset() { setBalance(STARTING_BALANCE); setPositions([]); setClosed([]); setAuto(false); localStorage.removeItem(STORE); setNotice('Demo reset complete'); }

  return <main className="h-screen overflow-hidden bg-[#101524] text-white">
    <header className="flex h-12 items-center justify-between border-b border-white/10 bg-[#171d30] px-4">
      <div className="flex min-w-0 items-center gap-3"><div className="h-7 w-7 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600" /><b className="text-lg">Regnant<span className="text-cyan-300">X</span></b><Ticker assets={assets} setSelected={setSelected} /></div>
      <div className="flex items-center gap-2"><Pill label="BTC" value={binanceStatus === 'live' ? 'LIVE' : binanceStatus.toUpperCase()} active={binanceStatus === 'live'} /><Pill label="AI" value={`${asset.payout}%`} active /><button onClick={() => setAuto((v) => !v)} className={cx('rounded-xl px-3 py-2 text-xs font-black', auto ? 'bg-cyan-400 text-black' : 'bg-[#252c43]')}>AI AUTO {auto ? 'ON' : 'OFF'}</button><div className="rounded-xl bg-[#252c43] px-4 py-1 text-right"><p className="text-[10px] text-white/35">QT Demo</p><b className="text-cyan-200">{money(equity)}</b></div><button onClick={reset} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black">TOP UP</button></div>
    </header>
    <section className="grid h-[calc(100vh-48px)] grid-cols-[72px_1fr_310px_300px] overflow-hidden">
      <aside className="border-r border-white/10 bg-[#171d30] p-2">{tabs.map((t) => <button key={t.id} onClick={() => setPanel(t.id)} className={cx('mb-1 flex h-[45px] w-full flex-col items-center justify-center rounded-xl text-[9px]', panel === t.id ? 'bg-cyan-400/15 text-cyan-200' : 'text-white/55 hover:bg-white/5')}><span className="text-sm">{t.icon}</span>{t.label}</button>)}</aside>
      {panel === 'terminal' ? <><Chart asset={asset} candles={candles} chartType={chartType} setChartType={setChartType} /><Trade asset={asset} expiry={expiry} setExpiry={setExpiry} amount={amount} setAmount={setAmount} open={openTrade} auto={auto} /><Right positions={livePositions} closed={closed} close={closeTrade} activate={activate} assets={filtered} selected={selected} setSelected={setSelected} search={search} setSearch={setSearch} feed={feed} /></> : <Wide title={panel}><PanelView panel={panel} balance={balance} assets={filtered} selected={selected} setSelected={setSelected} search={search} setSearch={setSearch} closed={closed} feed={feed} /></Wide>}
    </section>
    {notice && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-cyan-300/30 bg-[#252c43] px-5 py-3 text-sm font-bold shadow-2xl">{notice}</div>}
  </main>;
}

function Pill({ label, value, active }: { label: string; value: string; active?: boolean }) { return <div className="rounded-xl bg-[#252c43] px-3 py-1 text-right"><p className="text-[9px] text-white/35">{label}</p><b className={active ? 'text-emerald-300' : 'text-cyan-200'}>{value}</b></div>; }
function Ticker({ assets, setSelected }: { assets: Asset[]; setSelected: (s: string) => void }) { return <div className="hidden max-w-[560px] gap-2 overflow-hidden lg:flex">{assets.slice(0, 6).map((a) => <button key={a.symbol} onClick={() => setSelected(a.symbol)} className="rounded-lg bg-[#252c43] px-3 py-1 text-xs"><b>{a.symbol}</b> <span className={a.live ? 'text-cyan-200' : a.liveChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{a.live ? fmt(a.price) : `${a.liveChange >= 0 ? '+' : ''}${a.liveChange.toFixed(2)}%`}</span></button>)}</div>; }
function Chart({ asset, candles, chartType, setChartType }: { asset: Asset; candles: Candle[]; chartType: ChartType; setChartType: (v: ChartType) => void }) { return <section className="relative bg-[#12182b]"><div className="flex h-12 items-center gap-2 border-b border-white/10 bg-[#171d30] px-4"><b className="rounded-lg bg-[#29324d] px-3 py-2">{asset.symbol}/USDT</b>{(['Line','Candles','Bars','Heikin Ashi'] as ChartType[]).map((t) => <button key={t} onClick={() => setChartType(t)} className={cx('rounded-lg px-3 py-2 text-xs font-bold', chartType === t ? 'bg-cyan-400 text-black' : 'bg-[#29324d]')}>{t}</button>)}<button className="rounded-lg bg-[#29324d] px-3 py-2 text-xs font-bold">Indicators</button><button className="rounded-lg bg-[#29324d] px-3 py-2 text-xs font-bold">Drawing</button><button className="rounded-lg bg-[#29324d] px-3 py-2 text-xs font-bold">Layout</button></div><div className="absolute left-4 top-16 z-10"><p className="text-xs text-white/40">{asset.name} {asset.live && <span className="text-cyan-200">· Binance live</span>}</p><h1 className="text-3xl font-black">{fmt(asset.price)}</h1><p className={asset.liveChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{asset.liveChange >= 0 ? '+' : ''}{asset.liveChange.toFixed(2)}%</p></div><div className="absolute right-4 top-16 z-10 w-60 rounded-2xl border border-cyan-400/20 bg-[#202841]/90 p-3"><b className="text-cyan-200">AI BOT</b><p className={asset.liveChange >= 0 ? 'mt-2 text-emerald-300' : 'mt-2 text-rose-300'}>{asset.liveChange >= 0 ? 'BUY pressure detected' : 'SELL pressure detected'}</p><div className="mt-3 h-2 rounded-full bg-black/30"><div className="h-2 rounded-full bg-cyan-400" style={{ width: `${asset.payout}%` }} /></div><p className="mt-2 text-xs text-white/40">Confidence {asset.payout}%</p></div><div className="h-[calc(100%-48px)] bg-[linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] bg-[size:80px_80px] p-4 pt-20"><MiniChart candles={candles} chartType={chartType} positive={asset.liveChange >= 0} /></div></section>; }
function MiniChart({ candles, chartType, positive }: { candles: Candle[]; chartType: ChartType; positive: boolean }) { if (chartType !== 'Line') return <ResponsiveContainer width="100%" height="100%"><ComposedChart data={candles} margin={{ right: 30, top: 20, bottom: 8 }}><XAxis dataKey="t" stroke="rgba(255,255,255,.25)" tickLine={false} axisLine={false} /><YAxis orientation="right" stroke="rgba(255,255,255,.25)" tickLine={false} axisLine={false} domain={['dataMin', 'dataMax']} tickFormatter={(v) => Number(v).toFixed(2)} /><Tooltip contentStyle={{ background: '#202841', border: '1px solid rgba(96,165,250,.25)', borderRadius: 12 }} /><Bar dataKey="volume" opacity={0.12} fill={positive ? '#31b545' : '#ff3b30'} /><Line type="monotone" dataKey="close" stroke={positive ? '#60a5fa' : '#f43f5e'} strokeWidth={3} dot={false} /></ComposedChart></ResponsiveContainer>; return <ResponsiveContainer width="100%" height="100%"><AreaChart data={candles} margin={{ right: 30, top: 20, bottom: 8 }}><XAxis dataKey="t" stroke="rgba(255,255,255,.25)" tickLine={false} axisLine={false} /><YAxis orientation="right" stroke="rgba(255,255,255,.25)" tickLine={false} axisLine={false} domain={['dataMin', 'dataMax']} tickFormatter={(v) => Number(v).toFixed(2)} /><Tooltip contentStyle={{ background: '#202841', border: '1px solid rgba(96,165,250,.25)', borderRadius: 12 }} formatter={(v) => [fmt(Number(v)), 'Price']} /><Area type="monotone" dataKey="price" stroke={positive ? '#60a5fa' : '#f43f5e'} strokeWidth={2.5} fillOpacity={0.22} fill={positive ? '#60a5fa' : '#f43f5e'} /></AreaChart></ResponsiveContainer>; }
function Trade({ asset, expiry, setExpiry, amount, setAmount, open, auto }: { asset: Asset; expiry: Expiry; setExpiry: (e: Expiry) => void; amount: number; setAmount: (n: number) => void; open: (s: Side, a?: number, st?: Position['status']) => void; auto: boolean }) { return <aside className="border-l border-white/10 bg-[#22283c] p-4"><p className="text-xs text-white/40">Payout</p><div className="mb-4 rounded-xl border border-emerald-400/20 bg-black/20 p-3 text-center"><p className="text-emerald-300">+{asset.payout}%</p><p className="text-xs text-white/40">+{money(amount * asset.payout / 100)}</p></div><p className="text-xs text-white/45">Time</p><div className="mt-2 grid grid-cols-4 gap-2">{(['5s','15s','30s','1m'] as Expiry[]).map((e) => <button key={e} onClick={() => setExpiry(e)} className={cx('rounded-lg py-2 text-xs font-bold', expiry === e ? 'bg-cyan-400 text-black' : 'bg-[#171c2f] text-white/60')}>{e}</button>)}</div><p className="mt-4 text-xs text-white/45">Amount</p><input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#171c2f] px-4 py-3 text-xl font-black outline-none" /><button onClick={() => open('LONG')} className="mt-4 w-full rounded-xl bg-[#31b545] py-4 text-lg font-black">BUY</button><button onClick={() => open('SHORT')} className="mt-3 w-full rounded-xl bg-[#ff3b30] py-4 text-lg font-black">SELL</button><button onClick={() => open(asset.liveChange >= 0 ? 'LONG' : 'SHORT', 100, 'pending')} className={cx('mt-4 w-full rounded-xl py-4 text-lg font-black text-white', auto ? 'bg-cyan-400' : 'bg-[#2e3b57]')}>AI TRADING</button></aside>; }
function Right({ positions, closed, close, activate, assets, selected, setSelected, search, setSearch, feed }: { positions: Position[]; closed: Position[]; close: (id: string) => void; activate: (id: string) => void; assets: Asset[]; selected: string; setSelected: (s: string) => void; search: string; setSearch: (s: string) => void; feed: Array<{ id: string; user: string; side: Side; symbol: string; amount: number }> }) { const [tab, setTab] = useState<'opened'|'closed'|'pending'|'signals'|'social'>('opened'); const opened = positions.filter((p) => p.status === 'open'); const pending = positions.filter((p) => p.status === 'pending'); return <aside className="border-l border-white/10 bg-[#1b2135]"><div className="border-b border-white/10 p-3 text-center font-bold">Trades</div><div className="grid grid-cols-5 border-b border-white/10 text-[10px]">{(['opened','closed','pending','signals','social'] as const).map((x) => <button key={x} onClick={() => setTab(x)} className={cx('py-2 capitalize', tab === x ? 'border-b border-cyan-400 text-cyan-200' : 'text-white/45')}>{x}</button>)}</div><div className="max-h-[210px] overflow-auto p-3">{tab === 'opened' && <Rows rows={opened} close={close} activate={activate} />}{tab === 'pending' && <Rows rows={pending} close={close} activate={activate} />}{tab === 'closed' && <Rows rows={closed} close={() => {}} activate={() => {}} />}{tab === 'signals' && assets.slice(0, 4).map((a) => <p key={a.symbol} className="mb-2 rounded-xl bg-[#252c43] p-3 text-xs"><b>{a.symbol}</b> · {a.liveChange >= 0 ? 'BUY' : 'SELL'} signal · {a.payout}%</p>)}{tab === 'social' && feed.slice(0, 4).map((f) => <p key={f.id} className="mb-2 rounded-xl bg-[#252c43] p-3 text-xs"><span className={f.side === 'LONG' ? 'text-emerald-300' : 'text-rose-300'}>{f.user}</span> {f.side === 'LONG' ? 'BUY' : 'SELL'} {f.symbol} · ${f.amount}</p>)}</div><div className="border-y border-white/10 p-3"><b className="text-sm">Live Trade Feed</b>{feed.slice(0, 3).map((f) => <p key={f.id} className="mt-2 text-xs text-white/55"><span className={f.side === 'LONG' ? 'text-emerald-300' : 'text-rose-300'}>{f.user}</span> {f.side === 'LONG' ? 'BUY' : 'SELL'} {f.symbol} · ${f.amount}</p>)}</div><div className="border-b border-white/10 p-3"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assets" className="w-full rounded-lg bg-[#111528] px-3 py-2 text-sm outline-none" /></div><div className="max-h-[calc(100vh-500px)] overflow-auto p-3">{assets.slice(0, 12).map((a) => <button key={a.symbol} onClick={() => setSelected(a.symbol)} className={cx('mb-2 grid w-full grid-cols-[1fr_auto] rounded-xl p-3 text-left', selected === a.symbol ? 'bg-cyan-400/15' : 'bg-[#252c43] hover:bg-[#303851]')}><span><b>{a.symbol}</b><p className="text-xs text-white/40">{a.name}</p></span><span className="text-sm text-cyan-200">+{a.payout}%</span></button>)}</div></aside>; }
function Rows({ rows, close, activate }: { rows: Position[]; close: (id: string) => void; activate: (id: string) => void }) { if (!rows.length) return <p className="py-6 text-center text-sm text-white/45">No trades</p>; return <>{rows.map((p) => <div key={p.id} className="mb-2 rounded-xl bg-[#252c43] p-3"><div className="flex justify-between"><b>{p.symbol}</b><span className={p.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{money(p.pnl)}</span></div><p className="text-xs text-white/45">{p.status} · {p.side} · {p.expiry} · {money(p.amount)}</p>{p.status === 'pending' && <button onClick={() => activate(p.id)} className="mr-2 mt-2 rounded-lg bg-cyan-500 px-3 py-1 text-xs font-bold">Activate</button>}<button onClick={() => close(p.id)} className="mt-2 rounded-lg bg-white/10 px-3 py-1 text-xs">Close</button></div>)}</>; }
function Wide({ title, children }: { title: string; children: React.ReactNode }) { return <section className="col-span-3 overflow-auto bg-[#111528] p-6"><h1 className="mb-5 capitalize text-3xl font-black">{title}</h1>{children}</section>; }
function PanelView({ panel, balance, assets, selected, setSelected, search, setSearch, closed, feed }: { panel: Panel; balance: number; assets: Asset[]; selected: string; setSelected: (s: string) => void; search: string; setSearch: (s: string) => void; closed: Position[]; feed: Array<{ id: string; user: string; side: Side; symbol: string; amount: number }> }) { if (panel === 'market') return <Market assets={assets} selected={selected} setSelected={setSelected} search={search} setSearch={setSearch} />; if (panel === 'finance') return <Finance balance={balance} closed={closed} />; if (panel === 'signals') return <Signals assets={assets} setSelected={setSelected} />; if (panel === 'social') return <Social />; if (panel === 'news') return <Simple items={['BTC ETF inflows remain strong', 'ETH volatility rises before US session', 'SOL breaks short term resistance', 'Market waits for CPI data']} />; if (panel === 'calendar') return <Simple items={['15:30 · US CPI · High impact', '16:45 · Manufacturing PMI · Medium', '18:00 · Fed speaker · High']} />; if (panel === 'watchlists') return <Market assets={assets} selected={selected} setSelected={setSelected} search={search} setSearch={setSearch} />; if (panel === 'achievements') return <Simple items={['First Trade', 'Profit Maker', 'Copy Trader', 'AI User']} />; return null; }
function Market({ assets, selected, setSelected, search, setSearch }: { assets: Asset[]; selected: string; setSelected: (s: string) => void; search: string; setSearch: (s: string) => void }) { return <div className="max-w-5xl"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="mb-4 w-full rounded-lg bg-[#202841] px-4 py-3 outline-none" />{assets.map((a) => <button key={a.symbol} onClick={() => setSelected(a.symbol)} className={cx('mb-2 flex w-full justify-between rounded-lg px-4 py-3', selected === a.symbol ? 'bg-cyan-400/15' : 'bg-[#202841]')}><span>☆ {a.name} OTC</span><span>{a.live ? fmt(a.price) : `+${a.payout}%`}</span></button>)}</div>; }
function Signals({ assets, setSelected }: { assets: Asset[]; setSelected: (s: string) => void }) { return <div className="grid max-w-3xl gap-3">{assets.slice(0, 12).map((a, i) => <button key={a.symbol} onClick={() => setSelected(a.symbol)} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-xl bg-[#202841] p-4 text-left"><div><b>{a.symbol}/USDT OTC</b><p className="text-xs text-white/40">Copied: {i * 2} times · just now</p></div><span className={a.liveChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{a.liveChange >= 0 ? '⇈' : '⇊'}</span><span className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold">Copy signal</span></button>)}</div>; }
function Social() { return <div className="grid max-w-2xl gap-2">{traders.map((u, i) => <div key={u} className="grid grid-cols-[48px_1fr_auto] items-center gap-3 rounded-xl bg-[#202841] p-3"><div className="h-11 w-11 rounded-full bg-cyan-400/20" /><div><b>{u}</b><p className="text-xs text-white/40">Trades: {46 + i * 73} · {100 - i * 7}% profitable</p></div><button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold">Copy</button></div>)}</div>; }
function Finance({ balance, closed }: { balance: number; closed: Position[] }) { return <div><div className="mb-6 rounded-2xl bg-[#202841] p-5"><p className="text-white/45">Demo balance</p><p className="text-4xl font-black text-cyan-200">{money(balance)}</p></div><h2 className="mt-8 text-xl font-black">Wallet / Trade History</h2>{closed.length === 0 ? <p className="mt-3 text-white/45">No wallet history yet.</p> : closed.map((x) => <div key={x.id} className="mt-2 flex max-w-3xl justify-between rounded-xl bg-[#202841] p-3"><span>{x.symbol} · {x.side}</span><span className={x.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{money(x.pnl)}</span></div>)}</div>; }
function Simple({ items }: { items: string[] }) { return <div className="grid max-w-3xl gap-3">{items.map((x) => <button key={x} className="rounded-xl bg-[#202841] p-5 text-left text-lg">{x}</button>)}</div>; }
