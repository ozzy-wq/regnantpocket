import { NextResponse } from 'next/server';
import { getDemoHistory, getDemoQuote } from '@/lib/market/demo-quotes';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'EUR/USD';
  const points = Math.min(Math.max(Number(searchParams.get('points') || 80), 10), 300);
  const history = getDemoHistory(symbol, points);

  return NextResponse.json({
    symbol,
    price: getDemoQuote(symbol),
    points: history.map((point) => ({ time: new Date(point.timestamp).getTime(), price: point.price })),
    serverTime: new Date().toISOString(),
    source: 'deterministic-demo'
  });
}
