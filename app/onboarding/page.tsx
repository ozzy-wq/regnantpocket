'use client';
import { useState } from 'react';
import { Nav } from '@/components/nav';
import { Button, Card } from '@/components/ui';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-xl space-y-4 p-6">
        <Card className="p-8">
          <h1 className="text-3xl font-semibold">Welcome to RegnantX</h1>
          <p className="mt-2 text-white/70">Secure demo onboarding and login simulation.</p>
          <p className="mt-4 text-xs text-white/60">Demo-only access. Real-money operations are permanently disabled.</p>
        </Card>
        <Card className="space-y-4 p-8">
          <p className="text-sm text-accent">Step {step} / 3</p>
          <div className="grid gap-3">
            <input className="glass rounded-xl p-3" placeholder="Email" />
            <input className="glass rounded-xl p-3" placeholder="Password" type="password" />
            <input className="glass rounded-xl p-3" placeholder={step === 1 ? 'Risk Profile' : step === 2 ? 'Trading Preferences' : 'Notification Level'} />
          </div>
          <div className="flex gap-2">
            <Button className="bg-white/10 text-white" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>Back</Button>
            <Button onClick={() => setStep((s) => Math.min(3, s + 1))}>{step === 3 ? 'Enter Platform' : 'Continue'}</Button>
          </div>
        </Card>
      </section>
    </main>
  );
}
