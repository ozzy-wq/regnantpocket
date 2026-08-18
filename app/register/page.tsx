'use client';

import { FormEvent, useState } from 'react';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ displayName, email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to create account.');
      window.location.href = '/trading';
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create account.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#05070d] p-4 text-white"><form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl"><p className="text-xs uppercase tracking-[0.25em] text-emerald-300">Regnant Pocket</p><h1 className="mt-2 text-2xl font-semibold">Create demo account</h1><p className="mt-1 text-sm text-white/50">Starts with 10,000 RP demo credits. RP has no monetary value.</p>{error ? <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-100">{error}</p> : null}<label className="mt-6 block text-sm text-white/60">Display name</label><input className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 outline-none focus:border-emerald-400/50" value={displayName} maxLength={80} onChange={(event) => setDisplayName(event.target.value)} /><label className="mt-4 block text-sm text-white/60">Email</label><input className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 outline-none focus:border-emerald-400/50" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /><label className="mt-4 block text-sm text-white/60">Password</label><input className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 outline-none focus:border-emerald-400/50" type="password" minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button disabled={busy} className="mt-6 w-full rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-black disabled:opacity-50">{busy ? 'Creating…' : 'Create demo account'}</button><p className="mt-5 text-center text-sm text-white/45">Already registered? <a className="text-emerald-300" href="/login">Sign in</a></p></form></main>;
}
