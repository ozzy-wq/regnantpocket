import { LedgerEntrySide, Prisma } from '@prisma/client';

export type LedgerDraftEntry = {
  accountId: string;
  side: LedgerEntrySide;
  amount: Prisma.Decimal;
};

export function assertBalancedLedger(entries: LedgerDraftEntry[]) {
  if (entries.length < 2) throw new Error('LEDGER_REQUIRES_TWO_ENTRIES');

  const totals = entries.reduce(
    (acc, entry) => {
      if (entry.amount.lte(0)) throw new Error('LEDGER_AMOUNT_MUST_BE_POSITIVE');
      if (entry.side === LedgerEntrySide.DEBIT) acc.debits = acc.debits.plus(entry.amount);
      else acc.credits = acc.credits.plus(entry.amount);
      return acc;
    },
    { debits: new Prisma.Decimal(0), credits: new Prisma.Decimal(0) }
  );

  if (!totals.debits.eq(totals.credits)) {
    throw new Error(`LEDGER_UNBALANCED:${totals.debits.toString()}:${totals.credits.toString()}`);
  }

  return totals;
}

export function calculateLedgerBalance(entries: Array<{ side: LedgerEntrySide; amount: Prisma.Decimal }>) {
  return entries.reduce(
    (balance, entry) => entry.side === LedgerEntrySide.CREDIT ? balance.plus(entry.amount) : balance.minus(entry.amount),
    new Prisma.Decimal(0)
  );
}
