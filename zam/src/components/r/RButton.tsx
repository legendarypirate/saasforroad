'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

import { Button as UiButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type RButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'link';

export type RButtonSize = 'sm' | 'md' | 'lg';

type UiVariant = React.ComponentProps<typeof UiButton>['variant'];
type UiSize = React.ComponentProps<typeof UiButton>['size'];

const VARIANT_MAP: Record<RButtonVariant, UiVariant> = {
  primary: 'default',
  secondary: 'secondary',
  outline: 'outline',
  ghost: 'ghost',
  danger: 'destructive',
  link: 'link',
};

const SIZE_MAP: Record<RButtonSize, UiSize> = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
};

export type RButtonProps = Omit<
  React.ComponentProps<typeof UiButton>,
  'variant' | 'size'
> & {
  variant?: RButtonVariant;
  size?: RButtonSize;
  loading?: boolean;
  /** Icon rendered before the label. */
  iconLeft?: React.ReactNode;
  /** Icon rendered after the label. */
  iconRight?: React.ReactNode;
  /** Stretch to fill the parent width. */
  block?: boolean;
};

export const RButton = React.forwardRef<HTMLButtonElement, RButtonProps>(
  function RButton(
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      iconLeft,
      iconRight,
      block = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <UiButton
        ref={ref}
        variant={VARIANT_MAP[variant]}
        size={SIZE_MAP[size]}
        disabled={disabled || loading}
        className={cn(block && 'w-full', className)}
        {...props}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          iconLeft && <span className="inline-flex shrink-0">{iconLeft}</span>
        )}
        {children}
        {!loading && iconRight && (
          <span className="inline-flex shrink-0">{iconRight}</span>
        )}
      </UiButton>
    );
  },
);
