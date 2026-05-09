import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={clsx('glass-card rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-soft backdrop-blur-xl', className)} />;
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {subtitle ? <p className="text-sm text-white/60">{subtitle}</p> : null}
    </div>
  );
}
