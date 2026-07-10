'use client';

import React from 'react';

import { Alert as UiAlert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs as UiTabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type TabItem = {
  key: string;
  label: React.ReactNode;
  children: React.ReactNode;
};

export function Tabs({
  items,
  defaultActiveKey,
  activeKey,
  onChange,
  className,
  tabBarExtraContent,
}: {
  items?: TabItem[];
  defaultActiveKey?: string;
  activeKey?: string;
  onChange?: (key: string) => void;
  className?: string;
  tabBarExtraContent?: React.ReactNode;
}) {
  const [internal, setInternal] = React.useState(defaultActiveKey ?? items?.[0]?.key ?? '');
  const current = activeKey ?? internal;

  return (
    <UiTabs
      value={current}
      onValueChange={(v) => {
        setInternal(v);
        onChange?.(v);
      }}
      className={cn('w-full gap-0', className)}
    >
      <div className="mb-4 flex items-end gap-3 border-b border-border">
        <div className="min-w-0 flex-1 overflow-x-auto scrollbar-thin">
          <TabsList
            variant="line"
            className="h-auto min-h-10 w-max min-w-full justify-start gap-0 rounded-none border-0 bg-transparent p-0"
          >
            {items?.map((item) => (
              <TabsTrigger
                key={item.key}
                value={item.key}
                className={cn(
                  'h-10 flex-none shrink-0 rounded-none border-0 px-4 py-2.5 text-sm font-medium',
                  'text-muted-foreground hover:text-foreground',
                  'data-active:bg-transparent data-active:text-primary data-active:shadow-none',
                  'after:!bottom-0 after:h-0.5 after:bg-primary',
                  'dark:data-active:text-[var(--neon-green)] dark:after:bg-[var(--neon-green)]',
                )}
              >
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {tabBarExtraContent ? (
          <div className="mb-1.5 shrink-0">{tabBarExtraContent}</div>
        ) : null}
      </div>
      {items?.map((item) => (
        <TabsContent key={item.key} value={item.key} className="mt-0 outline-none">
          {item.children}
        </TabsContent>
      ))}
    </UiTabs>
  );
}

export function Descriptions({
  title,
  bordered,
  column,
  size,
  children,
  className,
  style,
}: {
  title?: React.ReactNode;
  bordered?: boolean;
  column?: number | { xs?: number; sm?: number; md?: number; lg?: number };
  size?: 'small' | 'middle' | 'default';
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const cols =
    typeof column === 'number'
      ? column
      : column?.md ?? column?.sm ?? column?.xs ?? 2;
  return (
    <div className={cn('space-y-3', size === 'small' && 'text-sm', className)} style={style}>
      {title && <h3 className="text-base font-semibold">{title}</h3>}
      <div
        className={cn(
          'grid gap-3',
          bordered && 'rounded-lg border p-4',
        )}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {children}
      </div>
    </div>
  );
}

function DescriptionsItem({
  label,
  children,
  span = 1,
}: {
  label: React.ReactNode;
  children?: React.ReactNode;
  span?: number;
}) {
  return (
    <div style={{ gridColumn: `span ${span}` }} className="space-y-1">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

Descriptions.Item = DescriptionsItem;

export function Collapse({
  items,
  defaultActiveKey,
}: {
  items?: Array<{
    key: string;
    label: React.ReactNode;
    children: React.ReactNode;
    extra?: React.ReactNode;
  }>;
  defaultActiveKey?: string | string[];
}) {
  const [openKeys, setOpenKeys] = React.useState<string[]>(
    Array.isArray(defaultActiveKey) ? defaultActiveKey : defaultActiveKey ? [defaultActiveKey] : [],
  );

  return (
    <div className="space-y-2">
      {items?.map((item) => {
        const open = openKeys.includes(item.key);
        return (
          <div key={item.key} className="rounded-lg border">
            <div className="flex w-full items-center gap-2 px-4 py-3">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center justify-between text-left font-medium"
                onClick={() =>
                  setOpenKeys((prev) =>
                    prev.includes(item.key) ? prev.filter((k) => k !== item.key) : [...prev, item.key],
                  )
                }
              >
                <span className="min-w-0">{item.label}</span>
                <span className="ml-2 shrink-0">{open ? '−' : '+'}</span>
              </button>
              {item.extra ? <div className="shrink-0">{item.extra}</div> : null}
            </div>
            {open && <div className="border-t px-4 py-3">{item.children}</div>}
          </div>
        );
      })}
    </div>
  );
}

export function Progress({
  percent = 0,
  status,
  type = 'line',
  size,
  strokeColor,
  trailColor,
  strokeWidth,
  format,
  style,
  className,
}: {
  percent?: number;
  status?: string;
  type?: 'line' | 'circle' | 'dashboard';
  size?: number;
  strokeColor?: string;
  trailColor?: string;
  strokeWidth?: number;
  format?: (percent?: number) => React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, percent));
  const stroke = status === 'exception' ? undefined : strokeColor;

  if (type === 'circle' || type === 'dashboard') {
    const dim = size ?? 120;
    const sw = strokeWidth ?? 8;
    const r = (dim - sw) / 2;
    const c = 2 * Math.PI * r;
    const offset = c - (pct / 100) * c;
    const label = format ? format(Math.round(pct)) : `${Math.round(pct)}%`;

    return (
      <div
        className={cn('relative inline-flex items-center justify-center', className)}
        style={{ width: dim, height: dim, ...style }}
      >
        <svg width={dim} height={dim} className="-rotate-90">
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            fill="none"
            stroke={trailColor || 'currentColor'}
            strokeWidth={sw}
            className={trailColor ? undefined : 'text-muted'}
            opacity={trailColor ? 1 : 0.25}
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            fill="none"
            stroke={stroke || (status === 'exception' ? 'var(--destructive)' : 'var(--primary)')}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="transition-all"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">{label}</div>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)} style={style}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted" style={{ background: trailColor }}>
        <div
          className={cn(
            'h-full rounded-full bg-primary transition-all',
            status === 'exception' && 'bg-destructive',
          )}
          style={{
            width: `${pct}%`,
            background: stroke,
          }}
        />
      </div>
      {format ? <div className="mt-1 text-sm text-muted-foreground">{format(Math.round(pct))}</div> : null}
    </div>
  );
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  marks,
  className,
}: {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  marks?: Record<number, React.ReactNode>;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <input
        type="range"
        min={min}
        max={max}
        value={value ?? min}
        onChange={(e) => onChange?.(Number(e.target.value))}
        className="w-full"
      />
      {marks && (
        <div className="flex justify-between text-xs text-muted-foreground">
          {Object.entries(marks).map(([mark, label]) => (
            <span key={mark}>{label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export function Alert({
  message,
  description,
  type = 'info',
  showIcon,
  className,
  style,
}: {
  message?: React.ReactNode;
  description?: React.ReactNode;
  type?: 'success' | 'info' | 'warning' | 'error';
  showIcon?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <UiAlert
      className={className}
      style={style}
      variant={type === 'error' ? 'destructive' : 'default'}
    >
      {message && <AlertTitle>{message}</AlertTitle>}
      {description && <AlertDescription>{description}</AlertDescription>}
      {showIcon ? null : null}
    </UiAlert>
  );
}

export function Breadcrumb({
  items,
}: {
  items?: Array<{ title: React.ReactNode; href?: string }>;
}) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      {items?.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span>/</span>}
          <span>{item.title}</span>
        </React.Fragment>
      ))}
    </nav>
  );
}

export function Empty({
  description,
  image,
  children,
}: {
  description?: React.ReactNode;
  image?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
      {image}
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}

Empty.PRESENTED_IMAGE_SIMPLE = null;

export function List({
  dataSource,
  renderItem,
  loading,
}: {
  dataSource?: unknown[];
  renderItem?: (item: unknown) => React.ReactNode;
  loading?: boolean;
}) {
  if (loading) return <p className="text-sm text-muted-foreground">Ачааллаж байна...</p>;
  return (
    <div className="divide-y rounded-lg border">
      {dataSource?.map((item, index) => (
        <div key={index}>{renderItem?.(item)}</div>
      ))}
    </div>
  );
}

function ListItem({ children, actions }: { children?: React.ReactNode; actions?: React.ReactNode[] }) {
  return (
    <div className="flex items-start justify-between gap-4 p-4">
      <div className="flex-1">{children}</div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

function ListItemMeta({
  title,
  description,
  avatar,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  avatar?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      {avatar}
      <div>
        <div className="font-medium">{title}</div>
        {description && <div className="text-sm text-muted-foreground">{description}</div>}
      </div>
    </div>
  );
}

const ListItemCompound = Object.assign(ListItem, { Meta: ListItemMeta });

List.Item = ListItemCompound;
