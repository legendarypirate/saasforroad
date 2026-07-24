'use client';

import React from 'react';
import { Plus, RefreshCw } from 'lucide-react';

import { RButton } from '@/components/r/RButton';
import { RPageToolbar } from '@/components/r/RPageToolbar';
import { RSearch } from '@/components/r/RSearch';

export type AdminListToolbarProps = {
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
  actions?: React.ReactNode;
  className?: string;
};

/**
 * Canonical list-page chrome: search strip + primary actions.
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
              <span className="block text-base font-semibold text-foreground">
                {title}
              </span>
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
            <RButton
              variant="outline"
              iconLeft={<RefreshCw className="size-4" />}
              onClick={onReload}
            >
              Шинэчлэх
            </RButton>
          ) : null}
          {onCreate ? (
            <RButton
              variant="primary"
              iconLeft={<Plus className="size-4" />}
              onClick={onCreate}
            >
              {createLabel}
            </RButton>
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
