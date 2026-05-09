'use client';
import { useMemo } from 'react';
import { MARKET_SYMBOLS, STARTING_WALLET } from '@/data/mockMarkets';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { calcEquity } from '@/lib/trade';
import { Position, TradeRecord } from '@/types/trading';
import { Card } from './ui';

export function Dashboard() {
  const [positions] = useLocalStorage<Position[]>('rx_positions', []);
  const [history] = useLocalStorage<TradeRecord[]>('rx_history', []);
  const [balance] = useLocalStorage<number>('rx_balance', STARTING_WALLET);
  const equity = calcEquity(balance, positions);

  const prices = useMemo(() => MARKET_SYMBOLS.map((s) => ({ symbol: s, price: Number((100 + Math.random() * 4000).toFixed(2)) })), []);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Premium Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><p className="text-white/60">Demo Wallet</p><p className="text-2xl font-bold text-gold">${balance.toFixed(2)}</p></Card>
        <Card><p className="text-white/60">Equity</p><p className="text-2xl font-bold">${equity.toFixed(2)}</p></Card>
        <Card><p className="text-white/60">Open Positions</p><p className="text-2xl font-bold">{positions.length}</p></Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Market Watchlist</h2>
          {prices.map((p) => <div key={p.symbol} className="flex justify-between border-b border-white/10 py-2"><span>{p.symbol}</span><span>${p.price}</span></div>)}
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Trade History</h2>
          {history.length === 0 ? <p className="text-white/60">No closed demo trades yet.</p> : history.slice(0, 8).map((h) => <div key={h.id} className="flex justify-between py-1"><span>{h.symbol}</span><span className={h.pnl >= 0 ? 'text-bullish' : 'text-bearish'}>{h.pnl.toFixed(2)}</span></div>)}
        </Card>
      </div>
      <p className="text-xs text-white/60">Demo-only environment. All values and execution are simulated and non-custodial.</p>
    </div>
  );
}
