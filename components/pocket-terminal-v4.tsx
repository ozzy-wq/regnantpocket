'use client';

import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { assets as baseAssets, STARTING_BALANCE } from '@/data/market';
import { calculatePnl, canOpenTrade, formatMoney } from '@/lib/trading';

type Side = 'LONG' | 'SHORT';
type Panel = 'terminal' | 'finance' | 'market' | 'signals' | 'social' | 'leaderboard' | 'news' | 'calendar' | 'watchlists' | 'achievements' | 'tournaments' | 'promo' | 'friends' | 'hotkeys';
type Expiry = '5s' | '15s' | '30s' | '1m';
type ChartType = 'Line' | 'Candles' | 'Bars' | 'Heikin Ashi';
type Layout = '1' | '2' | '3' | '4';
type Position = { id: string; symbol: string; side: Side; amount: number; entry: number; current: number; pnl: number; expiry: Expiry; openedAt: string; status: 'open' | 'pending' };
type Asset = typeof baseAssets[number] & { price: number; liveChange: number; payout: number };
type Feed = { id: string; user: string; side: Side; symbol: string; amount: number };

type Candle = { t: number; open: number; high: number; low: number; close: number; price: number; volume: number };

const STORE = 'regnantx-terminal-v4';
const traders = ['QT Alpha', 'Aizat', 'BanDa', 'KingKilo', 'DmacGFL', 'Regnant AI', 'user1315', 'Maverick'];
const tabs: Array<{ id: Panel; icon: string; label: string }> = [
  { id: 'terminal', icon: '↗', label: 'Trade' },
  { id: 'finance', icon: '$', label: 'Finance' },
  { id: 'market', icon: '◆', label: 'Market' },
  { id: 'signals', icon: '⇅', label: 'Signals' },
  { id: 'social', icon: '♚', label: 'Social' },
  { id: 'friends', icon: '☷', label: 'Friends' },
  { id: 'tournaments', icon: '♛', label: 'Tour' },
  { id: 'achievements', icon: '★', label: 'Awards' },
  { id: 'promo', icon: '◉', label: 'Promo' },
  { id: 'leaderboard', icon: '≡', label: 'Board' },
  { id: 'news', icon: 'N', label: 'News' },
  { id: 'calendar', icon: 'C', label: 'Calendar' },
  { id: 'watchlists', icon: '☆', label: 'Lists' },
  { id: 'hotkeys', icon: '⌘', label: 'Keys' }
];

