'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

import { Button as UiButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type AntdButtonProps = {
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  size?: 'small' | 'middle' | 'large' | string;
  danger?: boolean;
  icon?: React.ReactNode;
  loading?: boolean;
  htmlType?: 'button' | 'submit' | 'reset';
  block?: boolean;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  style?: React.CSSProperties;
  [key: string]: unknown;
};

function mapVariant(type?: string, danger?: boolean): React.ComponentProps<typeof UiButton>['variant'] {
  if (danger) return 'destructive';
  if (type === 'link' || type === 'text') return 'link';
  if (type === 'dashed' || type === 'default') return 'outline';
  return 'default';
}

function mapSize(size?: string): React.ComponentProps<typeof UiButton>['size'] {
  if (size === 'small') return 'sm';
  if (size === 'large') return 'lg';
  return 'default';
}

export function Button({
  type = 'default',
  danger,
  icon,
  loading,
  htmlType = 'button',
  block,
  className,
  children,
  size,
  disabled,
  ...props
}: AntdButtonProps) {
  return (
    <UiButton
      type={htmlType}
      variant={mapVariant(type, danger)}
      size={mapSize(size)}
      disabled={disabled || loading}
      className={cn(block && 'w-full', className)}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </UiButton>
  );
}
