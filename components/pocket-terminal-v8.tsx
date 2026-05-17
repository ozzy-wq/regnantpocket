'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, LineSeries, HistogramSeries, type IChartApi, type ISeriesApi, type CandlestickData, type LineData, type UTCTimestamp } from 'lightweight-charts';
import { assets as baseAssets, STARTING_BALANCE } from '@/data/market';
import { calculatePnl, canOpenTrade, formatMoney } from '@/lib/trading';

type Side = 'LONG' | 'SHORT';
type Expiry = '5s' | '15s' | '30s' | '1m';
type ChartType = 'Candles' | 'Line' | 'Bars';
type RightTab = 'opened' | 'closed' | 'signals' | 'social';
type Position = { id: string; symbol: string; side: Side; amount: number; entry: number; current: number; pnl: number; expiry: Expiry; openedAt: number; closesAt: number; status: 'open' | 'closed'; result?: 'WIN' | 'LOSS' | 'DRAW' };
type Asset = typeof baseAssets[number] & { price: number; liveChange: number; payout: number; live?: boolean };

const STORE = 'regnantx-terminal-v8';
const STREAMS = ['btcusdt', 'ethusdt', 'solusdt', 'xrpusdt', 'bnbusdt'];
const SYMBOL_MAP: Record<string, string> = { BTCUSDT: 'BTC', ETHUSDT: 'ETH', SOLUSDT: 'SOL', XRPUSDT: 'XRP', BNBUSDT: 'BNB' };
const traders = [
  { name: 'Aizat', profit: 6115, trades: 240, win: 52 },
  { name: 'BanDa', profit: 3975, trades: 50, win: 52 },
  { name: 'KingKilo', profit: 3398, trades: 123, win: 63 },
  { name: 'DmacGFL', profit: 3139, trades: 104, win: 57 },
  { name: 'QT Alpha', profit: 8711, trades: 46, win: 100 },
  { name: 'user1315', profit: 2942, trades: 1960, win: 49 },
];
const menu = [
  ['↗', 'Trade'], ['$', 'Finance'], ['◆', 'Market'], ['⇅', 'Signals'], ['♚', 'Social'], ['H', 'History'], ['♛', 'Tournaments'], ['◎', 'Chat']
];

