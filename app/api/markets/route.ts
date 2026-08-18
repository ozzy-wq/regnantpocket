import { NextResponse } from 'next/server';
import { getDemoQuote } from '@/lib/market/demo-quotes';
import { listActiveInstruments } from '@/lib/market/instruments';

export async function GET() {
  const instruments = await listActiveInstruments();
  return NextResponse.json({
    instruments: instruments.map((instrument) => ({
      symbol: instrument.symbol,
      name: instrument.name,
      category: instrument.category.toLowerCase(),
      price: getDemoQuote(instrument.symbol),
      payoutPercent: instrument.payoutRatio.mul(100).toNumber(),
      changePercent: 0
    })),
    serverTime: new Date().toISOString(),
    source: 'deterministic-demo'
  });
}
