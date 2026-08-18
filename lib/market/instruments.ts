import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

const DEFAULT_INSTRUMENTS = [
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', category: 'Forex', payoutRatio: new Prisma.Decimal('0.82') },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', category: 'Forex', payoutRatio: new Prisma.Decimal('0.80') },
  { symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', category: 'Crypto', payoutRatio: new Prisma.Decimal('0.78') },
  { symbol: 'ETH/USD', name: 'Ethereum / US Dollar', category: 'Crypto', payoutRatio: new Prisma.Decimal('0.76') },
  { symbol: 'XAU/USD', name: 'Gold / US Dollar', category: 'Commodity', payoutRatio: new Prisma.Decimal('0.81') }
] as const;

export async function ensureDefaultInstruments() {
  await Promise.all(DEFAULT_INSTRUMENTS.map((instrument) =>
    db.instrument.upsert({
      where: { symbol: instrument.symbol },
      update: { name: instrument.name, category: instrument.category },
      create: instrument
    })
  ));
}

export async function listActiveInstruments() {
  await ensureDefaultInstruments();
  return db.instrument.findMany({ where: { isActive: true }, orderBy: [{ category: 'asc' }, { symbol: 'asc' }] });
}
