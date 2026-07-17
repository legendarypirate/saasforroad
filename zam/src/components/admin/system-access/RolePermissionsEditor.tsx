'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Collapse,
  Empty,
  Modal,
  Select,
  Table,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { DeleteOutlined, PlusOutlined } from '@/components/admin/icons';
import {
  buildPermissionCatalog,
  type CatalogMenu,
  type CatalogModule,
} from '@/lib/permissionCatalog';
import {
  MenuPermissionsDrawer,
  type DrawerPermission,
} from '@/components/admin/system-access/MenuPermissionsDrawer';

export type PermissionRow = DrawerPermission & {
  module?: string;
  index?: string;
  level?: string;
  module_key?: string | null;
  sort_order?: number;
};

type Props = {
  roleId: number;
  roleName: string;
  permissions: PermissionRow[];
  selectedIds: number[];
  canUpdate: boolean;
  onSelectedIdsChange: (ids: number[]) => void;
  onPersist: (ids: number[]) => Promise<boolean>;
};

/**
 * Legacy flat module keys (e.g. `finance:read`, `road:view`) predate the granular
 * `module.menu:action` model. They are never surfaced in this editor, yet the RBAC
 * layer expands them into visibility for the WHOLE module (all folders + submenus).
 * Left over from role seeding, they make a role see far more than what the admin
 * actually configured here. We treat the granular editor as the source of truth and
 * drop these keys on save so "what you configure is what the role gets".
 */
const STRIPPABLE_FLAT_ACTIONS = new Set([
  'read',
  'view',
  'write',
  'create',
  'update',
  'delete',
  'approve',
  'export',
  'audit',
  'adjust',
]);

function matchesMenu(p: PermissionRow, menu: CatalogMenu): boolean {
  if (p.menu_key && (p.menu_key === menu.menuKey || p.menu_key === `${menu.menuIndex}:view`)) {
    return true;
  }
  if (p.key?.startsWith(`${menu.menuIndex}:`)) return true;
  return false;
}

function countActiveForMenu(selectedIds: number[], permissions: PermissionRow[], menu: CatalogMenu) {
  const ids = new Set(selectedIds);
  return permissions.filter((p) => ids.has(p.id) && matchesMenu(p, menu)).length;
}

