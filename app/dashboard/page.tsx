import { Dashboard } from '@/components/dashboard';
import { Nav } from '@/components/nav';

export default function DashboardPage() {
  return (
    <main>
      <Nav />
      <section className="max-w-6xl mx-auto p-6">
        <Dashboard />
      </section>
    </main>
  );
}
