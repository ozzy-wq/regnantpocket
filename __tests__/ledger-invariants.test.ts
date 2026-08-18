import { describe, expect, it } from 'vitest';
import { LedgerEntrySide, Prisma } from '@prisma/client';
import { assertBalancedLedger, calculateLedgerBalance } from '@/lib/ledger/invariants';

const d = (value: string | number) => new Prisma.Decimal(value);

describe('ledger invariants', () => {
  it('accepts balanced debit and credit entries', () => {
    const totals = assertBalancedLedger([
      { accountId: 'a', side: LedgerEntrySide.DEBIT, amount: d(100) },
      { accountId: 'b', side: LedgerEntrySide.CREDIT, amount: d(100) }
    ]);
    expect(totals.debits.toString()).toBe('100');
    expect(totals.credits.toString()).toBe('100');
  });

  it('rejects an unbalanced transaction', () => {
    expect(() => assertBalancedLedger([
      { accountId: 'a', side: LedgerEntrySide.DEBIT, amount: d(100) },
      { accountId: 'b', side: LedgerEntrySide.CREDIT, amount: d(99) }
    ])).toThrow(/LEDGER_UNBALANCED/);
  });

  it('rejects zero and negative ledger amounts', () => {
    expect(() => assertBalancedLedger([
      { accountId: 'a', side: LedgerEntrySide.DEBIT, amount: d(0) },
      { accountId: 'b', side: LedgerEntrySide.CREDIT, amount: d(0) }
    ])).toThrow('LEDGER_AMOUNT_MUST_BE_POSITIVE');
  });

  it('calculates an account balance from append-only entries', () => {
    expect(calculateLedgerBalance([
      { side: LedgerEntrySide.CREDIT, amount: d(10000) },
      { side: LedgerEntrySide.DEBIT, amount: d(250) },
      { side: LedgerEntrySide.CREDIT, amount: d(450) }
    ]).toString()).toBe('10200');
  });
});
