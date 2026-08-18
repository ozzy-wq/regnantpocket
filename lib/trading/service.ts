import {
  LedgerAccountType,
  LedgerEntrySide,
  Prisma,
  TradeDirection,
  TradeStatus
} from '@prisma/client';
import { db } from '@/lib/db';
import { ensureDemoAccount } from '@/lib/ledger/demo-ledger';
import { assertBalancedLedger, calculateLedgerBalance } from '@/lib/ledger/invariants';
import { getDemoQuote } from '@/lib/market/demo-quotes';
import { ensureDefaultInstruments } from '@/lib/market/instruments';

const SERIALIZABLE_RETRIES = 3;

async function runSerializable<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= SERIALIZABLE_RETRIES; attempt += 1) {
    try {
      return await db.$transaction(work, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      lastError = error;
      const retryable = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
      if (!retryable || attempt === SERIALIZABLE_RETRIES) throw error;
    }
  }
  throw lastError;
}

async function balanceInTx(tx: Prisma.TransactionClient, userId: string) {
  const account = await tx.ledgerAccount.findUnique({
    where: { key: `user:${userId}:demo` },
    include: { entries: true }
  });
  if (!account) return new Prisma.Decimal(0);
  return calculateLedgerBalance(account.entries);
}

export async function openDemoTrade(input: {
  userId: string;
  symbol: string;
  direction: TradeDirection;
  stake: number;
  expirySeconds: number;
  idempotencyKey: string;
}) {
  await ensureDemoAccount(input.userId);
  await ensureDefaultInstruments();

  if (!Number.isFinite(input.stake) || input.stake < 1 || input.stake > 1000) throw new Error('INVALID_STAKE');
  if (![30, 60, 120, 300].includes(input.expirySeconds)) throw new Error('INVALID_EXPIRY');
  if (!input.idempotencyKey || input.idempotencyKey.length > 128) throw new Error('INVALID_IDEMPOTENCY_KEY');

  try {
    return await runSerializable(async (tx) => {
      const existing = await tx.demoTrade.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: { instrument: true }
      });
      if (existing) return { trade: existing, balance: await balanceInTx(tx, input.userId) };

      const instrument = await tx.instrument.findUnique({ where: { symbol: input.symbol } });
      if (!instrument?.isActive) throw new Error('INSTRUMENT_UNAVAILABLE');

      const stake = new Prisma.Decimal(input.stake);
      const balance = await balanceInTx(tx, input.userId);
      if (balance.lt(stake)) throw new Error('INSUFFICIENT_DEMO_CREDITS');

      const userAccount = await tx.ledgerAccount.findUniqueOrThrow({ where: { key: `user:${input.userId}:demo` } });
      const entryPrice = new Prisma.Decimal(getDemoQuote(instrument.symbol));
      const expiresAt = new Date(Date.now() + input.expirySeconds * 1000);

      const trade = await tx.demoTrade.create({
        data: {
          userId: input.userId,
          instrumentId: instrument.id,
          direction: input.direction,
          stake,
          payoutRatio: instrument.payoutRatio,
          entryPrice,
          expiresAt,
          idempotencyKey: input.idempotencyKey
        },
        include: { instrument: true }
      });

      const escrow = await tx.ledgerAccount.create({
        data: { key: `trade:${trade.id}:escrow`, type: LedgerAccountType.TRADE_ESCROW }
      });
      const entries = [
        { accountId: userAccount.id, side: LedgerEntrySide.DEBIT, amount: stake },
        { accountId: escrow.id, side: LedgerEntrySide.CREDIT, amount: stake }
      ];
      assertBalancedLedger(entries);

      await tx.ledgerTransaction.create({
        data: {
          tradeId: trade.id,
          reference: `trade-open:${trade.id}`,
          description: `Reserve ${stake.toString()} RP demo credits`,
          entries: { create: entries }
        }
      });

      return { trade, balance: balance.minus(stake) };
    });
  } catch (error) {
    const duplicate = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
    if (!duplicate) throw error;

    const existing = await db.demoTrade.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { instrument: true }
    });
    if (!existing) throw error;
    return { trade: existing, balance: await balanceInTx(db, input.userId) };
  }
}

