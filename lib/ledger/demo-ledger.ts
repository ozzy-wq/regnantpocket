import { LedgerAccountType, LedgerEntrySide, Prisma } from '@prisma/client';
import { db } from '@/lib/db';

const STARTING_CREDITS = new Prisma.Decimal(10_000);

export async function ensureDemoAccount(userId: string) {
  return db.$transaction(async (tx) => {
    let demo = await tx.demoAccount.findUnique({ where: { userId } });
    if (demo) return demo;

    demo = await tx.demoAccount.create({ data: { userId } });

    const userAccount = await tx.ledgerAccount.create({
      data: {
        demoAccountId: demo.id,
        key: `user:${userId}:demo`,
        type: LedgerAccountType.USER_DEMO
      }
    });

    const treasury = await tx.ledgerAccount.upsert({
      where: { key: 'system:demo-treasury' },
      update: {},
      create: { key: 'system:demo-treasury', type: LedgerAccountType.DEMO_TREASURY }
    });

    await tx.ledgerTransaction.create({
      data: {
        reference: `welcome:${userId}`,
        description: 'Initial non-cash demo credit grant',
        entries: {
          create: [
            { accountId: treasury.id, side: LedgerEntrySide.DEBIT, amount: STARTING_CREDITS },
            { accountId: userAccount.id, side: LedgerEntrySide.CREDIT, amount: STARTING_CREDITS }
          ]
        }
      }
    });

    return demo;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function getDemoBalance(userId: string) {
  const account = await db.ledgerAccount.findUnique({
    where: { key: `user:${userId}:demo` },
    include: { entries: true }
  });

  if (!account) return new Prisma.Decimal(0);

  return account.entries.reduce((balance, entry) => {
    return entry.side === LedgerEntrySide.CREDIT
      ? balance.plus(entry.amount)
      : balance.minus(entry.amount);
  }, new Prisma.Decimal(0));
}
