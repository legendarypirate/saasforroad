import {
  ADMIN_DATA_FOLDERS,
  ADMIN_MODULES,
  type ModuleConfig,
  type NavItemConfig,
} from '@/config/adminNavigation';
import { ACTIONS } from '@/lib/rbac';

export type CatalogAction = {
  action: string;
  key: string;
  label: string;
};

export type CatalogMenu = {
  menuId: string;
  path: string;
  label: string;
  /** Primary read/view key used for nav visibility */
  menuKey: string;
  /** Key prefix without action, e.g. finance.accounts */
  menuIndex: string;
  actions: CatalogAction[];
};

export type CatalogModule = {
  id: string;
  index: string;
  moduleKey: string;
  label: string;
  color: string;
  menus: CatalogMenu[];
};

const ACTION_LABELS: Record<string, string> = {
  module: 'Модуль харах',
  read: 'Үзэх',
  view: 'Үзэх',
  create: 'Нэмэх',
  update: 'Засах',
  delete: 'Устгах',
  approve: 'Батлах',
  write: 'Засах / бичих',
  export: 'Экспорт',
  summary: 'Товч харах',
  audit: 'Аудит',
  mobile: 'Апп',
  adjust: 'Тохируулга',
};

const DEFAULT_MENU_ACTIONS = ['read', 'create', 'update', 'delete'] as const;

/** Last path segment → menuId (finance/accounts → accounts) */
export function pathToMenuId(path: string): string {
  const parts = path.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
  const last = parts[parts.length - 1] || 'root';
  return last.replace(/-/g, '_');
}

export function moduleIndexOf(mod: ModuleConfig): string {
  if (mod.moduleKey?.endsWith(':module')) {
    return mod.moduleKey.slice(0, -':module'.length);
  }
  if ((mod as { index?: string }).index) {
    return (mod as { index?: string }).index!;
  }
  return mod.id.replace(/^data-/, '').replace(/-/g, '_');
}

export function moduleKeyOf(mod: ModuleConfig): string {
  return mod.moduleKey || `${moduleIndexOf(mod)}:module`;
}

function menuIndexFromPermission(permission: string, fallbackIndex: string, menuId: string): string {
  if (permission.includes('.')) {
    const [left] = permission.split(':');
    return left || `${fallbackIndex}.${menuId}`;
  }
  return `${fallbackIndex}.${menuId}`;
}

function actionsForItem(item: NavItemConfig, menuIndex: string): CatalogAction[] {
  const custom = (item as { actions?: string[] }).actions;
  const actionNames = custom?.length ? custom : [...DEFAULT_MENU_ACTIONS];

  // Preserve special single-action menus (summary, write-only homepage, export, view)
  if (item.permission && !custom) {
    const [, actionPart] = item.permission.split(':');
    if (actionPart && !['read', 'view'].includes(actionPart) && actionNames.includes('read')) {
      // keep defaults but ensure the declared action exists
      if (!actionNames.includes(actionPart)) {
        actionNames.push(actionPart);
      }
    }
  }

  const unique = Array.from(new Set(actionNames));
  return unique.map((action) => ({
    action,
    key: `${menuIndex}:${action}`,
    label: ACTION_LABELS[action] || action,
  }));
}

function catalogFromModules(modules: ModuleConfig[]): CatalogModule[] {
  return modules
    .filter((m) => !m.comingSoon && m.items.some((i) => i.permission))
    .map((mod) => {
      const index = moduleIndexOf(mod);
      const moduleKey = moduleKeyOf(mod);
      const menus: CatalogMenu[] = mod.items
        .filter((item) => item.permission)
        .map((item) => {
          const menuId = (item as { menuId?: string }).menuId || pathToMenuId(item.path);
          const menuIndex = menuIndexFromPermission(item.permission!, index, menuId);
          const menuKey = item.permission!.includes('.')
            ? item.permission!
            : `${menuIndex}:read`;
          // Normalize view → use menuKey as stored; actions use menuIndex
          const normalizedMenuIndex = menuKey.includes(':')
            ? menuKey.replace(/:[^:]+$/, '')
            : menuIndex;
          return {
            menuId,
            path: item.path,
            label: item.label,
            menuKey: menuKey.endsWith(':view')
              ? `${normalizedMenuIndex}:read`
              : menuKey.includes('.')
                ? menuKey
                : `${normalizedMenuIndex}:read`,
            menuIndex: normalizedMenuIndex,
            actions: actionsForItem(item, normalizedMenuIndex),
          };
        });

      return {
        id: mod.id,
        index,
        moduleKey,
        label: mod.label,
        color: mod.color,
        menus,
      };
    });
}

/** Full catalog for system-access UI (modules + data folders). */
export function buildPermissionCatalog(): CatalogModule[] {
  const raw = catalogFromModules([...ADMIN_MODULES, ...ADMIN_DATA_FOLDERS]);
  // Same moduleKey can appear in ADMIN_MODULES and ADMIN_DATA_FOLDERS (e.g. plant)
  const byKey = new Map<string, CatalogModule>();
  for (const mod of raw) {
    const existing = byKey.get(mod.moduleKey);
    if (!existing) {
      byKey.set(mod.moduleKey, { ...mod, menus: [...mod.menus] });
      continue;
    }
    const seenMenu = new Set(existing.menus.map((m) => m.menuId));
    for (const menu of mod.menus) {
      if (seenMenu.has(menu.menuId)) continue;
      existing.menus.push(menu);
      seenMenu.add(menu.menuId);
    }
  }
  return Array.from(byKey.values());
}

/** Flat permission defs for seeding / sync (module + menu actions). */
export function flattenCatalogPermissions(catalog = buildPermissionCatalog()) {
  const rows: Array<{
    index: string;
    module: string;
    level: 'module' | 'menu' | 'action';
    module_key: string;
    menu_key: string | null;
    action: string;
    key: string;
    label: string;
    sort_order: number;
  }> = [];

  let sort = 0;
  for (const mod of catalog) {
    rows.push({
      index: mod.index,
      module: mod.index,
      level: 'module',
      module_key: mod.moduleKey,
      menu_key: null,
      action: ACTIONS.MODULE,
      key: mod.moduleKey,
      label: `${mod.label} (модуль)`,
      sort_order: sort++,
    });

    for (const menu of mod.menus) {
      for (const act of menu.actions) {
        const level = act.action === 'read' || act.action === 'view' ? 'menu' : 'action';
        rows.push({
          index: mod.index,
          module: mod.index,
          level,
          module_key: mod.moduleKey,
          menu_key: menu.menuKey,
          action: act.action === 'view' ? 'read' : act.action,
          key: act.key,
          label: `${menu.label} — ${act.label}`,
          sort_order: sort++,
        });
      }
    }
  }

  return rows;
}

export { ACTION_LABELS };
