import clsx from 'clsx';

export function Badge({ label, trend }: { label: string; trend: 'up' | 'down' | 'neutral' }) {
  return (
    <span
      className={clsx(
        'rounded-full px-2 py-1 text-xs font-medium',
        trend === 'up' && 'bg-emerald-400/15 text-emerald-300',
        trend === 'down' && 'bg-rose-400/15 text-rose-300',
        trend === 'neutral' && 'bg-white/10 text-white/80'
      )}
    >
      {label}
    </span>
  );
}
