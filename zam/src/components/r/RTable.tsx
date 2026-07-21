'use client';

import React from 'react';

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { RSpinner } from './RSpinner';
import { REmpty } from './REmpty';

export type RTableAlign = 'left' | 'center' | 'right';

export type RTableColumn<T> = {
  key: string;
  title: React.ReactNode;
  /** Custom cell renderer. Falls back to `row[dataIndex]`. */
  render?: (row: T, index: number) => React.ReactNode;
  dataIndex?: keyof T;
  align?: RTableAlign;
  width?: number | string;
  className?: string;
  headerClassName?: string;
};

export type RTableProps<T> = {
  columns: RTableColumn<T>[];
  data: T[];
  rowKey: keyof T | ((row: T, index: number) => string | number);
  loading?: boolean;
  empty?: React.ReactNode;
  onRowClick?: (row: T, index: number) => void;
  size?: 'sm' | 'md';
  stickyHeader?: boolean;
  className?: string;
  /** Wrap in a bordered card surface (default true). */
  bordered?: boolean;
};

const ALIGN_CLASS: Record<RTableAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

function resolveKey<T>(
  rowKey: RTableProps<T>['rowKey'],
  row: T,
  index: number,
): string | number {
  if (typeof rowKey === 'function') return rowKey(row, index);
  const value = row[rowKey];
  return (value as string | number | undefined) ?? index;
}

export function RTable<T>({
  columns,
  data,
  rowKey,
  loading,
  empty,
  onRowClick,
  size = 'md',
  stickyHeader,
  className,
  bordered = true,
}: RTableProps<T>) {
  const cellPad = size === 'sm' ? 'px-2 py-1.5' : 'px-3 py-2.5';

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        bordered && 'rounded-xl ring-1 ring-foreground/10 bg-card',
        className,
      )}
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                style={{ width: col.width }}
                className={cn(
                  'h-11 font-semibold text-muted-foreground',
                  cellPad,
                  ALIGN_CLASS[col.align ?? 'left'],
                  stickyHeader && 'sticky top-0 z-10 bg-muted/60 backdrop-blur',
                  col.headerClassName,
                )}
              >
                {col.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-0">
                <RSpinner center label="Ачааллаж байна…" />
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-0">
                {empty ?? <REmpty />}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow
                key={resolveKey(rowKey, row, index)}
                onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {columns.map((col) => {
                  const content = col.render
                    ? col.render(row, index)
                    : col.dataIndex != null
                      ? (row[col.dataIndex] as React.ReactNode)
                      : null;
                  return (
                    <TableCell
                      key={col.key}
                      className={cn(
                        cellPad,
                        ALIGN_CLASS[col.align ?? 'left'],
                        col.className,
                      )}
                    >
                      {content}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/** Convenience wrapper to render a row of action buttons in a table cell. */
export function RTableActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('flex items-center justify-end gap-1', className)}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}
