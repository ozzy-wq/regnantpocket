import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { getDemoBalance } from '@/lib/ledger/demo-ledger';

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const balance = await getDemoBalance(session.user.id);
  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName
    },
    demoBalance: balance.toNumber()
  });
}
