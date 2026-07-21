'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Status pill with semantic tones. Use for table status columns, tags, etc.
 */
const rBadgeVariants = cva(
  'inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap [&>svg]:size-3',
  {
    variants: {
      tone: {
        neutral: 'border-transparent bg-muted text-muted-foreground',
        primary: 'border-transparent bg-primary/10 text-primary',
        success:
          'border-transparent bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
        warning:
          'border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400',
        danger: 'border-transparent bg-destructive/10 text-destructive',
        info: 'border-transparent bg-sky-500/12 text-sky-600 dark:text-sky-400',
        outline: 'border-border text-foreground',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  },
);

export type RBadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof rBadgeVariants> & {
    /** Optional leading dot. */
    dot?: boolean;
    icon?: React.ReactNode;
  };

export function RBadge({
  tone,
  dot,
  icon,
  className,
  children,
  ...props
}: RBadgeProps) {
  return (
    <span className={cn(rBadgeVariants({ tone }), className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {icon}
      {children}
    </span>
  );
}

export { rBadgeVariants };
