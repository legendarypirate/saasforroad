/**
 * Enterprise Module → Menu → Action permission defs for seeding.
 * Keep in sync with zam/src/lib/permissionCatalog.ts + adminNavigation.
 */

const DEFAULT_ACTIONS = ['read', 'create', 'update', 'delete'];

const ACTION_LABELS = {
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

/** @type {Array<{ index: string, label: string, menus: Array<{ menuId: string, label: string, actions?: string[] }> }>} */
const MODULES = [
  {
    index: 'system',
    label: 'Эрхийн зохицуулалт',
    menus: [{ menuId: 'role', label: 'Эрхийн зохицуулалт', actions: ['read', 'create', 'update', 'delete'] }],
  },
  {
    index: 'finance',
    label: 'Санхүү',
    menus: [
      'dashboard', 'accounts', 'invoices', 'bills', 'payments', 'contracts', 'budgets', 'expenses', 'vat',
    ].map((menuId) => ({
      menuId,
      label: menuId,
      actions: menuId === 'reports' ? ['read', 'export'] : ['read', 'create', 'update', 'delete', 'approve'],
    })).concat([{ menuId: 'reports', label: 'Тайлан', actions: ['read', 'export'] }]),
  },
  {
    index: 'gps',
    label: 'GPS',
    menus: ['live', 'history', 'devices'].map((menuId) => ({ menuId, label: menuId })),
  },
  {
    index: 'hr',
    label: 'HR',
    menus: [
      'user', 'org_structure', 'action', 'feedback', 'attendance', 'device',
      'leave_request', 'office_location', 'attendance_calculation', 'salary_calculation',
    ].map((menuId) => ({ menuId, label: menuId })),
  },
  {
    index: 'operations',
    label: 'Төсөл / Ажил',
    menus: ['project', 'task', 'calendar'].map((menuId) => ({ menuId, label: menuId })),
  },
  {
    index: 'rental',
    label: 'Түрээс',
    menus: ['dashboard', 'contracts', 'payments'].map((menuId) => ({ menuId, label: menuId })),
  },
  {
    index: 'equipment',
    label: 'Техник',
    menus: ['list', 'categories'].map((menuId) => ({ menuId, label: menuId })),
  },
  {
    index: 'inventory',
    label: 'Бараа материал',
    menus: ['category', 'item', 'warehouse', 'stock', 'transaction', 'supplier'].map((menuId) => ({
      menuId,
      label: menuId,
      actions: ['read', 'create', 'update', 'delete', 'approve', 'adjust'],
    })),
  },
  {
    index: 'homepage',
    label: 'Нүүр хуудас',
    menus: [{ menuId: 'content', label: 'Контент', actions: ['read', 'update', 'write'] }],
  },
  {
    index: 'tender',
    label: 'Тендер',
    menus: [{ menuId: 'list', label: 'Тендер багц' }],
  },
  {
    index: 'document',
    label: 'Баримт бичиг',
    menus: [{ menuId: 'list', label: 'Баримт бичиг' }],
  },
  {
    index: 'notification',
    label: 'Мэдэгдэл',
    menus: [{ menuId: 'list', label: 'Мэдэгдэл' }],
  },
  {
    index: 'uniform',
    label: 'Хувцас хангамж',
    menus: ['dashboard', 'items', 'stock', 'issues', 'returns', 'requests', 'reports'].map((menuId) => ({
      menuId,
      label: menuId,
      actions: menuId === 'reports' ? ['read', 'export'] : ['read', 'create', 'update', 'delete', 'approve'],
    })),
  },
  {
    index: 'fuel',
    label: 'Автопарк — Шатахуун',
    menus: ['dashboard', 'purchases', 'tanks', 'issues', 'consumption', 'suppliers', 'reports'].map((menuId) => ({
      menuId,
      label: menuId,
      actions: menuId === 'reports' ? ['read', 'export'] : menuId === 'dashboard' || menuId === 'consumption'
        ? ['read', 'create', 'update', 'delete', 'export']
        : ['read', 'create', 'update', 'delete', 'export'],
    })),
  },
  {
    index: 'daily_report',
    label: 'Daily Report',
    menus: [
      { menuId: 'summary', label: 'Өдрийн товч', actions: ['summary', 'read'] },
      { menuId: 'list', label: 'Тайлангууд' },
      { menuId: 'new', label: 'Шинэ тайлан', actions: ['read', 'create', 'write'] },
    ],
  },
  {
    index: 'hse',
    label: 'ХАБЭА',
    menus: [
      'dashboard', 'daily_safety', 'toolbox', 'observations', 'near_miss', 'incidents',
      'risk_assessment', 'permits', 'inspections', 'ppe', 'training', 'equipment_safety',
      'environment', 'capa', 'documents', 'reports', 'accident',
    ].map((menuId) => ({
      menuId,
      label: menuId,
      actions:
        menuId === 'dashboard'
          ? ['read', 'create', 'update', 'delete', 'approve', 'audit', 'mobile']
          : menuId === 'reports'
            ? ['read', 'export']
            : ['read', 'create', 'update', 'delete', 'approve'],
    })),
  },
  {
    index: 'plant',
    label: 'Үйлдвэр',
    menus: [
      'dashboard', 'sites', 'products', 'materials', 'stocks', 'movements',
      'batches', 'sales', 'expenses', 'daily_reports', 'factory_map',
    ].map((menuId) => ({
      menuId,
      label: menuId,
      actions: ['read', 'create', 'update', 'delete', 'approve'],
    })),
  },
  {
    index: 'budget',
    label: 'Төсөв',
    menus: [
      { menuId: 'dashboard', label: 'Самбар', actions: ['view', 'read', 'create', 'update', 'delete', 'approve', 'export'] },
      { menuId: 'estimator', label: 'Тооцоолуур', actions: ['view', 'read', 'create', 'update', 'delete', 'approve', 'export'] },
      { menuId: 'rates', label: 'Нэгж үнэ', actions: ['view', 'read', 'create', 'update', 'delete', 'approve', 'export'] },
      { menuId: 'compare', label: 'Харьцуулалт', actions: ['view', 'read', 'export'] },
      { menuId: 'reports', label: 'Тайлан', actions: ['view', 'read', 'export'] },
    ],
  },
  {
    index: 'road',
    label: 'Замын инженеринг',
    menus: [
      'dashboard', 'projects', 'survey', 'horizontal', 'vertical', 'stationing',
      'cross_sections', 'typical_sections', 'earthwork', 'pavement', 'drainage',
      'structures', 'quantity', 'drawings', 'reports', 'settings',
    ].map((menuId) => ({
      menuId,
      label: menuId,
      actions:
        menuId === 'reports'
          ? ['read', 'export']
          : menuId === 'settings'
            ? ['read', 'update']
            : ['read', 'create', 'update', 'delete', 'approve', 'export'],
    })),
  },
  {
    index: 'brigada',
    label: 'Бригад',
    menus: [{ menuId: 'list', label: 'Жагсаалт' }],
  },
  {
    index: 'student',
    label: 'Оюутан',
    menus: [{ menuId: 'list', label: 'Жагсаалт' }],
  },
  {
    index: 'job_seeker',
    label: 'Ажил горилогч',
    menus: [
      { menuId: 'list', label: 'Жагсаалт' },
      { menuId: 'hire_requests', label: 'Авах хүсэлт' },
    ],
  },
  {
    index: 'collab',
    label: 'Хамтын ажиллагаа',
    menus: [
      { menuId: 'marketplace', label: 'Зар зах зээл', actions: ['read'] },
      { menuId: 'ads', label: 'Миний зарууд', actions: ['read', 'create', 'update', 'delete', 'write'] },
      { menuId: 'requests', label: 'Хүсэлтүүд', actions: ['read', 'update', 'write'] },
    ],
  },
];

// Fix finance menus (avoid duplicate reports from the hack above)
MODULES.find((m) => m.index === 'finance').menus = [
  { menuId: 'dashboard', label: 'Самбар', actions: ['read', 'create', 'update', 'delete', 'approve'] },
  { menuId: 'accounts', label: 'Касс / Банк', actions: ['read', 'create', 'update', 'delete', 'approve'] },
  { menuId: 'invoices', label: 'Нэхэмжлэх', actions: ['read', 'create', 'update', 'delete', 'approve'] },
  { menuId: 'bills', label: 'Нийлүүлэгчийн нэхэмжлэх', actions: ['read', 'create', 'update', 'delete', 'approve'] },
  { menuId: 'payments', label: 'Төлбөр', actions: ['read', 'create', 'update', 'delete', 'approve'] },
  { menuId: 'contracts', label: 'Гэрээ', actions: ['read', 'create', 'update', 'delete', 'approve'] },
  { menuId: 'budgets', label: 'Төсөв', actions: ['read', 'create', 'update', 'delete', 'approve'] },
  { menuId: 'expenses', label: 'Зардал', actions: ['read', 'create', 'update', 'delete', 'approve'] },
  { menuId: 'vat', label: 'НӨАТ', actions: ['read', 'create', 'update', 'delete', 'approve'] },
  { menuId: 'reports', label: 'Тайлан', actions: ['read', 'export'] },
];

function getEnterprisePermissionDefs() {
  const rows = [];
  let sort = 0;

  for (const mod of MODULES) {
    const moduleKey = `${mod.index}:module`;
    rows.push({
      index: mod.index,
      module: mod.index,
      level: 'module',
      module_key: moduleKey,
      menu_key: null,
      action: 'module',
      key: moduleKey,
      label: `${mod.label} (модуль)`,
      sort_order: sort++,
    });

    for (const menu of mod.menus) {
      const menuIndex = `${mod.index}.${menu.menuId}`;
      const menuKey = `${menuIndex}:read`;
      const actions = menu.actions || DEFAULT_ACTIONS;

      for (const action of actions) {
        const normalized = action === 'view' ? 'view' : action;
        const key =
          normalized === 'read'
            ? menuKey
            : `${menuIndex}:${normalized}`;
        const level = normalized === 'read' || normalized === 'view' || normalized === 'summary' ? 'menu' : 'action';

        rows.push({
          index: mod.index,
          module: mod.index,
          level: level === 'menu' && normalized !== 'read' && normalized !== 'view' ? 'action' : level,
          module_key: moduleKey,
          menu_key: menuKey,
          action: normalized === 'view' ? 'view' : normalized,
          key: normalized === 'view' ? `${menuIndex}:view` : key,
          label: `${menu.label} — ${ACTION_LABELS[normalized] || normalized}`,
          sort_order: sort++,
        });
      }
    }
  }

  // Dedupe by key
  const seen = new Set();
  return rows.filter((r) => {
    if (seen.has(r.key)) return false;
    seen.add(r.key);
    return true;
  });
}

module.exports = { getEnterprisePermissionDefs, MODULES };
