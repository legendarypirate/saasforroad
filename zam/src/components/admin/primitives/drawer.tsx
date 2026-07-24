'use client';

import React from 'react';

import { RDrawer, type RDrawerSide } from '@/components/r/RDrawer';

type DrawerProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  open?: boolean;
  visible?: boolean;
  onClose?: () => void;
  width?: number | string;
  height?: number | string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  extra?: React.ReactNode;
  className?: string;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  bodyStyle?: React.CSSProperties;
  destroyOnClose?: boolean;
  [key: string]: unknown;
};

/**
 * AntD-shaped Drawer, rendered through the shared {@link RDrawer} kit so all
 * CRUD slide-overs share one look & behaviour.
 */
export function Drawer({
  title,
  open,
  visible,
  onClose,
  width = 560,
  height,
  children,
  footer,
  extra,
  className,
  placement = 'right',
  bodyStyle,
  destroyOnClose,
  description,
}: DrawerProps) {
  const side: RDrawerSide = placement ?? 'right';
  return (
    <RDrawer
      open={open ?? visible ?? false}
      onClose={() => onClose?.()}
      title={title}
      description={description}
      extra={extra}
      footer={footer}
      side={side}
      width={width}
      height={height}
      destroyOnClose={destroyOnClose}
      className={className}
      bodyStyle={bodyStyle}
    >
      {children}
    </RDrawer>
  );
}