export function RolePermissionsEditor({
  roleId,
  permissions,
  selectedIds,
  canUpdate,
  onSelectedIdsChange,
  onPersist,
}: Props) {
  const catalog = useMemo(() => buildPermissionCatalog(), []);
  const [addOpen, setAddOpen] = useState(false);
  const [addModuleKey, setAddModuleKey] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [drawerMenu, setDrawerMenu] = useState<{
    module: CatalogModule;
    menu: CatalogMenu;
  } | null>(null);

  const permissionByKey = useMemo(() => {
    const map = new Map<string, PermissionRow>();
    for (const p of permissions) {
      if (p.key) map.set(p.key, p);
    }
    return map;
  }, [permissions]);

  const catalogModuleIndexes = useMemo(
    () => new Set(catalog.map((m) => m.index)),
    [catalog],
  );

  const isLegacyFlatKey = useCallback(
    (key?: string | null) => {
      if (!key || key.includes('.')) return false;
      const [index, action] = key.split(':');
      if (!index || !action) return false;
      if (!catalogModuleIndexes.has(index)) return false;
      return STRIPPABLE_FLAT_ACTIONS.has(action);
    },
    [catalogModuleIndexes],
  );

  const legacyFlatIds = useMemo(() => {
    const ids = new Set<number>();
    for (const p of permissions) {
      if (isLegacyFlatKey(p.key)) ids.add(p.id);
    }
    return ids;
  }, [permissions, isLegacyFlatKey]);

  const assignedModules = useMemo(() => {
    const selected = new Set(selectedIds);
    return catalog.filter((mod) => {
      const modulePerm = permissionByKey.get(mod.moduleKey);
      if (modulePerm && selected.has(modulePerm.id)) return true;
      return permissions.some(
        (p) => selected.has(p.id) && (p.module_key === mod.moduleKey || p.index === mod.index),
      );
    });
  }, [catalog, permissionByKey, permissions, selectedIds]);

  const availableModules = useMemo(() => {
    const assignedKeys = new Set(assignedModules.map((m) => m.moduleKey));
    return catalog.filter((m) => !assignedKeys.has(m.moduleKey));
  }, [assignedModules, catalog]);

  const persist = useCallback(
    async (nextIds: number[]) => {
      // Granular editor is authoritative — never re-save legacy flat module keys.
      const cleaned = nextIds.filter((id) => !legacyFlatIds.has(id));
      setSaving(true);
      try {
        const ok = await onPersist(cleaned);
        if (ok) onSelectedIdsChange(cleaned);
        return ok;
      } finally {
        setSaving(false);
      }
    },
    [onPersist, onSelectedIdsChange, legacyFlatIds],
  );

  // One-time cleanup: if a role is already managed granularly (has module or
  // menu-level keys) but still carries leftover legacy flat keys, drop them so the
  // user sees exactly what is configured here. Pure legacy (flat-only) roles are
  // left untouched to avoid silently removing access on mere viewing.
  useEffect(() => {
    if (!canUpdate) return;
    const selected = new Set(selectedIds);
    const hasLegacy = selectedIds.some((id) => legacyFlatIds.has(id));
    if (!hasLegacy) return;
    const hasGranular = permissions.some(
      (p) =>
        selected.has(p.id) &&
        (p.key?.includes('.') || p.key?.endsWith(':module')),
    );
    if (!hasGranular) return;
    const cleaned = selectedIds.filter((id) => !legacyFlatIds.has(id));
    void persist(cleaned);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, legacyFlatIds, permissions, canUpdate]);

  const handleAddModule = async () => {
    if (!addModuleKey) {
      message.warning('Модуль сонгоно уу');
      return;
    }
    const mod = catalog.find((m) => m.moduleKey === addModuleKey);
    if (!mod) return;
    const modulePerm = permissionByKey.get(mod.moduleKey);
    if (!modulePerm) {
      message.error(`Модулийн эрх олдсонгүй: ${mod.moduleKey}.`);
      return;
    }
    // Grant the module key AND every menu action under it by default, so the
    // folder is immediately usable (clickable menus) instead of an empty shell.
    // The admin can then uncheck specific actions per menu.
    const grantIds = [modulePerm.id];
    for (const menu of mod.menus) {
      for (const act of menu.actions) {
        const perm = permissionByKey.get(act.key);
        if (perm) grantIds.push(perm.id);
      }
    }
    const next = Array.from(new Set([...selectedIds, ...grantIds]));
    const ok = await persist(next);
    if (ok) {
      message.success(`${mod.label} модуль нэмэгдлээ`);
      setAddOpen(false);
      setAddModuleKey(undefined);
    }
  };

  const handleRemoveModule = (mod: CatalogModule) => {
    Modal.confirm({
      title: `"${mod.label}" модулийг хасах уу?`,
      content: 'Энэ модулийн бүх цэс / эрхийн тохиргоо устна.',
      okText: 'Хасах',
      cancelText: 'Цуцлах',
      onOk: async () => {
        const removeIds = new Set(
          permissions
            .filter(
              (p) =>
                p.module_key === mod.moduleKey ||
                p.key === mod.moduleKey ||
                p.index === mod.index ||
                (p.key?.startsWith(`${mod.index}.`) ?? false),
            )
            .map((p) => p.id),
        );
        const next = selectedIds.filter((id) => !removeIds.has(id));
        const ok = await persist(next);
        if (ok) message.success('Модуль хасагдлаа');
      },
    });
  };

  const openMenuDrawer = (module: CatalogModule, menu: CatalogMenu) => {
    if (!canUpdate) {
      message.error('Эрх тохируулах эрхгүй');
      return;
    }
    setDrawerMenu({ module, menu });
  };

  const drawerPermissions = useMemo(() => {
    if (!drawerMenu) return [];
    const list = permissions.filter((p) => matchesMenu(p, drawerMenu.menu));
    return list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.id - b.id));
  }, [drawerMenu, permissions]);

  const drawerSelectedIds = useMemo(() => {
    const ids = new Set(selectedIds);
    return drawerPermissions.filter((p) => ids.has(p.id)).map((p) => p.id);
  }, [drawerPermissions, selectedIds]);

  const handleDrawerSave = async (menuIds: number[]) => {
    if (!drawerMenu) return;
    const menuPermIds = new Set(drawerPermissions.map((p) => p.id));
    const withoutMenu = selectedIds.filter((id) => !menuPermIds.has(id));
    const next = Array.from(new Set([...withoutMenu, ...menuIds]));
    const ok = await persist(next);
    if (ok) {
      message.success('Эрх хадгалагдлаа');
      setDrawerMenu(null);
    }
  };

  const menuColumns = (mod: CatalogModule): ColumnsType<CatalogMenu> => [
    {
      title: 'Цэс',
      dataIndex: 'label',
      render: (label: string) => label,
    },
    {
      title: 'Эрх',
      width: 160,
      render: (_, menu) => {
        const count = countActiveForMenu(selectedIds, permissions, menu);
        const text = count > 0 ? `${count} эрх` : 'Эрх тохируулах';
        return (
          <Button type="link" disabled={!canUpdate} onClick={() => openMenuDrawer(mod, menu)}>
            {text}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-4" key={roleId}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {canUpdate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
            Модуль нэмэх
          </Button>
        )}
      </div>

      {assignedModules.length === 0 ? (
        <Empty description="Модуль байхгүй. «Модуль нэмэх» дарж эхлүүлнэ үү." />
      ) : (
        <Collapse
          defaultActiveKey={assignedModules.map((m) => m.moduleKey)}
          items={assignedModules.map((mod) => ({
            key: mod.moduleKey,
            label: (
              <span className="flex items-center gap-2">
                <span
                  className="inline-block size-2.5 rounded-full"
                  style={{ background: mod.color }}
                />
                {mod.label}
              </span>
            ),
            extra: canUpdate ? (
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveModule(mod);
                }}
              >
                Хасах
              </Button>
            ) : null,
            children: (
              <Table
                columns={menuColumns(mod)}
                dataSource={mod.menus}
                rowKey="menuId"
                pagination={false}
                size="small"
              />
            ),
          }))}
        />
      )}

      <Modal
        title="Модуль нэмэх"
        open={addOpen}
        onCancel={() => {
          setAddOpen(false);
          setAddModuleKey(undefined);
        }}
        onOk={handleAddModule}
        okText="Нэмэх"
        cancelText="Цуцлах"
        confirmLoading={saving}
        okButtonProps={{ disabled: !addModuleKey || availableModules.length === 0 }}
      >
        {availableModules.length === 0 ? (
          <p className="text-sm text-muted-foreground">Бүх модуль нэмэгдсэн байна.</p>
        ) : (
          <Select
            className="w-full"
            placeholder="Модуль сонгох"
            value={addModuleKey}
            onChange={(v) => setAddModuleKey(String(v))}
            options={availableModules.map((m) => ({ value: m.moduleKey, label: m.label }))}
          />
        )}
      </Modal>

      <MenuPermissionsDrawer
        open={!!drawerMenu}
        menuLabel={drawerMenu?.menu.label || ''}
        permissions={drawerPermissions}
        selectedIds={drawerSelectedIds}
        saving={saving}
        onClose={() => setDrawerMenu(null)}
        onSave={handleDrawerSave}
      />
    </div>
  );
}
