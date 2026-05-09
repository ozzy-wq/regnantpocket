'use client';
import { Nav } from '@/components/nav';
import { Card } from '@/components/ui';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function SettingsPage() {
  const [alerts, setAlerts] = useLocalStorage('rx_alerts', true);
  return (
    <main>
      <Nav />
      <section className="max-w-3xl mx-auto p-6 space-y-4">
        <Card>
          <h1 className="text-2xl font-semibold mb-3">Settings</h1>
          <label className="flex items-center justify-between">
            <span>Smart alerts</span>
            <input type="checkbox" checked={alerts} onChange={(e) => setAlerts(e.target.checked)} />
          </label>
          <p className="text-xs text-white/60 mt-4">RegnantX is demo-only. No real fund handling or payment systems.</p>
        </Card>
      </section>
    </main>
  );
}
