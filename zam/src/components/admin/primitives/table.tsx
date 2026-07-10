'use client';

import React, { useMemo, useState } from 'react';

import {
  Table as UiTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export type ColumnsType<T = any> = Array<{
  title?: React.ReactNode;
  dataIndex?: keyof T | string | (string | number)[];
  key?: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: number | string;
  fixed?: 'left' | 'right';
  align?: 'left' | 'right' | 'center';
  ellipsis?: boolean;
  sorter?: boolean | ((a: T, b: T) => number);
  filters?: Array<{ text: React.ReactNode; value: string | number | boolean }>;
  onFilter?: (value: string | number | boolean, record: T) => boolean;
  [key: string]: unknown;
}>;

type TablePagination =
  | false
  | {
      pageSize?: number;
      current?: number;
      total?: number;
      showSizeChanger?: boolean;
      position?: string | string[];
      onChange?: (page: number, pageSize: number) => void;
      onShowSizeChange?: (page: number, pageSize: number) => void;
      [key: string]: unknown;
    };

type TableProps<T> = {
  columns: ColumnsType<T>;
  dataSource?: T[];
  rowKey?: string | ((record: T) => string);
  loading?: boolean;
  bordered?: boolean;
  pagination?: TablePagination;
  scroll?: { x?: number | string; y?: number | string };
  className?: string;
  style?: React.CSSProperties;
  size?: 'small' | 'middle' | 'large' | string;
  children?: React.ReactNode;
  rowClassName?: string | ((record: T, index: number) => string);
  rowSelection?: {
    selectedRowKeys?: React.Key[];
    onChange?: (keys: React.Key[], rows: T[]) => void;
    getCheckboxProps?: (record: T) => { disabled?: boolean };
    columnWidth?: number;
  };
  summary?: (data: T[]) => React.ReactNode;
  expandable?: Record<string, unknown>;
  onRow?: (record: T) => Record<string, unknown>;
};

function hasPagination(
  pagination: TablePagination | undefined,
): pagination is Exclude<TablePagination, false | undefined> {
  return pagination !== undefined && pagination !== false;
}

function resolveRowKey<T extends object>(
  record: T,
  index: number,
  rowKey?: string | ((record: T) => string),
) {
  if (typeof rowKey === 'function') return rowKey(record);
  if (rowKey) return String((record as Record<string, unknown>)[rowKey]);
  return String((record as Record<string, unknown>).id ?? index);
}

function getValue<T>(record: T, dataIndex?: keyof T | string | (string | number)[]) {
  if (!dataIndex) return undefined;
  if (Array.isArray(dataIndex)) {
    let cur: unknown = record;
    for (const key of dataIndex) {
      if (cur === null || cur === undefined || typeof cur !== 'object') return undefined;
      cur = (cur as Record<string, unknown>)[String(key)];
    }
    return cur;
  }
  return (record as Record<string, unknown>)[dataIndex as string];
}

function Summary({ children }: { children?: React.ReactNode; fixed?: boolean }) {
  return <tfoot>{children}</tfoot>;
}

function SummaryRow({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return <tr style={style}>{children}</tr>;
}

function SummaryCell({
  children,
  colSpan,
  align,
}: {
  children?: React.ReactNode;
  index?: number;
  colSpan?: number;
  align?: 'left' | 'right' | 'center';
}) {
  return (
    <td colSpan={colSpan} style={{ textAlign: align }}>
      {children}
    </td>
  );
}

Summary.Row = SummaryRow;
Summary.Cell = SummaryCell;

function TableComponent<T extends object = any>({
  columns,
  dataSource,
  rowKey,
  loading,
  bordered,
  pagination,
  scroll,
  className,
  style,
  size,
  children,
  rowClassName,
  rowSelection,
  summary,
}: TableProps<T>) {
  const [page, setPage] = useState(hasPagination(pagination) ? pagination.current ?? 1 : 1);
  const source = dataSource ?? [];
  const pageSize = hasPagination(pagination) ? pagination.pageSize ?? 10 : source.length;

  const rows = useMemo(() => {
    if (!hasPagination(pagination)) return source;
    const start = (page - 1) * pageSize;
    return source.slice(start, start + pageSize);
  }, [source, page, pageSize, pagination]);

  const totalPages = Math.max(1, Math.ceil(source.length / pageSize));

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    if (hasPagination(pagination)) {
      pagination.onChange?.(nextPage, pageSize);
    }
  };

  const selectedKeys = rowSelection?.selectedRowKeys ?? [];
  const selectableRows = rowSelection
    ? rows.filter((record, index) => !rowSelection.getCheckboxProps?.(record)?.disabled)
    : [];
  const selectableKeys = selectableRows.map((record, index) =>
    resolveRowKey(record, rows.indexOf(record), rowKey),
  );
  const allSelected =
    selectableKeys.length > 0 && selectableKeys.every((key) => selectedKeys.includes(key));
  const someSelected =
    selectableKeys.some((key) => selectedKeys.includes(key)) && !allSelected;

  const toggleRow = (record: T, index: number, checked: boolean) => {
    if (!rowSelection) return;
    const key = resolveRowKey(record, index, rowKey);
    const nextKeys = checked
      ? [...selectedKeys, key]
      : selectedKeys.filter((k) => k !== key);
    const nextRows = source.filter((r, i) => nextKeys.includes(resolveRowKey(r, i, rowKey)));
    rowSelection.onChange?.(nextKeys, nextRows);
  };

  const toggleAll = (checked: boolean) => {
    if (!rowSelection) return;
    if (!checked) {
      rowSelection.onChange?.([], []);
      return;
    }
    const nextKeys = selectableKeys;
    const nextRows = source.filter((r, i) => nextKeys.includes(resolveRowKey(r, i, rowKey)));
    rowSelection.onChange?.(nextKeys, nextRows);
  };

  const selectionWidth = rowSelection?.columnWidth ?? 40;
  const totalColumns = columns.length + (rowSelection ? 1 : 0);

  return (
    <div className={cn('space-y-3', className)} style={style}>
      <div
        className={cn('relative overflow-x-auto', bordered && 'rounded-lg border')}
        style={scroll?.y ? { maxHeight: scroll.y, overflowY: 'auto' } : undefined}
      >
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
            <Spinner className="size-6 text-primary" />
          </div>
        )}
        <UiTable
          style={scroll?.x ? { minWidth: scroll.x } : undefined}
          className={cn('admin-data-table', size === 'small' && 'text-sm')}
        >
          <TableHeader className={scroll?.y ? 'sticky top-0 z-10 bg-muted/95 backdrop-blur-sm' : undefined}>
            <TableRow>
              {rowSelection && (
                <TableHead style={{ width: selectionWidth }} className="text-center">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onCheckedChange={(checked) => toggleAll(checked === true)}
                    aria-label="Бүгдийг сонгох"
                  />
                </TableHead>
              )}
              {columns.map((col, i) => (
                <TableHead
                  key={col.key ?? String(col.dataIndex ?? i)}
                  style={{ width: col.width, minWidth: col.width, textAlign: col.align }}
                >
                  {col.title}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((record, index) => {
              const rowClass =
                typeof rowClassName === 'function' ? rowClassName(record, index) : rowClassName;
              const key = resolveRowKey(record, index, rowKey);
              const checkboxProps = rowSelection?.getCheckboxProps?.(record);
              return (
              <TableRow key={key} className={rowClass}>
                {rowSelection && (
                  <TableCell className="text-center">
                    <Checkbox
                      checked={selectedKeys.includes(key)}
                      disabled={checkboxProps?.disabled}
                      onCheckedChange={(checked) => toggleRow(record, index, checked === true)}
                      aria-label="Мөр сонгох"
                    />
                  </TableCell>
                )}
                {columns.map((col, colIndex) => {
                  const value = getValue(record, col.dataIndex);
                  return (
                    <TableCell
                      key={col.key ?? String(col.dataIndex ?? colIndex)}
                      style={{ textAlign: col.align, minWidth: col.width }}
                    >
                      {col.render ? col.render(value, record, index) : (value as React.ReactNode)}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
            })}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={totalColumns} className="py-8 text-center text-muted-foreground">
                  Мэдээлэл олдсонгүй
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {summary ? summary(source) : children}
        </UiTable>
      </div>
      {hasPagination(pagination) && source.length > pageSize && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <button
            type="button"
            className="rounded border px-2 py-1 disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            Өмнөх
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            className="rounded border px-2 py-1 disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            Дараах
          </button>
        </div>
      )}
    </div>
  );
}

export const Table = Object.assign(TableComponent, { Summary });