export async function settleExpiredTrades(userId: string) {
  const expired = await db.demoTrade.findMany({
    where: { userId, status: TradeStatus.OPEN, expiresAt: { lte: new Date() } },
    select: { id: true }
  });
  for (const item of expired) await settleTrade(item.id);
}

export async function settleTrade(tradeId: string) {
  return runSerializable(async (tx) => {
    const trade = await tx.demoTrade.findUnique({ where: { id: tradeId }, include: { instrument: true } });
    if (!trade || trade.status !== TradeStatus.OPEN || trade.expiresAt > new Date()) return trade;

    const settlementPrice = new Prisma.Decimal(getDemoQuote(trade.instrument.symbol, trade.expiresAt));
    const movedUp = settlementPrice.gt(trade.entryPrice);
    const movedDown = settlementPrice.lt(trade.entryPrice);
    const won = (trade.direction === TradeDirection.UP && movedUp) || (trade.direction === TradeDirection.DOWN && movedDown);
    const draw = settlementPrice.eq(trade.entryPrice);
    const nextStatus = draw ? TradeStatus.DRAW : won ? TradeStatus.WON : TradeStatus.LOST;

    const claimed = await tx.demoTrade.updateMany({
      where: { id: trade.id, status: TradeStatus.OPEN },
      data: { status: nextStatus, settlementPrice, settledAt: new Date() }
    });
    if (claimed.count !== 1) return tx.demoTrade.findUnique({ where: { id: trade.id } });

    const escrow = await tx.ledgerAccount.findUniqueOrThrow({ where: { key: `trade:${trade.id}:escrow` } });
    const userAccount = await tx.ledgerAccount.findUniqueOrThrow({ where: { key: `user:${trade.userId}:demo` } });
    const treasury = await tx.ledgerAccount.upsert({
      where: { key: 'system:demo-treasury' },
      update: {},
      create: { key: 'system:demo-treasury', type: LedgerAccountType.DEMO_TREASURY }
    });

    const entries: Array<{ accountId: string; side: LedgerEntrySide; amount: Prisma.Decimal }> = [];
    if (nextStatus === TradeStatus.WON) {
      const profit = trade.stake.mul(trade.payoutRatio);
      entries.push(
        { accountId: escrow.id, side: LedgerEntrySide.DEBIT, amount: trade.stake },
        { accountId: treasury.id, side: LedgerEntrySide.DEBIT, amount: profit },
        { accountId: userAccount.id, side: LedgerEntrySide.CREDIT, amount: trade.stake.plus(profit) }
      );
    } else if (nextStatus === TradeStatus.DRAW) {
      entries.push(
        { accountId: escrow.id, side: LedgerEntrySide.DEBIT, amount: trade.stake },
        { accountId: userAccount.id, side: LedgerEntrySide.CREDIT, amount: trade.stake }
      );
    } else {
      entries.push(
        { accountId: escrow.id, side: LedgerEntrySide.DEBIT, amount: trade.stake },
        { accountId: treasury.id, side: LedgerEntrySide.CREDIT, amount: trade.stake }
      );
    }
    assertBalancedLedger(entries);

    await tx.ledgerTransaction.create({
      data: {
        tradeId: trade.id,
        reference: `trade-settle:${trade.id}`,
        description: `Settle demo trade as ${nextStatus}`,
        entries: { create: entries }
      }
    });

    return tx.demoTrade.findUnique({ where: { id: trade.id }, include: { instrument: true } });
  });
}

export async function getUserTrades(userId: string) {
  await settleExpiredTrades(userId);
  return db.demoTrade.findMany({
    where: { userId },
    include: { instrument: true },
    orderBy: { openedAt: 'desc' },
    take: 100
  });
}