function cx(...items: Array<string | false | undefined>) { return items.filter(Boolean).join(' '); }
function money(n: number) { return formatMoney(n); }
function fmt(n: number) { const d = n >= 100 ? 2 : n >= 1 ? 3 : 5; return `$${n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`; }
function now() { return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
function payout(score: number) { return Math.max(68, Math.min(94, Math.round(score * 0.7 + 27))); }
function makeCandles(symbol: string, priceNow: number, tick: number): Candle[] {
  let prev = priceNow * 0.985;
  return Array.from({ length: 74 }, (_, i) => {
    const wave = Math.sin((i + tick) / 5.3) * 0.012;
    const micro = Math.cos((i + tick + symbol.length * 5) / 2.1) * 0.006;
    const trend = (i - 37) * 0.00034;
    const close = Math.max(0.0001, priceNow * (1 + wave + micro + trend));
    const open = prev;
    const high = Math.max(open, close) * (1 + 0.002 + Math.abs(Math.sin(i + tick)) * 0.002);
    const low = Math.min(open, close) * (1 - 0.002 - Math.abs(Math.cos(i + tick)) * 0.002);
    prev = close;
    return { t: i + 1, open, high, low, close, price: close, volume: 20 + Math.abs(Math.sin(i + tick)) * 80 };
  });
}

export function PocketTerminalV4() {
  const [panel, setPanel] = useState<Panel>('terminal');
  const [tick, setTick] = useState(1);
  const [selected, setSelected] = useState('BTC');
  const [expiry, setExpiry] = useState<Expiry>('30s');
  const [amount, setAmount] = useState(250);
  const [chartType, setChartType] = useState<ChartType>('Candles');
  const [layout, setLayout] = useState<Layout>('1');
  const [indicator, setIndicator] = useState('RSI');
  const [tool, setTool] = useState('Trend');
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [auto, setAuto] = useState(false);
  const [sound, setSound] = useState(false);
  const [copy, setCopy] = useState('');
  const [watch, setWatch] = useState('Crypto Majors');
  const [positions, setPositions] = useState<Position[]>([]);
  const [closed, setClosed] = useState<Position[]>([]);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [feed, setFeed] = useState<Feed[]>([]);

  useEffect(() => { const timer = setInterval(() => setTick((v) => v + 1), 1300); return () => clearInterval(timer); }, []);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORE);
      if (stored) {
        const data = JSON.parse(stored) as Partial<{ balance: number; positions: Position[]; closed: Position[]; copy: string; watch: string; sound: boolean }>;
        setBalance(data.balance ?? STARTING_BALANCE);
        setPositions(data.positions ?? []);
        setClosed(data.closed ?? []);
        setCopy(data.copy ?? '');
        setWatch(data.watch ?? 'Crypto Majors');
        setSound(Boolean(data.sound));
      }
    } catch { localStorage.removeItem(STORE); }
  }, []);
  useEffect(() => localStorage.setItem(STORE, JSON.stringify({ balance, positions, closed, copy, watch, sound })), [balance, positions, closed, copy, watch, sound]);

  const assets: Asset[] = useMemo(() => baseAssets.map((a, i) => {
    const drift = Math.sin((tick + i * 3) / 5) * a.volatility + Math.cos((tick + i) / 7) * a.volatility * 0.6;
    return { ...a, price: a.basePrice * (1 + drift), liveChange: a.change + drift * 100, payout: payout(a.score) };
  }), [tick]);
  const asset = assets.find((a) => a.symbol === selected) || assets[0];
  const candles = useMemo(() => makeCandles(asset.symbol, asset.price, tick), [asset.symbol, asset.price, tick]);
  const live = positions.map((p) => { const a = assets.find((x) => x.symbol === p.symbol); return a ? { ...p, current: a.price, pnl: calculatePnl(p.amount, p.entry, a.price, p.side) } : p; });
  const openPnl = live.filter((p) => p.status === 'open').reduce((sum, p) => sum + p.pnl, 0);
  const equity = balance + openPnl;
  const filtered = assets.filter((a) => `${a.symbol} ${a.name} ${a.category}`.toLowerCase().includes(search.toLowerCase()));
  const aiConfidence = asset.payout;
  const marketState = asset.liveChange >= 0 ? 'Risk-on' : 'Risk-off';
  const fearGreed = Math.round(Math.max(12, Math.min(91, 55 + asset.liveChange * 6)));

  useEffect(() => {
    const t = setInterval(() => {
      const side: Side = Math.random() > 0.5 ? 'LONG' : 'SHORT';
      const item: Feed = { id: `${Date.now()}-${Math.random()}`, user: traders[Math.floor(Math.random() * traders.length)], side, symbol: assets[Math.floor(Math.random() * assets.length)]?.symbol || 'BTC', amount: [25, 50, 100, 250, 500][Math.floor(Math.random() * 5)] };
      setFeed((v) => [item, ...v].slice(0, 12));
    }, 2400);
    return () => clearInterval(t);
  }, [assets]);
  useEffect(() => { if (!auto) return; const t = setInterval(() => openTrade(asset.liveChange >= 0 ? 'LONG' : 'SHORT', 50, 'pending'), 8000); return () => clearInterval(t); }, [auto, asset.liveChange, asset.symbol, balance]);
  useEffect(() => { if (!copy) return; const t = setInterval(() => openTrade(Math.random() > 0.5 ? 'LONG' : 'SHORT', 25, 'pending'), 11000); return () => clearInterval(t); }, [copy, asset.symbol, balance]);
  useEffect(() => {
    if (!notice) return;
    if (sound) { try { new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQQAAAAAAA==').play(); } catch {} }
    const t = setTimeout(() => setNotice(''), 2400); return () => clearTimeout(t);
  }, [notice, sound]);

  function openTrade(side: Side, amt = amount, status: Position['status'] = 'open') {
    if (!canOpenTrade(balance, amt)) return setNotice('Demo balance is not enough');
    const next: Position = { id: `${Date.now()}-${Math.random()}`, symbol: asset.symbol, side, amount: amt, entry: asset.price, current: asset.price, pnl: 0, expiry, openedAt: now(), status };
    setBalance((v) => v - amt); setPositions((v) => [next, ...v]); setNotice(`${side === 'LONG' ? 'BUY' : 'SELL'} ${status} · ${asset.symbol}`);
  }
  function closeTrade(id: string) {
    const p = live.find((x) => x.id === id); if (!p) return;
    setBalance((v) => v + p.amount + p.pnl); setPositions((v) => v.filter((x) => x.id !== id)); setClosed((v) => [{ ...p }, ...v]); setNotice(`Closed ${p.symbol} · ${money(p.pnl)}`);
  }
  function activate(id: string) { setPositions((v) => v.map((p) => p.id === id ? { ...p, status: 'open' } : p)); setNotice('Pending trade activated'); }
  function reset() { setBalance(STARTING_BALANCE); setPositions([]); setClosed([]); setAuto(false); setCopy(''); localStorage.removeItem(STORE); setNotice('Demo reset complete'); }

  return <main className="h-screen overflow-hidden bg-[#101524] text-white">
    <header className="flex h-12 items-center justify-between border-b border-white/10 bg-[#171d30] px-4">
      <div className="flex min-w-0 items-center gap-3"><div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600" /><b className="text-lg">Regnant<span className="text-cyan-300">X</span></b><Ticker assets={assets} setSelected={setSelected} /></div>
      <div className="flex items-center gap-2"><InfoPill label="Market" value={marketState} /><InfoPill label="F&G" value={`${fearGreed}/100`} /><InfoPill label="AI" value={`${aiConfidence}%`} /><button onClick={() => setSound((v) => !v)} className={cx('rounded-xl px-3 py-2 text-xs font-black', sound ? 'bg-purple-500' : 'bg-[#252c43]')}>SOUND {sound ? 'ON' : 'OFF'}</button><button onClick={() => setAuto((v) => !v)} className={cx('rounded-xl px-3 py-2 text-xs font-black', auto ? 'bg-cyan-400 text-black' : 'bg-[#252c43]')}>AI AUTO {auto ? 'ON' : 'OFF'}</button>{copy && <button onClick={() => setCopy('')} className="rounded-xl bg-purple-500 px-3 py-2 text-xs font-black">COPY {copy}</button>}<div className="rounded-xl bg-[#252c43] px-4 py-1 text-right"><p className="text-[10px] text-white/35">QT Demo</p><b className="text-cyan-200">{money(equity)}</b></div><button onClick={reset} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black">TOP UP</button></div>
    </header>
    <section className="grid h-[calc(100vh-48px)] grid-cols-[72px_1fr_310px_300px] overflow-hidden">
      <aside className="border-r border-white/10 bg-[#171d30] p-2">{tabs.map((t) => <button key={t.id} onClick={() => setPanel(t.id)} className={cx('mb-1 flex h-[39px] w-full flex-col items-center justify-center rounded-xl text-[8px]', panel === t.id ? 'bg-cyan-400/15 text-cyan-200' : 'text-white/55 hover:bg-white/5')}><span className="text-sm">{t.icon}</span>{t.label}</button>)}</aside>
      {panel === 'terminal' ? <><ChartDesk asset={asset} candles={candles} chartType={chartType} setChartType={setChartType} indicator={indicator} setIndicator={setIndicator} tool={tool} setTool={setTool} layout={layout} setLayout={setLayout} /><TradeDesk asset={asset} expiry={expiry} setExpiry={setExpiry} amount={amount} setAmount={setAmount} open={openTrade} auto={auto} /><SideDesk positions={live} close={closeTrade} activate={activate} assets={filtered} selected={selected} setSelected={setSelected} search={search} setSearch={setSearch} feed={feed} closed={closed} /></> : <Wide title={panel}><PanelView panel={panel} balance={balance} assets={filtered} selected={selected} setSelected={setSelected} search={search} setSearch={setSearch} feed={feed} closed={closed} copy={copy} setCopy={setCopy} watch={watch} setWatch={setWatch} /></Wide>}
    </section>
    {notice && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-cyan-300/30 bg-[#252c43] px-5 py-3 text-sm font-bold shadow-2xl">{notice}</div>}
  </main>;
}

function InfoPill({ label, value }: { label: string; value: string }) { return <div className="hidden rounded-xl bg-[#252c43] px-3 py-1 text-right xl:block"><p className="text-[9px] text-white/35">{label}</p><b className="text-xs text-cyan-200">{value}</b></div>; }
function Ticker({ assets, setSelected }: { assets: Asset[]; setSelected: (s: string) => void }) { return <div className="hidden max-w-[530px] gap-2 overflow-hidden lg:flex">{assets.slice(0, 6).map((a) => <button key={a.symbol} onClick={() => setSelected(a.symbol)} className="rounded-lg bg-[#252c43] px-3 py-1 text-xs"><b>{a.symbol}</b> <span className={a.liveChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{a.liveChange >= 0 ? '+' : ''}{a.liveChange.toFixed(2)}%</span></button>)}</div>; }

function ChartDesk({ asset, candles, chartType, setChartType, indicator, setIndicator, tool, setTool, layout, setLayout }: { asset: Asset; candles: Candle[]; chartType: ChartType; setChartType: (v: ChartType) => void; indicator: string; setIndicator: (v: string) => void; tool: string; setTool: (v: string) => void; layout: Layout; setLayout: (v: Layout) => void }) {
  const charts = layout === '1' ? 1 : layout === '2' ? 2 : layout === '3' ? 3 : 4;
  return <section className="relative overflow-hidden bg-[#12182b]">
    <div className="flex h-12 items-center gap-2 border-b border-white/10 bg-[#171d30] px-4"><b className="rounded-lg bg-[#29324d] px-3 py-2">{asset.symbol}/USDT</b><Toolbar title="Chart" items={['Line', 'Candles', 'Bars', 'Heikin Ashi']} active={chartType} onPick={(x) => setChartType(x as ChartType)} /><Toolbar title="Indicators" items={['RSI', 'MACD', 'Bollinger', 'Moving Average', 'Volume']} active={indicator} onPick={setIndicator} /><Toolbar title="Drawing" items={['Fibo', 'Trend', 'Rectangle', 'Ray', 'Channel']} active={tool} onPick={setTool} /><Toolbar title="Layout" items={['1', '2', '3', '4']} active={layout} onPick={(x) => setLayout(x as Layout)} /></div>
    <div className="pointer-events-none absolute left-4 top-16 z-10"><p className="text-xs text-white/40">{asset.name}</p><h1 className="text-3xl font-black">{fmt(asset.price)}</h1><p className={asset.liveChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{asset.liveChange >= 0 ? '+' : ''}{asset.liveChange.toFixed(2)}%</p></div>
    <AiBadge asset={asset} indicator={indicator} tool={tool} />
    <div className={cx('h-[calc(100%-48px)] bg-[linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] bg-[size:80px_80px] p-4 pt-20', charts > 1 && 'grid gap-2', charts === 2 && 'grid-cols-2', charts > 2 && 'grid-cols-2')}>{Array.from({ length: charts }, (_, i) => <MiniChart key={i} candles={candles.map((c) => ({ ...c, price: c.price * (1 + i * 0.002), close: c.close * (1 + i * 0.002) }))} chartType={chartType} positive={i % 2 === 0 ? asset.liveChange >= 0 : asset.liveChange < 0} />)}</div>
  </section>;
}
function Toolbar({ title, items, active, onPick }: { title: string; items: string[]; active: string; onPick: (v: string) => void }) { return <div className="group relative"><button className="rounded-lg bg-[#29324d] px-3 py-2 text-xs font-bold">{title}: <span className="text-cyan-200">{active}</span></button><div className="invisible absolute left-0 top-10 z-30 w-48 rounded-2xl border border-white/10 bg-[#252c43] p-2 opacity-0 shadow-2xl transition group-hover:visible group-hover:opacity-100">{items.map((x) => <button key={x} onClick={() => onPick(x)} className={cx('block w-full rounded-xl px-3 py-2 text-left text-xs', active === x ? 'bg-cyan-400 text-black' : 'hover:bg-white/10')}>{x}</button>)}</div></div>; }
function MiniChart({ candles, chartType, positive }: { candles: Candle[]; chartType: ChartType; positive: boolean }) {
  if (chartType === 'Bars' || chartType === 'Candles' || chartType === 'Heikin Ashi') return <ResponsiveContainer width="100%" height="100%"><ComposedChart data={candles} margin={{ right: 30, top: 20, bottom: 8 }}><XAxis dataKey="t" stroke="rgba(255,255,255,.25)" tickLine={false} axisLine={false} /><YAxis orientation="right" stroke="rgba(255,255,255,.25)" tickLine={false} axisLine={false} domain={['dataMin', 'dataMax']} tickFormatter={(v) => Number(v).toFixed(2)} /><Tooltip contentStyle={{ background: '#202841', border: '1px solid rgba(96,165,250,.25)', borderRadius: 12 }} /><Bar dataKey="volume" yAxisId={1} opacity={0.16}>{candles.map((c) => <Cell key={c.t} fill={c.close >= c.open ? '#31b545' : '#ff3b30'} />)}</Bar><Line type="monotone" dataKey="close" stroke={positive ? '#60a5fa' : '#f43f5e'} strokeWidth={chartType === 'Candles' ? 3 : 2} dot={false} /></ComposedChart></ResponsiveContainer>;
  return <ResponsiveContainer width="100%" height="100%"><AreaChart data={candles} margin={{ right: 30, top: 20, bottom: 8 }}><XAxis dataKey="t" stroke="rgba(255,255,255,.25)" tickLine={false} axisLine={false} /><YAxis orientation="right" stroke="rgba(255,255,255,.25)" tickLine={false} axisLine={false} domain={['dataMin', 'dataMax']} tickFormatter={(v) => Number(v).toFixed(2)} /><Tooltip contentStyle={{ background: '#202841', border: '1px solid rgba(96,165,250,.25)', borderRadius: 12 }} formatter={(v) => [fmt(Number(v)), 'Price']} /><Area type="monotone" dataKey="price" stroke={positive ? '#60a5fa' : '#f43f5e'} strokeWidth={2.5} fillOpacity={0.22} fill={positive ? '#60a5fa' : '#f43f5e'} /></AreaChart></ResponsiveContainer>;
}
function AiBadge({ asset, indicator, tool }: { asset: Asset; indicator: string; tool: string }) { return <div className="absolute right-4 top-16 z-10 w-60 rounded-2xl border border-cyan-400/20 bg-[#202841]/90 p-3"><div className="flex justify-between"><b className="text-cyan-200">AI BOT</b><span className="h-2 w-2 rounded-full bg-emerald-400" /></div><p className={asset.liveChange >= 0 ? 'mt-2 text-emerald-300' : 'mt-2 text-rose-300'}>{asset.liveChange >= 0 ? 'BUY pressure detected' : 'SELL pressure detected'}</p><div className="mt-3 h-2 rounded-full bg-black/30"><div className="h-2 rounded-full bg-cyan-400" style={{ width: `${asset.payout}%` }} /></div><p className="mt-2 text-xs text-white/40">Confidence {asset.payout}% · {indicator} · {tool}</p></div>; }
function TradeDesk({ asset, expiry, setExpiry, amount, setAmount, open, auto }: { asset: Asset; expiry: Expiry; setExpiry: (e: Expiry) => void; amount: number; setAmount: (n: number) => void; open: (s: Side, a?: number, st?: Position['status']) => void; auto: boolean }) { return <aside className="border-l border-white/10 bg-[#22283c] p-4"><p className="text-xs text-white/40">Payout</p><div className="mb-4 rounded-xl border border-emerald-400/20 bg-black/20 p-3 text-center"><p className="text-emerald-300">+{asset.payout}%</p><p className="text-xs text-white/40">+{money(amount * asset.payout / 100)}</p></div><p className="text-xs text-white/45">Time</p><div className="mt-2 grid grid-cols-4 gap-2">{(['5s', '15s', '30s', '1m'] as Expiry[]).map((e) => <button key={e} onClick={() => setExpiry(e)} className={cx('rounded-lg py-2 text-xs font-bold', expiry === e ? 'bg-cyan-400 text-black' : 'bg-[#171c2f] text-white/60')}>{e}</button>)}</div><p className="mt-4 text-xs text-white/45">Amount</p><input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#171c2f] px-4 py-3 text-xl font-black outline-none" /><button onClick={() => open('LONG')} className="mt-4 w-full rounded-xl bg-[#31b545] py-4 text-lg font-black">BUY</button><button onClick={() => open('SHORT')} className="mt-3 w-full rounded-xl bg-[#ff3b30] py-4 text-lg font-black">SELL</button><button onClick={() => open(asset.liveChange >= 0 ? 'LONG' : 'SHORT', 100, 'pending')} className={cx('mt-4 w-full rounded-xl py-4 text-lg font-black text-white shadow-[0_0_30px_rgba(34,211,238,.35)]', auto ? 'bg-cyan-400' : 'bg-[#2e3b57]')}>AI TRADING</button><div className="mt-5 rounded-2xl bg-black/15 p-3"><b className="text-sm">Hotkeys</b><p className="mt-2 text-xs text-white/50">Shift+W Buy · Shift+S Sell · Shift+Tab Next</p></div></aside>; }
function SideDesk({ positions, close, activate, assets, selected, setSelected, search, setSearch, feed, closed }: { positions: Position[]; close: (id: string) => void; activate: (id: string) => void; assets: Asset[]; selected: string; setSelected: (s: string) => void; search: string; setSearch: (s: string) => void; feed: Feed[]; closed: Position[] }) { const [tab, setTab] = useState<'opened' | 'closed' | 'pending' | 'signals' | 'social'>('opened'); const pending = positions.filter((p) => p.status === 'pending'); const opened = positions.filter((p) => p.status === 'open'); return <aside className="border-l border-white/10 bg-[#1b2135]"><div className="border-b border-white/10 p-3 text-center font-bold">Trades</div><div className="grid grid-cols-5 border-b border-white/10 text-[10px]">{(['opened', 'closed', 'pending', 'signals', 'social'] as const).map((x) => <button key={x} onClick={() => setTab(x)} className={cx('py-2 capitalize', tab === x ? 'border-b border-cyan-400 text-cyan-200' : 'text-white/45')}>{x}</button>)}</div><div className="max-h-[210px] overflow-auto p-3">{tab === 'opened' && <TradeRows rows={opened} close={close} activate={activate} />}{tab === 'pending' && <TradeRows rows={pending} close={close} activate={activate} />}{tab === 'closed' && <TradeRows rows={closed} close={() => {}} activate={() => {}} />}{tab === 'signals' && assets.slice(0, 4).map((a) => <p key={a.symbol} className="mb-2 rounded-xl bg-[#252c43] p-3 text-xs"><b>{a.symbol}</b> · {a.liveChange >= 0 ? 'BUY' : 'SELL'} signal · {a.payout}%</p>)}{tab === 'social' && feed.slice(0, 4).map((f) => <p key={f.id} className="mb-2 rounded-xl bg-[#252c43] p-3 text-xs"><span className={f.side === 'LONG' ? 'text-emerald-300' : 'text-rose-300'}>{f.user}</span> {f.side === 'LONG' ? 'BUY' : 'SELL'} {f.symbol} · ${f.amount}</p>)}</div><div className="border-y border-white/10 p-3"><b className="text-sm">Live Trade Feed</b>{feed.slice(0, 3).map((f) => <p key={f.id} className="mt-2 text-xs text-white/55"><span className={f.side === 'LONG' ? 'text-emerald-300' : 'text-rose-300'}>{f.user}</span> {f.side === 'LONG' ? 'BUY' : 'SELL'} {f.symbol} · ${f.amount}</p>)}</div><div className="border-b border-white/10 p-3"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assets" className="w-full rounded-lg bg-[#111528] px-3 py-2 text-sm outline-none" /></div><div className="max-h-[calc(100vh-500px)] overflow-auto p-3">{assets.slice(0, 12).map((a) => <button key={a.symbol} onClick={() => setSelected(a.symbol)} className={cx('mb-2 grid w-full grid-cols-[1fr_auto] rounded-xl p-3 text-left', selected === a.symbol ? 'bg-cyan-400/15' : 'bg-[#252c43] hover:bg-[#303851]')}><span><b>{a.symbol}</b><p className="text-xs text-white/40">{a.name}</p></span><span className="text-sm text-cyan-200">+{a.payout}%</span></button>)}</div></aside>; }
function TradeRows({ rows, close, activate }: { rows: Position[]; close: (id: string) => void; activate: (id: string) => void }) { if (!rows.length) return <p className="py-6 text-center text-sm text-white/45">No trades</p>; return <>{rows.map((p) => <div key={p.id} className="mb-2 rounded-xl bg-[#252c43] p-3"><div className="flex justify-between"><b>{p.symbol}</b><span className={p.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{money(p.pnl)}</span></div><p className="text-xs text-white/45">{p.status} · {p.side} · {p.expiry} · {money(p.amount)}</p>{p.status === 'pending' && <button onClick={() => activate(p.id)} className="mr-2 mt-2 rounded-lg bg-cyan-500 px-3 py-1 text-xs font-bold">Activate</button>}<button onClick={() => close(p.id)} className="mt-2 rounded-lg bg-white/10 px-3 py-1 text-xs">Close</button></div>)}</>; }
function Wide({ title, children }: { title: string; children: React.ReactNode }) { return <section className="col-span-3 overflow-auto bg-[#111528] p-6"><h1 className="mb-5 capitalize text-3xl font-black">{title}</h1>{children}</section>; }
function PanelView({ panel, balance, assets, selected, setSelected, search, setSearch, feed, closed, copy, setCopy, watch, setWatch }: { panel: Panel; balance: number; assets: Asset[]; selected: string; setSelected: (s: string) => void; search: string; setSearch: (s: string) => void; feed: Feed[]; closed: Position[]; copy: string; setCopy: (s: string) => void; watch: string; setWatch: (s: string) => void }) { if (panel === 'market') return <Market assets={assets} selected={selected} setSelected={setSelected} search={search} setSearch={setSearch} />; if (panel === 'finance') return <Finance balance={balance} closed={closed} />; if (panel === 'signals') return <Signals assets={assets} setSelected={setSelected} />; if (panel === 'social') return <Social copy={copy} setCopy={setCopy} />; if (panel === 'leaderboard') return <Leaderboard />; if (panel === 'news') return <News />; if (panel === 'calendar') return <Calendar />; if (panel === 'watchlists') return <Watchlists assets={assets} selected={selected} setSelected={setSelected} watch={watch} setWatch={setWatch} />; if (panel === 'achievements') return <Achievements closed={closed} copy={copy} />; if (panel === 'tournaments') return <Tournaments />; if (panel === 'promo') return <Promo />; if (panel === 'friends') return <Friends feed={feed} />; if (panel === 'hotkeys') return <Hotkeys />; return null; }
function Market({ assets, selected, setSelected, search, setSearch }: { assets: Asset[]; selected: string; setSelected: (s: string) => void; search: string; setSearch: (s: string) => void }) { return <div className="max-w-5xl"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="mb-4 w-full rounded-lg bg-[#202841] px-4 py-3 outline-none" />{assets.map((a) => <button key={a.symbol} onClick={() => setSelected(a.symbol)} className={cx('mb-2 flex w-full justify-between rounded-lg px-4 py-3', selected === a.symbol ? 'bg-cyan-400/15' : 'bg-[#202841]')}><span>☆ {a.name} OTC</span><span>+{a.payout}%</span></button>)}</div>; }
function Signals({ assets, setSelected }: { assets: Asset[]; setSelected: (s: string) => void }) { return <div className="grid max-w-3xl gap-3">{assets.slice(0, 12).map((a, i) => <button key={a.symbol} onClick={() => setSelected(a.symbol)} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-xl bg-[#202841] p-4 text-left"><div><b>{a.symbol}/USDT OTC</b><p className="text-xs text-white/40">Copied: {i * 2} times · just now</p></div><span className={a.liveChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{a.liveChange >= 0 ? '⇈' : '⇊'}</span><span className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold">Copy signal</span></button>)}</div>; }
function Social({ copy, setCopy }: { copy: string; setCopy: (s: string) => void }) { return <div className="grid max-w-2xl gap-2">{traders.map((u, i) => <div key={u} className="grid grid-cols-[48px_1fr_auto] items-center gap-3 rounded-xl bg-[#202841] p-3"><div className="h-11 w-11 rounded-full bg-cyan-400/20" /><div><b>{u}</b><p className="text-xs text-white/40">Trades: {46 + i * 73} · {100 - i * 7}% profitable</p></div><button onClick={() => setCopy(copy === u ? '' : u)} className={cx('rounded-xl px-4 py-2 text-sm font-bold', copy === u ? 'bg-purple-500' : 'bg-emerald-600')}>{copy === u ? 'Stop' : 'Copy'}</button></div>)}</div>; }
function Leaderboard() { return <div className="max-w-2xl rounded-2xl bg-[#202841] p-4">{traders.map((u, i) => <div key={u} className="grid grid-cols-[40px_1fr_auto] border-b border-white/10 py-3"><b>#{i + 1}</b><span>{u}</span><span className="text-emerald-300">+${(9200 - i * 740).toLocaleString('en-US')}</span></div>)}</div>; }
function News() { return <Simple items={['BTC ETF inflows remain strong', 'ETH volatility rises before US session', 'SOL breaks short term resistance', 'Market waits for CPI data', 'Risk appetite improves in crypto majors']} />; }
function Calendar() { return <Simple items={['15:30 · US CPI · High impact', '16:45 · Manufacturing PMI · Medium', '18:00 · Fed speaker · High', '21:00 · API crude stock · Medium']} />; }
function Watchlists({ assets, selected, setSelected, watch, setWatch }: { assets: Asset[]; selected: string; setSelected: (s: string) => void; watch: string; setWatch: (s: string) => void }) { const lists = ['Crypto Majors', 'High Payout', 'Volatile Today', 'Favorites']; return <div className="grid max-w-5xl grid-cols-[190px_1fr] gap-6"><div className="space-y-2">{lists.map((l) => <button key={l} onClick={() => setWatch(l)} className={cx('w-full rounded-lg border px-4 py-3 text-left', watch === l ? 'border-cyan-400 bg-cyan-400/15' : 'border-white/10 bg-[#202841]')}>{l}</button>)}</div><div>{assets.slice(0, 10).map((a) => <button key={a.symbol} onClick={() => setSelected(a.symbol)} className={cx('mb-2 flex w-full justify-between rounded-lg px-4 py-3', selected === a.symbol ? 'bg-cyan-400/15' : 'bg-[#202841]')}><span>★ {a.symbol} · {a.name}</span><span className={a.liveChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{a.liveChange >= 0 ? '+' : ''}{a.liveChange.toFixed(2)}%</span></button>)}</div></div>; }
function Achievements({ closed, copy }: { closed: Position[]; copy: string }) { const wins = closed.filter((x) => x.pnl > 0).length; const items: Array<[string, boolean]> = [['First Trade', closed.length > 0], ['Profit Maker', wins > 0], ['10 Closed Trades', closed.length >= 10], ['Copy Trader', Boolean(copy)], ['AI User', true]]; return <div className="grid max-w-3xl gap-3 md:grid-cols-2">{items.map(([n, ok]) => <div key={n} className={cx('rounded-2xl border p-5', ok ? 'border-emerald-400/30 bg-emerald-400/10' : 'border-white/10 bg-[#202841]')}><b>{n}</b><p className="mt-2 text-sm text-white/45">{ok ? 'Unlocked' : 'Locked'}</p></div>)}</div>; }
function Tournaments() { return <Simple items={['Day off · Prize $250 · Free · Join', 'Hour play · Prize $100 · Fee $1 · Join', 'Rumble · Prize $2,500 · Fee $25 · Join', 'Night sprint · Prize $500 · Fee $3 · Join']} />; }
function Promo() { return <Simple items={['100% first demo bonus', 'Daily reward chest', 'Pocket pass trial', 'Risk-free tournament ticket']} />; }
function Friends({ feed }: { feed: Feed[] }) { return <div className="max-w-xl space-y-3">{feed.slice(0, 8).map((f) => <div key={f.id} className="rounded-xl bg-[#202841] p-3"><b>{f.user}</b><p className="text-sm text-white/50">Opened {f.side} on {f.symbol}</p></div>)}</div>; }
function Hotkeys() { return <Simple items={['Shift + W · Buy', 'Shift + S · Sell', 'Shift + A · Decrease amount', 'Shift + D · Increase amount', 'Shift + Tab · Next favorite asset']} />; }
function Finance({ balance, closed }: { balance: number; closed: Position[] }) { const methods = ['Tether USDT TRC-20', 'Visa / Mastercard', 'Binance Pay', 'ByBit Pay', 'Gate Pay', 'Ethereum ERC-20', 'IBAN Bank Transfer']; return <div><div className="mb-6 rounded-2xl bg-[#202841] p-5"><p className="text-white/45">Demo balance</p><p className="text-4xl font-black text-cyan-200">{money(balance)}</p></div><div className="grid gap-3 md:grid-cols-3">{methods.map((m) => <div key={m} className="rounded-xl border border-white/10 bg-[#202841] p-4"><b>{m}</b><p className="mt-3 text-xs text-white/40">Min: $5 · ~5 min.</p></div>)}</div><h2 className="mt-8 text-xl font-black">Wallet / Trade History</h2><div className="mt-3 max-w-3xl space-y-2">{closed.length === 0 ? <p className="text-white/45">No wallet history yet.</p> : closed.slice(0, 8).map((x) => <div key={x.id} className="flex justify-between rounded-xl bg-[#202841] p-3"><span>{x.symbol} · {x.side}</span><span className={x.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{money(x.pnl)}</span></div>)}</div></div>; }
function Simple({ items }: { items: string[] }) { return <div className="grid max-w-3xl gap-3">{items.map((x) => <button key={x} className="rounded-xl bg-[#202841] p-5 text-left text-lg">{x}</button>)}</div>; }
