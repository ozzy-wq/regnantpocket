import { NextResponse } from 'next/server';
import { getDemoHistory, getDemoQuote } from '@/lib/market/demo-quotes';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'EUR/USD';
  const points = Math.min(Math.max(Number(searchParams.get('points') || 80), 10), 300);

  return NextResponse.json({
    symbol,
    price: getDemoQuote(symbol),
    points: getDemoHistory(symbol, points),
    serverTime: new Date().toISOString(),
    source: 'deterministic-demo'
  });
}
