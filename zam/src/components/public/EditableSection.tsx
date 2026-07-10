'use client';

import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function EditableSection({
  title,
  editLabel = 'Засах',
  onEdit,
  children,
  className,
}: {
  title: string;
  editLabel?: string;
  onEdit?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  if (!onEdit) return <>{children}</>;

  return (
    <div className={cn('group/edit relative', className)}>
      <div className="pointer-events-none absolute inset-0 z-20 rounded-none ring-0 transition group-hover/edit:ring-2 group-hover/edit:ring-primary/40 dark:group-hover/edit:ring-[var(--neon-green)]/40" />
      <div className="absolute right-3 top-3 z-30 flex items-center gap-2 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover/edit:opacity-100">
        <span className="hidden rounded-full bg-background/95 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm sm:inline">
          {title}
        </span>
        <Button
          type="button"
          size="sm"
          variant="default"
          className="shadow-md"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil className="size-3.5" />
          {editLabel}
        </Button>
      </div>
      {children}
    </div>
  );
}
