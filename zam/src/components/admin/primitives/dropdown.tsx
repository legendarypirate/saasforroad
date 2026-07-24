'use client';

import React from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type MenuItemType = {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

type DropdownProps = {
  children?: React.ReactNode;
  menu?: { items?: MenuItemType[] };
  overlay?: React.ReactNode;
  trigger?: Array<'click' | 'hover' | 'contextMenu'>;
  placement?: string;
  arrow?: boolean;
};

export function Dropdown({ children, menu, overlay }: DropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton={false}
        render={<span className="inline-flex cursor-pointer" />}
      >
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {menu?.items?.map((item) => (
          <DropdownMenuItem
            key={item.key}
            disabled={item.disabled}
            variant={item.danger ? 'destructive' : 'default'}
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              item.onClick?.();
            }}
          >
            {item.icon}
            {item.label}
          </DropdownMenuItem>
        ))}
        {overlay}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DropdownMenuDivider() {
  return <DropdownMenuSeparator />;
}
