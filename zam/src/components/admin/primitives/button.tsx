'use client';

import React from 'react';

import { RButton, type RButtonVariant, type RButtonSize } from '@/components/r/RButton';

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
  return (
    <RButton
      type={htmlType}
      variant={mapVariant(type, danger)}
      size={mapSize(size)}
      loading={loading}
      iconLeft={icon}
      block={block}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </RButton>
  );
}
