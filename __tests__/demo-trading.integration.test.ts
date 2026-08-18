import { afterEach, describe, expect, it } from 'vitest';
import { TradeDirection } from '@prisma/client';
import { db } from '@/lib/db';
import { getDemoBalance } from '@/lib/ledger/demo-ledger';
import { openDemoTrade, settleTrade } from '@/lib/trading/service';

const createdUserIds: string[] = [];

async function createTestUser() {
  const user = await db.user.create({
    data: {
      email: `ci-${crypto.randomUUID()}@regnant.test`,
      passwordHash: 'integration-test-only'
    }
  });
  createdUserIds.push(user.id);
  return user;
}

afterEach(async () => {
  for (const userId of createdUserIds.splice(0)) {
    const trades = await db.demoTrade.findMany({ where: { userId }, select: { id: true } });
    const tradeIds = trades.map((trade) => trade.id);
    const demo = await db.demoAccount.findUnique({ where: { userId }, select: { id: true } });
    const accountIds = demo
      ? (await db.ledgerAccount.findMany({ where: { demoAccountId: demo.id }, select: { id: true } })).map((account) => account.id)
      : [];
    const escrowIds = tradeIds.length
      ? (await db.ledgerAccount.findMany({ where: { key: { in: tradeIds.map((id) => `trade:${id}:escrow`) } }, select: { id: true } })).map((account) => account.id)
      : [];
    const allAccountIds = [...accountIds, ...escrowIds];
    const txs = await db.ledgerTransaction.findMany({
      where: { OR: [{ tradeId: { in: tradeIds } }, { reference: `welcome:${userId}` }] },
      select: { id: true }
    });
    const txIds = txs.map((tx) => tx.id);
    if (txIds.length) await db.ledgerEntry.deleteMany({ where: { transactionId: { in: txIds } } });
    if (txIds.length) await db.ledgerTransaction.deleteMany({ where: { id: { in: txIds } } });
    if (tradeIds.length) await db.demoTrade.deleteMany({ where: { id: { in: tradeIds } } });
    if (allAccountIds.length) await db.ledgerAccount.deleteMany({ where: { id: { in: allAccountIds } } });
    if (demo) await db.demoAccount.delete({ where: { id: demo.id } });
    await db.session.deleteMany({ where: { userId } });
    await db.user.delete({ where: { id: userId } });
  }
});

describe('demo trading database invariants', () => {
  it('does not charge twice for the same idempotency key', async () => {
    const user = await createTestUser();
    const key = crypto.randomUUID();

    const first = await openDemoTrade({
      userId: user.id,
      symbol: 'EUR/USD',
      direction: TradeDirection.UP,
      stake: 100,
      expirySeconds: 30,
      idempotencyKey: key
    });
    const second = await openDemoTrade({
      userId: user.id,
      symbol: 'EUR/USD',
      direction: TradeDirection.UP,
      stake: 100,
      expirySeconds: 30,
      idempotencyKey: key
    });

    expect(second.trade.id).toBe(first.trade.id);
    expect((await getDemoBalance(user.id)).toString()).toBe('9900');
    expect(await db.demoTrade.count({ where: { userId: user.id } })).toBe(1);
  });

  it('settles a trade only once even when settlement is called twice', async () => {
    const user = await createTestUser();
    const opened = await openDemoTrade({
      userId: user.id,
      symbol: 'EUR/USD',
      direction: TradeDirection.UP,
      stake: 100,
      expirySeconds: 30,
      idempotencyKey: crypto.randomUUID()
    });

    await db.demoTrade.update({
      where: { id: opened.trade.id },
      data: { expiresAt: new Date(Date.now() - 1000) }
    });

    await Promise.all([settleTrade(opened.trade.id), settleTrade(opened.trade.id)]);

    const settlementTransactions = await db.ledgerTransaction.count({
      where: { reference: `trade-settle:${opened.trade.id}` }
    });
    expect(settlementTransactions).toBe(1);
    expect(await db.ledgerTransaction.count({ where: { tradeId: opened.trade.id } })).toBe(2);
  });
});
