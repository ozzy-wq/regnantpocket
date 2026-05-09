'use client';
import clsx from 'clsx';

export const Button = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={clsx('rounded-xl bg-accent px-4 py-2 font-semibold text-black transition hover:scale-[1.02] disabled:opacity-50', className)}
  />
);

export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props} className={clsx('card p-4', className)} />;

export const Badge = ({ value, positive }: { value: string; positive: boolean }) => (
  <span className={clsx('rounded-full px-2 py-1 text-xs', positive ? 'bg-bullish/15 text-bullish' : 'bg-bearish/15 text-bearish')}>{value}</span>
);
