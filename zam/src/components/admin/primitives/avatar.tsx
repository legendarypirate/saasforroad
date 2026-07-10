'use client';

import React from 'react';
import { User } from 'lucide-react';

import { Avatar as UiAvatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type AvatarProps = {
  src?: string;
  icon?: React.ReactNode;
  size?: 'small' | 'default' | 'large' | number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

const sizeMap = {
  small: 'size-7',
  default: 'size-9',
  large: 'size-11',
};

function AvatarBase({ src, icon, size = 'default', className, style, children }: AvatarProps) {
  const sizeClass = typeof size === 'number' ? undefined : sizeMap[size] ?? sizeMap.default;

  return (
    <UiAvatar
      className={cn(sizeClass, className)}
      style={typeof size === 'number' ? { width: size, height: size, ...style } : style}
    >
      {src && <AvatarImage src={src} />}
      <AvatarFallback>{children ?? icon ?? <User className="size-4" />}</AvatarFallback>
    </UiAvatar>
  );
}

function AvatarGroup({
  children,
  maxCount,
  size,
}: {
  children?: React.ReactNode;
  maxCount?: number;
  size?: AvatarProps['size'];
}) {
  const items = React.Children.toArray(children);
  const visible = maxCount ? items.slice(0, maxCount) : items;
  return <div className="flex -space-x-2">{visible}</div>;
}

export const Avatar = Object.assign(AvatarBase, { Group: AvatarGroup });
