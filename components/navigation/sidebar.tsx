'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { navItems } from './config';

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 border-r border-white/10 bg-slate-950/60 p-4 backdrop-blur-xl lg:block">
      <p className="mb-4 text-xs uppercase tracking-[0.24em] text-white/50">Workspace</p>
      <div className="space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={clsx('block rounded-lg px-3 py-2 text-sm', pathname === item.href ? 'bg-orange-500/20 text-orange-300' : 'text-white/70 hover:bg-white/5 hover:text-white')}>
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
