'use client';

import React from 'react';
import NextImage from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Card as UiCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type LooseProps = {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
};

export function Space({
  children,
  className,
  style,
  wrap,
  size,
  direction = 'horizontal',
}: LooseProps & {
  wrap?: boolean;
  size?: number | 'small' | 'middle' | 'large';
  direction?: 'horizontal' | 'vertical';
}) {
  const gap =
    size === 'small' ? 8 : size === 'large' ? 16 : size === 'middle' ? 12 : typeof size === 'number' ? size : 8;
  return (
    <div
      className={cn(
        'flex',
        direction === 'vertical' ? 'flex-col' : 'items-center',
        wrap && 'flex-wrap',
        className,
      )}
      style={{ gap, ...style }}
    >
      {children}
    </div>
  );
}

export function Row({
  children,
  className,
  style,
  gutter,
}: LooseProps & { gutter?: number | [number, number] }) {
  const [gapX, gapY] = Array.isArray(gutter) ? gutter : [gutter ?? 0, gutter ?? 0];
  return (
    <div
      className={cn('grid grid-cols-12', className)}
      style={{ columnGap: gapX, rowGap: gapY, ...style }}
    >
      {children}
    </div>
  );
}

export function Col({
  children,
  className,
  style,
  xs,
  sm,
  md,
  lg,
  xl,
  span,
}: LooseProps & {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  span?: number;
}) {
  const cols = span ?? xl ?? lg ?? md ?? sm ?? xs ?? 24;
  const gridSpan = Math.max(1, Math.min(12, Math.round(cols / 2)));
  return (
    <div className={cn('min-w-0', className)} style={{ gridColumn: `span ${gridSpan}`, ...style }}>
      {children}
    </div>
  );
}

const tagColors: Record<string, string> = {
  green: 'bg-emerald-100 text-emerald-800',
  blue: 'bg-blue-100 text-blue-800',
  red: 'bg-red-100 text-red-800',
  orange: 'bg-orange-100 text-orange-800',
  purple: 'bg-purple-100 text-purple-800',
  gold: 'bg-amber-100 text-amber-800',
};

export function Tag({
  children,
  color,
  className,
  style,
}: {
  children?: React.ReactNode;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Badge variant="secondary" className={cn(color && tagColors[color], className)} style={style}>
      {children}
    </Badge>
  );
}

export function Card({
  title,
  children,
  className,
  style,
  extra,
  size,
  bordered,
  styles,
}: LooseProps & {
  title?: React.ReactNode;
  extra?: React.ReactNode;
  size?: 'small' | 'default';
  bordered?: boolean;
  styles?: { body?: React.CSSProperties; header?: React.CSSProperties };
}) {
  return (
    <UiCard
      className={cn('h-full w-full', size === 'small' && 'shadow-sm', bordered === false && 'border-0 shadow-none', className)}
      style={style}
    >
      {title && (
        <CardHeader
          className={cn('flex-row items-center justify-between space-y-0', size === 'small' && 'px-4 py-3')}
          style={styles?.header}
        >
          <CardTitle className={cn('text-base', size === 'small' && 'text-sm')}>{title}</CardTitle>
          {extra}
        </CardHeader>
      )}
      <CardContent className={cn(size === 'small' && 'px-4 py-3')} style={styles?.body}>
        {children}
      </CardContent>
    </UiCard>
  );
}

function Title({
  level = 4,
  children,
  className,
  style,
  onClick,
}: {
  level?: 1 | 2 | 3 | 4 | 5;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  const TagName = (`h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements);
  const sizes = {
    1: 'text-3xl font-extrabold',
    2: 'text-2xl font-bold',
    3: 'text-xl font-bold',
    4: 'text-lg font-semibold',
    5: 'text-base font-semibold',
  };
  return (
    <TagName className={cn(sizes[level], className)} style={style} onClick={onClick}>
      {children}
    </TagName>
  );
}

function Text({
  children,
  type,
  className,
  style,
  strong,
  code,
  ellipsis,
}: {
  children?: React.ReactNode;
  type?: 'secondary' | 'success' | 'warning' | 'danger';
  className?: string;
  style?: React.CSSProperties;
  strong?: boolean;
  code?: boolean;
  ellipsis?: boolean;
}) {
  const tone =
    type === 'secondary'
      ? 'text-muted-foreground'
      : type === 'success'
        ? 'text-emerald-600'
        : type === 'warning'
          ? 'text-amber-600'
          : type === 'danger'
            ? 'text-destructive'
            : '';
  return (
    <span
      className={cn(
        tone,
        strong && 'font-semibold',
        code && 'rounded bg-muted px-1 font-mono text-sm',
        ellipsis && 'block truncate',
        className,
      )}
      style={style}
    >
      {children}
    </span>
  );
}

function Paragraph({
  children,
  type,
  className,
  style,
}: {
  children?: React.ReactNode;
  type?: 'secondary';
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <p className={cn(type === 'secondary' && 'text-muted-foreground', className)} style={style}>
      {children}
    </p>
  );
}

export const Typography = { Title, Text, Paragraph };

export function Spin({
  spinning = true,
  tip,
  children,
  size,
}: {
  spinning?: boolean;
  tip?: React.ReactNode;
  children?: React.ReactNode;
  size?: 'small' | 'default' | 'large';
}) {
  if (!children) {
    return spinning ? <Spinner className={cn('text-primary', size === 'large' && 'size-8')} /> : null;
  }
  return (
    <div className="relative">
      {spinning && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/60">
          <Spinner className={cn('text-primary', size === 'large' && 'size-8')} />
          {tip && <span className="text-sm text-muted-foreground">{tip}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <Separator className={className} />;
}

export function Statistic({
  title,
  value,
  className,
  valueStyle,
  suffix,
  prefix,
}: {
  title?: React.ReactNode;
  value?: React.ReactNode;
  className?: string;
  valueStyle?: React.CSSProperties;
  suffix?: React.ReactNode;
  prefix?: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-bold" style={valueStyle}>
        {prefix}
        {value}
        {suffix}
      </div>
    </div>
  );
}

export function AntImage({
  src,
  alt,
  width,
  height,
  className,
  style,
}: {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (!src) return null;
  if (width && height) {
    return <NextImage src={src} alt={alt ?? ''} width={width} height={height} className={className} style={style} />;
  }
  return <img src={src} alt={alt ?? ''} className={className} style={style} />;
}

export const Image = AntImage;