function cx(...x: Array<string | false | undefined>) { return x.filter(Boolean).join(' '); }
function money(n: number) { return formatMoney(n); }
function fmt(n: number) { return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function payout(score: number) { return Math.max(68, Math.min(94, Math.round(score * 0.7 + 27))); }
function expiryMs(expiry: Expiry) { return expiry === '5s' ? 5000 : expiry === '15s' ? 15000 : expiry === '30s' ? 30000 : 60000; }
function timeText(ts: number) { return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
function seedCandles(price: number): CandlestickData[] {
  const now = Math.floor(Date.now() / 1000) as UTCTimestamp;
  let last = price * 0.985;
  return Array.from({ length: 90 }, (_, i) => {
    const time = (now - (90 - i) * 5) as UTCTimestamp;
    const wave = Math.sin(i / 6) * 0.008;
    const close = price * (1 + wave + (i - 45) * 0.00018);
    const open = last;
    const high = Math.max(open, close) * 1.0015;
    const low = Math.min(open, close) * 0.9985;
    last = close;
    return { time, open, high, low, close };
  });
}

function TradingViewChart({ asset, chartType }: { asset: Asset; chartType: ChartType }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | ISeriesApi<'Histogram'> | null>(null);
  const lastRef = useRef<CandlestickData | null>(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    wrapRef.current.innerHTML = '';
    const chart = createChart(wrapRef.current, {
      width: wrapRef.current.clientWidth,
      height: wrapRef.current.clientHeight,
      layout: { background: { type: ColorType.Solid, color: '#12182b' }, textColor: 'rgba(255,255,255,.58)' },
      grid: { vertLines: { color: 'rgba(255,255,255,.06)' }, horzLines: { color: 'rgba(255,255,255,.06)' } },
      rightPriceScale: { borderColor: 'rgba(255,255,255,.12)' },
      timeScale: { borderColor: 'rgba(255,255,255,.12)', timeVisible: true, secondsVisible: true },
      crosshair: { mode: 1 },
    });
    chartRef.current = chart;
    const resize = () => wrapRef.current && chart.applyOptions({ width: wrapRef.current.clientWidth, height: wrapRef.current.clientHeight });
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); chart.remove(); chartRef.current = null; seriesRef.current = null; };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (seriesRef.current) chart.removeSeries(seriesRef.current as never);
    const data = seedCandles(asset.price);
    lastRef.current = data[data.length - 1];
    if (chartType === 'Line') {
      const line = chart.addSeries(LineSeries, { color: '#60a5fa', lineWidth: 2 });
      line.setData(data.map((c) => ({ time: c.time, value: c.close })) as LineData[]);
      seriesRef.current = line;
    } else if (chartType === 'Bars') {
      const hist = chart.addSeries(HistogramSeries, { color: '#60a5fa', priceFormat: { type: 'price', precision: 2, minMove: 0.01 } });
      hist.setData(data.map((c) => ({ time: c.time, value: c.close, color: c.close >= c.open ? '#31b545' : '#ff3b30' })));
      seriesRef.current = hist;
    } else {
      const candle = chart.addSeries(CandlestickSeries, { upColor: '#31b545', downColor: '#ff3b30', borderUpColor: '#31b545', borderDownColor: '#ff3b30', wickUpColor: '#31b545', wickDownColor: '#ff3b30' });
      candle.setData(data);
      seriesRef.current = candle;
    }
    chart.timeScale().fitContent();
  }, [asset.symbol, chartType]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    const time = Math.floor(Date.now() / 1000) as UTCTimestamp;
    const prev = lastRef.current || { time, open: asset.price, high: asset.price, low: asset.price, close: asset.price };
    const next: CandlestickData = { time, open: prev.close, high: Math.max(prev.close, asset.price) * 1.0004, low: Math.min(prev.close, asset.price) * 0.9996, close: asset.price };
    lastRef.current = next;
    if (chartType === 'Line') (series as ISeriesApi<'Line'>).update({ time, value: asset.price });
    else if (chartType === 'Bars') (series as ISeriesApi<'Histogram'>).update({ time, value: asset.price, color: asset.price >= prev.close ? '#31b545' : '#ff3b30' });
    else (series as ISeriesApi<'Candlestick'>).update(next);
  }, [asset.price, chartType]);

  return <div ref={wrapRef} className="h-full w-full" />;
}

