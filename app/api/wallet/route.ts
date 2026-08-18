import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { getDemoBalance } from '@/lib/ledger/demo-ledger';

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const balance = await getDemoBalance(session.user.id);
  return NextResponse.json({
    currency: 'RP',
    balance: balance.toNumber(),
    monetaryValue: false
  });
}
