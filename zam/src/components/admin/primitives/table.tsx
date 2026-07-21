'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

import {
  Table as UiTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const DEFAULT_PAGE_SIZES = [10, 15, 20, 30, 50];

/** Build a 1 … n page list with ellipsis, mirroring the reference MPagination. */
function buildPageList(
  current: number,
  total: number,
): Array<number | 'ellipsis-start' | 'ellipsis-end'> {
  const MAX_VISIBLE = 7;
  if (total <= MAX_VISIBLE) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: Array<number | 'ellipsis-start' | 'ellipsis-end'> = [1];
  let startPage: number;
  let endPage: number;

  if (current <= 3) {
    startPage = 2;
    endPage = 5;
  } else if (current >= total - 2) {
    startPage = total - 4;
    endPage = total - 1;
  } else {
    startPage = current - 1;
    endPage = current + 1;
  }

  if (startPage > 2) pages.push('ellipsis-start');
  for (let i = startPage; i <= endPage; i++) {
    if (i > 1 && i < total) pages.push(i);
  }
  if (endPage < total - 1) pages.push('ellipsis-end');
  pages.push(total);
  return pages;
}

const pageButtonClass =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors';

function TablePaginationFooter({
  page,
  pageSize,
  total,
  totalPages,
  pageSizeOptions,
  showSizeChanger,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  pageSizeOptions: number[];
  showSizeChanger: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const pages = buildPageList(page, totalPages);

  return (
    <div className="flex flex-col items-center gap-2 border-t px-3 py-2 md:flex-row md:justify-between">
      <div className="text-sm text-muted-foreground">
        Бүгд {total} мэдээлэл, {page}-р хуудас / нийт {totalPages} хуудас
      </div>
      <div className="flex items-center gap-2">
        {showSizeChanger && (
          <Select
            value={String(pageSize)}
            onValueChange={(v) => v && onPageSizeChange(Number(v))}
          >
            <SelectTrigger className="h-9 w-[72px] cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((s) => (
                <SelectItem key={s} value={String(s)} className="cursor-pointer">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {totalPages > 1 && (
          <nav className="flex items-center gap-1">
            <button
              type="button"
              className={cn(
                pageButtonClass,
                'gap-1 px-3 hover:bg-muted',
                page <= 1 && 'pointer-events-none opacity-50',
              )}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="size-4" />
              Өмнөх
            </button>
            {pages.map((p) =>
              typeof p === 'string' ? (
                <span key={p} className="inline-flex h-9 w-9 items-center justify-center text-muted-foreground">
                  <MoreHorizontal className="size-4" />
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  aria-current={p === page ? 'page' : undefined}
                  className={cn(
                    pageButtonClass,
                    p === page
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted',
                  )}
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </button>
              ),
            )}
            <button
              type="button"
              className={cn(
                pageButtonClass,
                'gap-1 px-3 hover:bg-muted',
                page >= totalPages && 'pointer-events-none opacity-50',
              )}
              onClick={() => onPageChange(page + 1)}
            >
              Дараах
              <ChevronRight className="size-4" />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}

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
  const initialPageSize = hasPagination(pagination) ? pagination.pageSize ?? 10 : source.length;
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    if (hasPagination(pagination) && pagination.pageSize) {
      setPageSize(pagination.pageSize);
    }
  }, [hasPagination(pagination) ? pagination.pageSize : undefined]);

  const rows = useMemo(() => {
    if (!hasPagination(pagination)) return source;
    const start = (page - 1) * pageSize;
    return source.slice(start, start + pageSize);
  }, [source, page, pageSize, pagination]);

  const totalPages = Math.max(1, Math.ceil(source.length / pageSize));

  const handlePageChange = (nextPage: number) => {
    const clamped = Math.min(Math.max(1, nextPage), totalPages);
    setPage(clamped);
    if (hasPagination(pagination)) {
      pagination.onChange?.(clamped, pageSize);
    }
  };

  const handlePageSizeChange = (nextSize: number) => {
    setPageSize(nextSize);
    setPage(1);
    if (hasPagination(pagination)) {
      pagination.onShowSizeChange?.(1, nextSize);
      pagination.onChange?.(1, nextSize);
    }
  };

  const pageSizeOptions =
    (hasPagination(pagination) && (pagination.pageSizeOptions as number[] | undefined)) ||
    DEFAULT_PAGE_SIZES;
  const showSizeChanger =
    hasPagination(pagination) && pagination.showSizeChanger !== false;

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
    <div className={cn('overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10', className)} style={style}>
      <div
        className={cn(
          'relative overflow-x-auto',
          bordered && '[&_td]:border [&_th]:border',
        )}
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
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {rowSelection && (
                <TableHead style={{ width: selectionWidth }} className="h-11 text-center font-semibold text-muted-foreground">
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
                  className="h-11 font-semibold text-muted-foreground"
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
      {hasPagination(pagination) && source.length > 0 && (
        <TablePaginationFooter
          page={page}
          pageSize={pageSize}
          total={source.length}
          totalPages={totalPages}
          pageSizeOptions={pageSizeOptions}
          showSizeChanger={showSizeChanger}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}

export const Table = Object.assign(TableComponent, { Summary });
