import { Nav } from '@/components/nav';
import { Dashboard } from '@/components/dashboard';

export default function DashboardPage() {
  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-7xl p-6">
        <Dashboard />
      </section>
    </main>
  );
}
