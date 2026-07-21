'use client';

import React from 'react';

import { RButton, type RButtonVariant, type RButtonSize } from '@/components/r/RButton';
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

function mapVariant(type?: string, danger?: boolean): RButtonVariant {
  if (danger) return 'danger';
  if (type === 'primary') return 'primary';
  if (type === 'link') return 'link';
  if (type === 'text') return 'ghost';
  // default / dashed
  return 'outline';
}

function mapSize(size?: string): RButtonSize {
  if (size === 'small') return 'sm';
  if (size === 'large') return 'lg';
  return 'md';
}

/** Square dimensions for icon-only buttons so they don't render as cramped pills. */
const ICON_ONLY_SQUARE: Record<RButtonSize, string> = {
  sm: 'size-8 p-0',
  md: 'size-10 p-0',
  lg: 'size-11 p-0',
};

function isEmptyChildren(children: React.ReactNode): boolean {
  return (
    children == null ||
    children === false ||
    (typeof children === 'string' && children.trim() === '')
  );
}

/**
 * AntD-shaped Button, now rendered through the shared {@link RButton} kit so
 * every page inherits the same look & behaviour.
 */
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
  const rSize = mapSize(size);
  const iconOnly = icon != null && isEmptyChildren(children);

  return (
    <RButton
      type={htmlType}
      variant={mapVariant(type, danger)}
      size={rSize}
      loading={loading}
      iconLeft={icon}
      block={block}
      disabled={disabled}
      className={cn(iconOnly && ICON_ONLY_SQUARE[rSize], className)}
      {...props}
    >
      {children}
    </RButton>
  );
}
