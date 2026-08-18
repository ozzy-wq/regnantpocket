import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { ensureDemoAccount, getDemoBalance } from '@/lib/ledger/demo-ledger';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string; displayName?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password || '';
    const displayName = body.displayName?.trim().slice(0, 80) || null;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const user = await db.user.create({
      data: { email, passwordHash: await hashPassword(password), displayName }
    });

    await ensureDemoAccount(user.id);
    await createSession(user.id);
    const balance = await getDemoBalance(user.id);

    return NextResponse.json({
      user: { id: user.id, email: user.email, displayName: user.displayName },
      demoBalance: balance.toNumber()
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }
    console.error('register_failed', error);
    return NextResponse.json({ error: 'Unable to create account.' }, { status: 500 });
  }
}
