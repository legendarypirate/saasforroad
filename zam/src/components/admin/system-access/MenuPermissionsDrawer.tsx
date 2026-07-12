'use client';

import React, { useEffect, useState } from 'react';
import { Button, Drawer, Space } from '@/components/admin/primitives';
import { Checkbox } from '@/components/ui/checkbox';

export type DrawerPermission = {
  id: number;
  key?: string;
  action?: string;
  label?: string | null;
  menu_key?: string | null;
};

type Props = {
  open: boolean;
  menuLabel: string;
  permissions: DrawerPermission[];
  /** Currently assigned permission ids for this menu */
  selectedIds: number[];
  saving?: boolean;
  onClose: () => void;
  onSave: (nextIds: number[]) => void;
};

function isMenuReadPermission(p: DrawerPermission): boolean {
  const action = (p.action || '').toLowerCase();
  if (action === 'read' || action === 'view' || action === 'summary') return true;
  const key = p.key || '';
  return /:(read|view|summary)$/.test(key);
}

export function MenuPermissionsDrawer({
  open,
  menuLabel,
  permissions,
  selectedIds,
  saving,
  onClose,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<number[]>([]);

  useEffect(() => {
    if (open) setDraft([...selectedIds]);
  }, [open, selectedIds]);

  const toggle = (id: number, checked: boolean) => {
    setDraft((prev) => {
      let next = checked ? [...prev, id] : prev.filter((x) => x !== id);
      if (checked) {
        const readPerm = permissions.find(isMenuReadPermission);
        if (readPerm && !next.includes(readPerm.id)) {
          next = [...next, readPerm.id];
        }
      }
      return Array.from(new Set(next));
    });
  };

  const labelOf = (p: DrawerPermission) => {
    if (p.label) return p.label;
    if (p.key) return p.key;
    return p.action || String(p.id);
  };

  return (
    <Drawer
      title={`${menuLabel} — эрхүүд`}
      width={420}
      open={open}
      onClose={onClose}
      footer={
        <Space className="w-full justify-end">
          <Button onClick={onClose} disabled={saving}>
            Цуцлах
          </Button>
          <Button type="primary" loading={saving} onClick={() => onSave(draft)}>
            Хадгалах
          </Button>
        </Space>
      }
    >
      <div className="space-y-3">
        {permissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Энэ цэсэд permission олдсонгүй. Seed ажиллуулна уу.
          </p>
        ) : (
          permissions.map((p) => {
            const checked = draft.includes(p.id);
            return (
              <label
                key={p.id}
                className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => toggle(p.id, v === true)}
                  className="mt-0.5"
                />
                <span className="text-sm leading-snug">{labelOf(p)}</span>
              </label>
            );
          })
        )}
      </div>
    </Drawer>
  );
}
