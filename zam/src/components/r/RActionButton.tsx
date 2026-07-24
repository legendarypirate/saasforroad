'use client';

import React from 'react';
import {
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  Download,
  Copy,
  Check,
  Plus,
  type LucideIcon,
} from 'lucide-react';

import { Button as UiButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type RActionPreset =
  | 'view'
  | 'edit'
  | 'delete'
  | 'more'
  | 'download'
  | 'copy'
  | 'check'
  | 'add';

type Tone = 'default' | 'primary' | 'danger' | 'success';

const PRESETS: Record<
  RActionPreset,
  { icon: LucideIcon; label: string; tone: Tone }
> = {
  view: { icon: Eye, label: 'Харах', tone: 'default' },
  edit: { icon: Pencil, label: 'Засах', tone: 'default' },
  delete: { icon: Trash2, label: 'Устгах', tone: 'danger' },
  more: { icon: MoreHorizontal, label: 'Бусад', tone: 'default' },
  download: { icon: Download, label: 'Татах', tone: 'default' },
  copy: { icon: Copy, label: 'Хуулах', tone: 'default' },
  check: { icon: Check, label: 'Баталгаажуулах', tone: 'success' },
  add: { icon: Plus, label: 'Нэмэх', tone: 'primary' },
};

/** Square table actions: outline for edit/view, coral fill for delete. */
const TONE_CLASS: Record<Tone, string> = {
  default:
    'border border-[#e5e7eb] bg-white text-[#4b5563] shadow-none hover:bg-[#f9fafb] hover:border-[#d1d5db] hover:text-[#111827] dark:border-border dark:bg-card dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground',
  primary:
    'border border-primary/25 bg-white text-primary shadow-none hover:bg-primary/5 hover:border-primary/40 dark:bg-card',
  danger:
    'border-transparent bg-[#f07167] text-white shadow-none hover:bg-[#e85d52] dark:bg-[#e57373] dark:hover:bg-[#ef5350]',
  success:
    'border-transparent bg-emerald-500/15 text-emerald-700 shadow-none hover:bg-emerald-500/25 dark:text-emerald-400',
};

const SIZE_CLASS = {
  sm: "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
  md: "size-8 rounded-md [&_svg:not([class*='size-'])]:size-4",
  lg: "size-9 rounded-lg [&_svg:not([class*='size-'])]:size-4",
} as const;

export type RActionButtonProps = Omit<
  React.ComponentProps<typeof UiButton>,
  'size' | 'children' | 'variant'
> & {
  preset?: RActionPreset;
  icon?: React.ReactNode;
  /** Native title / aria-label. Pass null to hide. */
  label?: string | null;
  tone?: Tone;
  size?: keyof typeof SIZE_CLASS;
};

export function RActionButton({
  preset,
  icon,
  label,
  tone,
  size = 'md',
  className,
  type = 'button',
  ...props
}: RActionButtonProps) {
  const presetDef = preset ? PRESETS[preset] : undefined;
  const Icon = presetDef?.icon;
  const resolvedTone = tone ?? presetDef?.tone ?? 'default';
  const resolvedLabel = label === undefined ? presetDef?.label : label;

  return (
    <UiButton
      type={type}
      variant="outline"
      title={resolvedLabel ?? undefined}
      aria-label={resolvedLabel ?? undefined}
      className={cn(
        'shrink-0 p-0 transition-colors',
        SIZE_CLASS[size],
        TONE_CLASS[resolvedTone],
        className,
      )}
      {...props}
    >
      {icon ?? (Icon ? <Icon strokeWidth={2} /> : null)}
    </UiButton>
  );
}
