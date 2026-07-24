'use client';

import React from 'react';

import { Button } from '@/components/admin/primitives';
import { PlusOutlined, ReloadOutlined } from '@/components/admin/icons';
import { RPageToolbar, RSearch } from '@/components/r';

export type AdminListToolbarProps = {
  /** Optional page title inside the content card (module nav already shows module name). */
  title?: React.ReactNode;
  description?: React.ReactNode;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  showSearch?: boolean;
  onReload?: () => void;
  onCreate?: () => void;
  createLabel?: string;
  filters?: React.ReactNode;
  /** Extra buttons next to create/reload. */
  actions?: React.ReactNode;
  className?: string;
};

/**
 * Canonical list-page chrome: search strip + primary actions.
 * Pair with primitives `Table` + {@link AdminCrudActions}.
 */
export function AdminListToolbar({
  title,
  description,
  searchValue = '',
  searchPlaceholder = 'Хайлт хийх',
  onSearchChange,
  onSearch,
  showSearch = false,
  onReload,
  onCreate,
  createLabel = 'Нэмэх',
  filters,
  actions,
  className,
}: AdminListToolbarProps) {
  const hasSearch = showSearch || onSearchChange != null || onSearch != null;

  return (
    <RPageToolbar
      className={className}
      title={
        title || description ? (
          <div className="space-y-0.5">
            {title ? (
              <span className="block text-base font-semibold text-foreground">{title}</span>
            ) : null}
            {description ? (
              <span className="block text-sm font-normal text-muted-foreground">
                {description}
              </span>
            ) : null}
          </div>
        ) : undefined
      }
      actions={
        <>
          {actions}
          {onReload ? (
            <Button icon={<ReloadOutlined />} onClick={onReload}>
              Шинэчлэх
            </Button>
          ) : null}
          {onCreate ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
              {createLabel}
            </Button>
          ) : null}
        </>
      }
      search={
        hasSearch ? (
          <RSearch
            showButton
            value={searchValue}
            onChange={onSearchChange}
            onSearch={onSearch ?? onSearchChange}
            placeholder={searchPlaceholder}
            containerClassName="w-full"
          />
        ) : undefined
      }
      filters={filters}
    />
  );
}
