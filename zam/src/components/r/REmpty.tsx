'use client';

import React from 'react';
import { Inbox } from 'lucide-react';

import { cn } from '@/lib/utils';
import { RText } from './RText';

export type REmptyProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  /** Call-to-action slot (e.g. an RButton). */
  action?: React.ReactNode;
  className?: string;
};

export function REmpty({
  title = 'Мэдээлэл алга',
  description,
  icon,
  action,
  className,
}: REmptyProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center gap-2 px-4 py-12 text-center',
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-6">
        {icon ?? <Inbox />}
      </div>
      <RText variant="subtitle">{title}</RText>
      {description && <RText variant="muted">{description}</RText>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
