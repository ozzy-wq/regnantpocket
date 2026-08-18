import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { ensureDemoAccount, getDemoBalance } from '@/lib/ledger/demo-ledger';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password || '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    await ensureDemoAccount(user.id);
    await createSession(user.id);
    const balance = await getDemoBalance(user.id);

    return NextResponse.json({
      user: { id: user.id, email: user.email, displayName: user.displayName },
      demoBalance: balance.toNumber()
    });
  } catch (error) {
    console.error('login_failed', error);
    return NextResponse.json({ error: 'Unable to sign in.' }, { status: 500 });
  }
}
