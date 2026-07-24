'use client';

import React from 'react';

import { Popconfirm } from '@/components/admin/primitives';
import { RActionButton, RTableActions } from '@/components/r';

export type AdminCrudActionsProps = {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void | Promise<void>;
  deleteTitle?: string;
  className?: string;
  /** Extra action buttons rendered after the standard ones. */
  children?: React.ReactNode;
};

/**
 * Canonical row-action cluster for admin list tables.
 * Use this everywhere instead of text / link icon buttons.
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
        <Popconfirm title={deleteTitle} onConfirm={onDelete}>
          <span>
            <RActionButton preset="delete" />
          </span>
        </Popconfirm>
      ) : null}
      {children}
    </RTableActions>
  );
}
