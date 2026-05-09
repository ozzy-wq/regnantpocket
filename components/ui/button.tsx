import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={clsx(
        'rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 px-4 py-2 font-semibold text-black transition duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-40',
        className
      )}
    />
  );
}
