'use client';
import { useMemo, useState } from 'react';
import { MARKET_SYMBOLS, STARTING_WALLET } from '@/data/mockMarkets';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { calcEquity, calcPnl } from '@/lib/trade';
import { Position, TradeRecord } from '@/types/trading';
import { Badge, Button, Card } from './ui';

export function Dashboard() {
  const [positions, setPositions] = useLocalStorage<Position[]>('rx_positions', []);
  const [history, setHistory] = useLocalStorage<TradeRecord[]>('rx_history', []);
  const [balance, setBalance] = useLocalStorage<number>('rx_balance', STARTING_WALLET);
  const [loading, setLoading] = useState(false);

  const prices = useMemo(() => MARKET_SYMBOLS.map((s) => ({ symbol: s, price: Number((50 + Math.random() * 5000).toFixed(2)) })), [positions.length]);
  const equity = calcEquity(balance, positions);

  const openTrade = (symbol: string, direction: 'LONG' | 'SHORT', price: number) => {
    const position: Position = { id: crypto.randomUUID(), symbol, direction, qty: 1, entryPrice: price, currentPrice: price, openedAt: new Date().toISOString() };
    setPositions([position, ...positions]);
  };

  const closeTrade = (p: Position) => {
    const pnl = calcPnl(p.direction, p.qty, p.entryPrice, p.currentPrice);
    setBalance(Number((balance + pnl).toFixed(2)));
    setPositions(positions.filter((x) => x.id !== p.id));
    setHistory([{ ...p, closedAt: new Date().toISOString(), pnl }, ...history]);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Card className="flex flex-wrap gap-6 justify-between">
        <div><p className="text-white/60 text-sm">Demo Wallet</p><p className="text-2xl font-bold">${balance.toFixed(2)}</p></div>
        <div><p className="text-white/60 text-sm">Equity</p><p className="text-2xl font-bold">${equity.toFixed(2)}</p></div>
        <Button onClick={() => {setLoading(true); setTimeout(() => setLoading(false), 600);}}>Refresh Feed</Button>
      </Card>
      {loading && <p className="text-sm text-accent animate-pulse">Loading simulated market feed...</p>}
      <div className="grid md:grid-cols-2 gap-4">
        <Card><h3 className="font-semibold mb-3">Live Prices</h3>{prices.map((m) => <div key={m.symbol} className="flex justify-between py-2 border-b border-white/5"><span>{m.symbol}</span><div className="space-x-2"><span>${m.price}</span><Button onClick={() => openTrade(m.symbol, 'LONG', m.price)} className="bg-bullish text-white px-2 py-1">LONG</Button><Button onClick={() => openTrade(m.symbol, 'SHORT', m.price)} className="bg-bearish text-white px-2 py-1">SHORT</Button></div></div>)}</Card>
        <Card><h3 className="font-semibold mb-3">Open Positions</h3>{positions.length === 0 ? <p className="text-white/60">No open demo positions.</p> : positions.map((p) => <div key={p.id} className="flex justify-between py-2 border-b border-white/5"><div><p>{p.symbol} <Badge value={p.direction} positive={p.direction==='LONG'} /></p><p className="text-xs text-white/60">Entry ${p.entryPrice}</p></div><Button className="bg-white/10 text-white" onClick={() => closeTrade({ ...p, currentPrice: p.entryPrice + (Math.random()*40-20) })}>Close</Button></div>)}</Card>
      </div>
      <Card><h3 className="font-semibold mb-3">Trade History</h3>{history.length === 0 ? <p className="text-white/60">No closed trades yet.</p> : history.slice(0,8).map((h) => <div key={h.id} className="flex justify-between py-1 text-sm"><span>{h.symbol} ({h.direction})</span><span className={h.pnl>=0?'text-bullish':'text-bearish'}>{h.pnl>=0?'+':''}{h.pnl.toFixed(2)}</span></div>)}</Card>
      <div className="grid md:grid-cols-2 gap-4">
        <Card><h3 className="font-semibold">Copy Trader</h3><p className="text-sm text-white/70 mt-2">Mirror a top-performing demo strategy profile (simulation only).</p></Card>
        <Card><h3 className="font-semibold">Smart Alerts</h3><p className="text-sm text-white/70 mt-2">Set alert conditions and receive in-app demo notifications.</p></Card>
      </div>
    </div>
  );
}
