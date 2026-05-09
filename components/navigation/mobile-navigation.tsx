'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from './config';

export function MobileNavigation() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-slate-950/95 p-2 backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={`rounded-md px-2 py-2 text-center text-xs ${pathname === item.href ? 'bg-orange-500/20 text-orange-300' : 'text-white/70'}`}>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
