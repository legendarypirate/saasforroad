'use client';

import React from 'react';

import { RActionButton } from '@/components/r/RActionButton';
import { RTableActions } from '@/components/r/RTable';

export type AdminCrudActionsProps = {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void | Promise<void>;
  deleteTitle?: string;
  className?: string;
  children?: React.ReactNode;
};

/**
 * Canonical row-action cluster for admin list tables.
 */
export function AdminCrudActions({
  onView,
  onEdit,
  onDelete,
  deleteTitle = 'Устгах уу?',
  className,
  children,
}: AdminCrudActionsProps) {
  return (
    <RTableActions className={className}>
      {onView ? <RActionButton preset="view" onClick={onView} /> : null}
      {onEdit ? <RActionButton preset="edit" onClick={onEdit} /> : null}
      {onDelete ? (
        <RActionButton
          preset="delete"
          onClick={() => {
            if (typeof window !== 'undefined' && window.confirm(deleteTitle)) {
              void onDelete();
            }
          }}
        />
      ) : null}
      {children}
    </RTableActions>
  );
}
