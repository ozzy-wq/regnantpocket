import { NextResponse } from 'next/server';
import { TradeDirection } from '@prisma/client';
import { getCurrentSession } from '@/lib/auth/session';
import { getDemoBalance } from '@/lib/ledger/demo-ledger';
import { getUserTrades, openDemoTrade } from '@/lib/trading/service';

function serializeTrade(trade: any) {
  return {
    id: trade.id,
    symbol: trade.instrument.symbol,
    direction: trade.direction === TradeDirection.UP ? 'up' : 'down',
    stake: Number(trade.stake),
    entryPrice: Number(trade.entryPrice),
    payoutPercent: Number(trade.payoutRatio) * 100,
    openedAt: trade.openedAt.toISOString(),
    expiresAt: trade.expiresAt.toISOString(),
    status: trade.status.toLowerCase(),
    settlementPrice: trade.settlementPrice == null ? null : Number(trade.settlementPrice),
    settledAt: trade.settledAt?.toISOString() ?? null
  };
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const trades = await getUserTrades(session.user.id);
  const balance = await getDemoBalance(session.user.id);

  return NextResponse.json({
    balance: balance.toNumber(),
    openTrades: trades.filter((trade) => trade.status === 'OPEN').map(serializeTrade),
    recentTrades: trades.filter((trade) => trade.status !== 'OPEN').map(serializeTrade)
  });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json() as {
      symbol?: string;
      direction?: 'up' | 'down';
      stake?: number;
      expirySeconds?: number;
      idempotencyKey?: string;
    };

    if (!body.symbol || !body.direction || !body.stake || !body.expirySeconds || !body.idempotencyKey) {
      return NextResponse.json({ error: 'Missing trade parameters.' }, { status: 400 });
    }

    const result = await openDemoTrade({
      userId: session.user.id,
      symbol: body.symbol,
      direction: body.direction === 'up' ? TradeDirection.UP : TradeDirection.DOWN,
      stake: body.stake,
      expirySeconds: body.expirySeconds,
      idempotencyKey: body.idempotencyKey
    });

    return NextResponse.json({ trade: serializeTrade(result.trade), balance: Number(result.balance) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'TRADE_FAILED';
    const status = ['INVALID_STAKE', 'INVALID_EXPIRY', 'INVALID_IDEMPOTENCY_KEY', 'INSTRUMENT_UNAVAILABLE'].includes(message)
      ? 400
      : message === 'INSUFFICIENT_DEMO_CREDITS'
        ? 409
        : 500;
    if (status === 500) console.error('trade_open_failed', error);
    return NextResponse.json({ error: message }, { status });
  }
}
