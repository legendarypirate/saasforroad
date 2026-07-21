'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const textVariants = cva('', {
  variants: {
    variant: {
      /** Big page/screen heading */
      pageTitle: 'font-heading text-2xl font-bold tracking-tight text-foreground',
      /** Card / section heading */
      title: 'font-heading text-lg font-semibold text-foreground',
      /** Sub heading under a title */
      subtitle: 'font-heading text-base font-medium text-foreground',
      /** Small uppercase group label */
      section:
        'text-xs font-semibold uppercase tracking-wider text-muted-foreground',
      /** Default body copy */
      body: 'text-sm text-foreground',
      /** Secondary / helper copy */
      muted: 'text-sm text-muted-foreground',
      /** Form field label */
      label: 'text-sm font-medium text-foreground',
      /** Tiny caption */
      caption: 'text-xs text-muted-foreground',
    },
    tone: {
      default: '',
      primary: 'text-primary',
      danger: 'text-destructive',
      success: 'text-emerald-600 dark:text-emerald-400',
      warning: 'text-amber-600 dark:text-amber-400',
    },
    truncate: {
      true: 'truncate',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'body',
    tone: 'default',
    truncate: false,
  },
});

type RTextProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof textVariants> & {
    /** Render as a different element (defaults per variant). */
    as?: keyof React.JSX.IntrinsicElements;
  };

const DEFAULT_TAG: Record<string, keyof React.JSX.IntrinsicElements> = {
  pageTitle: 'h1',
  title: 'h2',
  subtitle: 'h3',
  section: 'p',
  body: 'p',
  muted: 'p',
  label: 'span',
  caption: 'span',
};

export function RText({
  as,
  variant = 'body',
  tone,
  truncate,
  className,
  children,
  ...props
}: RTextProps) {
  const Tag = (as ?? DEFAULT_TAG[variant ?? 'body'] ?? 'p') as React.ElementType;
  return (
    <Tag className={cn(textVariants({ variant, tone, truncate }), className)} {...props}>
      {children}
    </Tag>
  );
}

export { textVariants };
