'use client';
import { useState } from 'react';
import { Nav } from '@/components/nav';
import { Button, Card } from '@/components/ui';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  return (
    <main>
      <Nav />
      <section className="max-w-2xl mx-auto p-6 space-y-4">
        <Card>
          <h1 className="text-2xl font-semibold mb-2">Demo Onboarding</h1>
          <p className="text-white/70">Step {step}/3 • Demo-only. No real money, withdrawals, execution, or payments.</p>
        </Card>
        <Card>
          <p className="mb-4">{step === 1 ? 'Choose risk profile' : step === 2 ? 'Enable copy trader preferences' : 'Configure smart alerts'}</p>
          <div className="flex gap-2">
            <Button className="bg-white/10 text-white" disabled={step === 1} onClick={() => setStep(step - 1)}>Back</Button>
            <Button onClick={() => setStep(Math.min(3, step + 1))}>{step === 3 ? 'Finish' : 'Next'}</Button>
          </div>
        </Card>
      </section>
    </main>
  );
}