export function PocketTerminalV8() {
  const [selected, setSelected] = useState('BTC');
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [liveStatus, setLiveStatus] = useState<'connecting' | 'live' | 'offline'>('connecting');
  const [chartType, setChartType] = useState<ChartType>('Candles');
  const [expiry, setExpiry] = useState<Expiry>('5s');
  const [amount, setAmount] = useState(250);
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [positions, setPositions] = useState<Position[]>([]);
  const [closed, setClosed] = useState<Position[]>([]);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [tick, setTick] = useState(1);
  const [rightTab, setRightTab] = useState<RightTab>('opened');

  useEffect(() => { const t = setInterval(() => setTick((v) => v + 1), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { try { const saved = localStorage.getItem(STORE); if (saved) { const d = JSON.parse(saved); setBalance(d.balance ?? STARTING_BALANCE); setPositions(d.positions ?? []); setClosed(d.closed ?? []); } } catch { localStorage.removeItem(STORE); } }, []);
  useEffect(() => localStorage.setItem(STORE, JSON.stringify({ balance, positions, closed })), [balance, positions, closed]);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 2200); return () => clearTimeout(t); }, [notice]);

  useEffect(() => {
    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${STREAMS.map((s) => `${s}@trade`).join('/')}`);
      socket.onopen = () => setLiveStatus('live');
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const symbol = SYMBOL_MAP[payload?.data?.s];
          const price = Number(payload?.data?.p);
          if (symbol && !Number.isNaN(price) && price > 0) setLivePrices((old) => ({ ...old, [symbol]: price }));
        } catch {}
      };
      socket.onerror = () => setLiveStatus('offline');
      socket.onclose = () => setLiveStatus((s) => (s === 'live' ? 'offline' : s));
    } catch { setLiveStatus('offline'); }
    return () => socket?.close();
  }, []);

  const assets: Asset[] = useMemo(() => baseAssets.map((a, i) => {
    const drift = Math.sin((tick + i * 3) / 5) * a.volatility + Math.cos((tick + i) / 7) * a.volatility * 0.6;
    const live = livePrices[a.symbol];
    return { ...a, price: live || a.basePrice * (1 + drift), liveChange: a.change + drift * 100, payout: payout(a.score), live: Boolean(live) };
  }), [tick, livePrices]);
  const asset = assets.find((a) => a.symbol === selected) || assets[0];
  const livePositions = positions.map((p) => { const a = assets.find((x) => x.symbol === p.symbol); return a ? { ...p, current: a.price, pnl: calculatePnl(p.amount, p.entry, a.price, p.side) } : p; });
  const equity = balance + livePositions.filter((p) => p.status === 'open').reduce((s, p) => s + p.pnl, 0);
  const filtered = assets.filter((a) => `${a.symbol} ${a.name}`.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const expired = livePositions.filter((p) => p.status === 'open' && Date.now() >= p.closesAt);
    expired.forEach(settleTrade);
  }, [tick, livePositions]);

  function openTrade(side: Side) {
    if (!canOpenTrade(balance, amount)) return setNotice('Demo balance is not enough');
    const now = Date.now();
    const next: Position = { id: `${now}-${Math.random()}`, symbol: asset.symbol, side, amount, entry: asset.price, current: asset.price, pnl: 0, expiry, openedAt: now, closesAt: now + expiryMs(expiry), status: 'open' };
    setBalance((v) => v - amount);
    setPositions((v) => [next, ...v]);
    setRightTab('opened');
    setNotice(`${asset.symbol} ${side} opened`);
  }
  function settleTrade(item: Position) {
    const result: Position['result'] = item.pnl > 0 ? 'WIN' : item.pnl < 0 ? 'LOSS' : 'DRAW';
    setBalance((v) => v + item.amount + item.pnl);
    setPositions((v) => v.filter((p) => p.id !== item.id));
    setClosed((v) => [{ ...item, status: 'closed', result }, ...v]);
    setRightTab('closed');
    setNotice(`${item.symbol} · ${result} · ${money(item.pnl)}`);
  }
  function reset() { setBalance(STARTING_BALANCE); setPositions([]); setClosed([]); localStorage.removeItem(STORE); setNotice('Demo reset complete'); }

  return <main className="h-screen overflow-hidden bg-[#101524] text-white">
    <header className="flex h-12 items-center justify-between border-b border-white/10 bg-[#171d30] px-4">
      <div className="flex items-center gap-3"><div className="h-7 w-7 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600" /><b className="text-lg">Regnant<span className="text-cyan-300">X</span></b>{assets.slice(0, 5).map((a) => <button key={a.symbol} onClick={() => setSelected(a.symbol)} className="rounded-lg bg-[#252c43] px-3 py-1 text-xs"><b>{a.symbol}</b> <span className="text-cyan-200">{a.live ? fmt(a.price) : `${a.liveChange.toFixed(2)}%`}</span></button>)}</div>
      <div className="flex items-center gap-2"><div className="rounded-xl bg-[#252c43] px-3 py-1 text-right"><p className="text-[9px] text-white/35">LIVE</p><b className={liveStatus === 'live' ? 'text-emerald-300' : 'text-rose-300'}>{liveStatus === 'live' ? 'ON' : liveStatus.toUpperCase()}</b></div><div className="rounded-xl bg-[#252c43] px-4 py-1 text-right"><p className="text-[10px] text-white/35">QT Demo</p><b className="text-cyan-200">{money(equity)}</b></div><button onClick={reset} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black">RESET</button></div>
    </header>
    <section className="grid h-[calc(100vh-48px)] grid-cols-[72px_1fr_310px_330px] overflow-hidden">
      <aside className="border-r border-white/10 bg-[#171d30] p-2">{menu.map(([icon, label], i) => <button key={label} className={cx('mb-1 flex h-[48px] w-full flex-col items-center justify-center rounded-xl text-[9px]', i === 0 ? 'bg-cyan-400/15 text-cyan-200' : 'text-white/55 hover:bg-white/5')}><span className="text-sm">{icon}</span><span>{label}</span></button>)}</aside>
      <section className="relative bg-[#12182b]"><div className="flex h-12 items-center gap-2 border-b border-white/10 bg-[#171d30] px-4"><b className="rounded-lg bg-[#29324d] px-3 py-2">{asset.symbol}/USDT</b>{(['Candles','Line','Bars'] as ChartType[]).map((t) => <button key={t} onClick={() => setChartType(t)} className={cx('rounded-lg px-3 py-2 text-xs font-bold', chartType === t ? 'bg-cyan-400 text-black' : 'bg-[#29324d]')}>{t}</button>)}<button className="rounded-lg bg-[#29324d] px-3 py-2 text-xs font-bold">RSI</button><button className="rounded-lg bg-[#29324d] px-3 py-2 text-xs font-bold">MACD</button><button className="rounded-lg bg-[#29324d] px-3 py-2 text-xs font-bold">Drawing</button></div><div className="absolute left-4 top-16 z-10"><p className="text-xs text-white/40">{asset.name} {asset.live && <span className="text-cyan-200">· Binance live</span>}</p><h1 className="text-3xl font-black">{fmt(asset.price)}</h1><p className={asset.liveChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{asset.liveChange >= 0 ? '+' : ''}{asset.liveChange.toFixed(2)}%</p></div><div className="h-[calc(100%-48px)] p-4 pt-20"><TradingViewChart asset={asset} chartType={chartType} /></div></section>
      <aside className="border-l border-white/10 bg-[#22283c] p-4"><p className="text-xs text-white/40">Payout</p><div className="mb-4 rounded-xl border border-emerald-400/20 bg-black/20 p-3 text-center"><p className="text-emerald-300">+{asset.payout}%</p><p className="text-xs text-white/40">+{money(amount * asset.payout / 100)}</p></div><p className="text-xs text-white/45">Time</p><div className="mt-2 grid grid-cols-4 gap-2">{(['5s','15s','30s','1m'] as Expiry[]).map((e) => <button key={e} onClick={() => setExpiry(e)} className={cx('rounded-lg py-2 text-xs font-bold', expiry === e ? 'bg-cyan-400 text-black' : 'bg-[#171c2f] text-white/60')}>{e}</button>)}</div><p className="mt-4 text-xs text-white/45">Amount</p><input value={amount} onChange={(e) => setAmount(Number(e.target.value))} type="number" className="mt-2 w-full rounded-xl border border-white/10 bg-[#171c2f] px-4 py-3 text-xl font-black outline-none" /><button onClick={() => openTrade('LONG')} className="mt-4 w-full rounded-xl bg-[#31b545] py-4 text-lg font-black">BUY</button><button onClick={() => openTrade('SHORT')} className="mt-3 w-full rounded-xl bg-[#ff3b30] py-4 text-lg font-black">SELL</button><button className="mt-4 w-full rounded-xl bg-[#2e3b57] py-4 text-lg font-black text-white">AI TRADING</button></aside>
      <aside className="border-l border-white/10 bg-[#1b2135]"><div className="border-b border-white/10 p-3 text-center font-bold">Trades</div><div className="grid grid-cols-4 border-b border-white/10 text-[10px]">{(['opened','closed','signals','social'] as RightTab[]).map((x) => <button key={x} onClick={() => setRightTab(x)} className={cx('py-3 capitalize', rightTab === x ? 'border-b border-cyan-400 text-cyan-200' : 'text-white/45')}>{x}</button>)}</div><div className="max-h-[310px] overflow-auto p-3">{rightTab === 'opened' && <Opened positions={livePositions} close={settleTrade} />}{rightTab === 'closed' && <Closed rows={closed} />}{rightTab === 'signals' && <Signals assets={assets} setSelected={setSelected} />}{rightTab === 'social' && <Social />}</div><div className="border-y border-white/10 p-3"><b className="text-sm">Quick Signal</b><p className={asset.liveChange >= 0 ? 'mt-2 text-sm text-emerald-300' : 'mt-2 text-sm text-rose-300'}>{asset.symbol} {asset.liveChange >= 0 ? '↑' : '↓'} {asset.payout}% AI confidence</p></div><div className="border-b border-white/10 p-3"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assets" className="w-full rounded-lg bg-[#111528] px-3 py-2 text-sm outline-none" /></div><div className="max-h-[calc(100vh-520px)] overflow-auto p-3">{filtered.slice(0, 12).map((a) => <button key={a.symbol} onClick={() => setSelected(a.symbol)} className={cx('mb-2 grid w-full grid-cols-[1fr_auto] rounded-xl p-3 text-left', selected === a.symbol ? 'bg-cyan-400/15' : 'bg-[#252c43] hover:bg-[#303851]')}><span><b>{a.symbol}</b><p className="text-xs text-white/40">{a.name}</p></span><span className="text-sm text-cyan-200">{a.live ? fmt(a.price) : `+${a.payout}%`}</span></button>)}</div></aside>
    </section>
    {notice && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-cyan-300/30 bg-[#252c43] px-5 py-3 text-sm font-bold shadow-2xl">{notice}</div>}
  </main>;
}

function Opened({ positions, close }: { positions: Position[]; close: (p: Position) => void }) { if (!positions.length) return <p className="py-6 text-center text-sm text-white/45">No trades</p>; return <>{positions.map((p) => { const left = Math.max(0, Math.ceil((p.closesAt - Date.now()) / 1000)); return <div key={p.id} className="mb-2 rounded-xl bg-[#252c43] p-3"><div className="flex justify-between"><b>{p.symbol} {p.side}</b><span className={p.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{money(p.pnl)}</span></div><p className="text-xs text-white/45">opened: {timeText(p.openedAt)} · closes in: {left}s</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/20"><div className="h-full bg-cyan-400" style={{ width: `${Math.max(0, Math.min(100, (left / (expiryMs(p.expiry) / 1000)) * 100))}%` }} /></div><button onClick={() => close(p)} className="mt-2 rounded-lg bg-white/10 px-3 py-1 text-xs">Close</button></div>; })}</>; }
function Closed({ rows }: { rows: Position[] }) { if (!rows.length) return <p className="py-6 text-center text-sm text-white/45">No closed trades</p>; return <>{rows.slice(0, 10).map((p) => <div key={p.id} className="mb-2 flex items-center justify-between rounded-xl bg-[#252c43] p-3"><div><b>{p.symbol} · {p.result}</b><p className="text-xs text-white/40">{p.side} · {timeText(p.openedAt)}</p></div><span className={p.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{money(p.pnl)}</span></div>)}</>; }
function Signals({ assets, setSelected }: { assets: Asset[]; setSelected: (s: string) => void }) { return <>{assets.slice(0, 8).map((a) => <button key={a.symbol} onClick={() => setSelected(a.symbol)} className="mb-2 grid w-full grid-cols-[1fr_auto] rounded-xl bg-[#252c43] p-3 text-left"><span><b>{a.symbol}</b><p className="text-xs text-white/40">AI market signal</p></span><span className={a.liveChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{a.liveChange >= 0 ? '↑' : '↓'} {a.payout}%</span></button>)}</>; }
function Social() { return <>{traders.map((t) => <div key={t.name} className="mb-2 grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-xl bg-[#252c43] p-3"><div className="h-9 w-9 rounded-full bg-cyan-400/20" /><div><b>{t.name}</b><p className="text-xs text-white/40">Trades: {t.trades} · {t.win}% win</p></div><div className="text-right"><p className="text-emerald-300">+${t.profit.toLocaleString('en-US')}</p><button className="mt-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold">Copy</button></div></div>)}</>; }
