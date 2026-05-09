'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from './config';
import clsx from 'clsx';

export function PremiumNavbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-sm font-semibold tracking-[0.28em] text-orange-300">REGNANTX PRO</Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={clsx('rounded-lg px-3 py-2 text-sm transition', pathname === item.href ? 'bg-orange-500/20 text-orange-300' : 'text-white/70 hover:bg-white/5 hover:text-white')}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
