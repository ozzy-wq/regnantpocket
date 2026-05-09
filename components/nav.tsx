'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  ['/', 'Home'],
  ['/onboarding', 'Onboarding'],
  ['/dashboard', 'Dashboard'],
  ['/settings', 'Settings']
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-30 backdrop-blur border-b border-white/10 bg-bg/80">
      <div className="max-w-6xl mx-auto p-4 flex justify-between items-center">
        <span className="font-bold tracking-wide">RegnantX</span>
        <div className="flex gap-3 text-sm">
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
