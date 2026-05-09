'use client';
import { Nav } from '@/components/nav';
import { Card } from '@/components/ui';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function SettingsPage() {
  const [alerts, setAlerts] = useLocalStorage('rx_alerts', true);
  const [theme, setTheme] = useLocalStorage('rx_theme', 'Midnight Gold');

  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-3xl space-y-4 p-6">
        <Card className="p-6">
          <h1 className="mb-4 text-2xl font-semibold">Settings</h1>
          <div className="space-y-3 text-sm">
            <label className="flex items-center justify-between"><span>Smart Alerts</span><input type="checkbox" checked={alerts} onChange={(e) => setAlerts(e.target.checked)} /></label>
            <label className="flex items-center justify-between"><span>Theme</span><select value={theme} onChange={(e)=>setTheme(e.target.value)} className="glass rounded-lg p-2"><option>Midnight Gold</option><option>Obsidian Orange</option></select></label>
          </div>
          <p className="mt-4 text-xs text-white/60">Demo-only. No deposits, withdrawals, real trading, or payment integrations.</p>
        </Card>
      </section>
    </main>
  );
}
