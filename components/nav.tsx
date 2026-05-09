'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  ['/', 'Landing'],
  ['/onboarding', 'Onboarding'],
  ['/dashboard', 'Dashboard'],
  ['/trading', 'Trading'],
  ['/watchlist', 'Watchlist'],
  ['/copy-trading', 'Copy Trading'],
  ['/settings', 'Settings']
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-30 border-b border-white/10 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
        <span className="text-lg font-semibold tracking-[0.2em] text-gold">REGNANTX</span>
        <div className="hidden md:flex gap-4 text-sm">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className={pathname === href ? 'text-accent' : 'text-white/70 hover:text-white'}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
