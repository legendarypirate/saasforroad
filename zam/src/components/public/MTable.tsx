'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

function MTable({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div data-slot="table-container">
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  );
}

function MTableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        '[&_tr]:border-b sticky top-0 z-20 backdrop-blur supports-backdrop-filter:bg-gray-50/60',
        className,
      )}
      {...props}
    />
  );
}

function MTableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  );
}

function MTableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn('bg-muted/50 border-t font-medium [&>tr]:last:border-b-0', className)}
      {...props}
    />
  );
}

function MTableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'hover:bg-muted/60 data-[state=selected]:bg-muted border-b transition-colors bg-background',
        className,
      )}
      {...props}
    />
  );
}

function MTableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'h-9 px-3 text-left align-middle font-semibold whitespace-nowrap text-xs bg-gray-100 uppercase tracking-wider text-muted-foreground [&:has-[[role=checkbox]]:pr-0 *:[[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  );
}

function MTableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'px-3 py-1 align-middle whitespace-nowrap text-sm [&:has-[[role=checkbox]]:pr-0 *:[[role=checkbox]]:translate-y-[2px] border-b',
        className,
      )}
      {...props}
    />
  );
}

function MTableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('text-muted-foreground mt-2 text-xs', className)}
      {...props}
    />
  );
}

export {
  MTable,
  MTableHeader,
  MTableBody,
  MTableFooter,
  MTableHead,
  MTableRow,
  MTableCell,
  MTableCaption,
};