import type { ReactNode } from 'react';
import { MobileNavigation } from '@/components/navigation/mobile-navigation';
import { PremiumNavbar } from '@/components/navigation/premium-navbar';
import { Sidebar } from '@/components/navigation/sidebar';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#05070d] text-white">
      <PremiumNavbar />
      <div className="mx-auto flex max-w-7xl">
        <Sidebar />
        <main className="w-full p-4 md:p-6">{children}</main>
      </div>
      <MobileNavigation />
    </div>
  );
}
