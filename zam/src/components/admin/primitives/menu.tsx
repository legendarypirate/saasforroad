'use client';

import React from 'react';

import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type MenuItemProps = {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  key?: string;
};

function MenuItem({ children, icon, onClick, disabled, danger }: MenuItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted',
        disabled && 'cursor-not-allowed opacity-50',
        danger && 'text-destructive',
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function MenuDivider() {
  return <Separator className="my-1" />;
}

type MenuClickInfo = {
  key: string;
  domEvent: React.MouseEvent<HTMLButtonElement>;
};

type MenuProps = {
  children?: React.ReactNode;
  mode?: 'horizontal' | 'vertical' | 'inline';
  selectedKeys?: string[];
  items?: Array<{ key: string; label: React.ReactNode; icon?: React.ReactNode; danger?: boolean; disabled?: boolean }>;
  onClick?: (info: MenuClickInfo) => void;
  className?: string;
  style?: React.CSSProperties;
};

function MenuRoot({ children, mode = 'vertical', selectedKeys, items, onClick, className, style }: MenuProps) {
  if (items) {
    return (
      <div
        className={cn(
          mode === 'horizontal' ? 'flex items-center gap-1' : 'flex flex-col gap-1',
          className,
        )}
        style={style}
      >
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            disabled={item.disabled}
            onClick={(domEvent) => {
              domEvent.stopPropagation();
              onClick?.({ key: item.key, domEvent });
            }}
            className={cn(
              'rounded-md px-3 py-2 text-sm hover:bg-muted',
              selectedKeys?.includes(item.key) && 'bg-muted font-medium text-primary',
              item.danger && 'text-destructive',
            )}
          >
            <span className="inline-flex items-center gap-2">
              {item.icon}
              {item.label}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(mode === 'horizontal' ? 'flex items-center gap-1' : 'flex flex-col gap-1', className)}
      style={style}
    >
      {children}
    </div>
  );
}

export const Menu = Object.assign(MenuRoot, { Item: MenuItem, Divider: MenuDivider });
export type { MenuProps };
