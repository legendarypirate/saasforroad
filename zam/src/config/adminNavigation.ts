export interface NavItemConfig {
  path: string;
  label: string;
  permission?: string;
}

export interface ModuleConfig {
  id: string;
  label: string;
  description: string;
  color: string;
  items: NavItemConfig[];
  comingSoon?: boolean;
}

export const DASHBOARD_PATH = '/admin';

export const ADMIN_MODULES: ModuleConfig[] = [
  {
    id: 'operations',
    label: 'Төсөл / Ажил',
    description: 'Төсөл, даалгавар, календар',
    color: '#1890ff',
    items: [
      { path: '/admin/project', label: 'Төслүүд', permission: 'project:read' },
      { path: '/admin/task', label: 'Үүрэг даалгаврууд', permission: 'task:read' },
      { path: '/admin/calendar', label: 'Календар' },
    ],
  },
  {
    id: 'rental',
    label: 'Түрээс',
    description: 'Машин, тоног, барилгын хэрэгслийн түрээс',
    color: '#0d9488',
    items: [
      { path: '/admin/rental', label: 'Самбар', permission: 'rental:read' },
      { path: '/admin/rental/contracts', label: 'Түрээсийн гэрээ', permission: 'rental:read' },
      { path: '/admin/rental/payments', label: 'Төлбөр', permission: 'rental:read' },
    ],
  },
  {
    id: 'equipment',
    label: 'Техник',
    description: 'Техникийн бүртгэл, ангилал, ТО, бичиг баримт',
    color: '#1d4ed8',
    items: [
      { path: '/admin/equipment', label: 'Бүртгэл', permission: 'equipment:read' },
      { path: '/admin/equipment/categories', label: 'Ангилал', permission: 'equipment:read' },
    ],
  },
  {
    id: 'inventory',
    label: 'Бараа материал',
    description: 'Агуулах, үлдэгдэл, нийлүүлэгч',
    color: '#fa8c16',
    items: [
      { path: '/admin/category', label: 'Ангилал', permission: 'inventory:read' },
      { path: '/admin/item', label: 'Бараа материал', permission: 'inventory:read' },
      { path: '/admin/warehouse', label: 'Агуулах', permission: 'inventory:read' },
      { path: '/admin/stock', label: 'Үлдэгдэл', permission: 'inventory:read' },
      { path: '/admin/transaction', label: 'Хөдөлгөөн', permission: 'inventory:read' },
      { path: '/admin/supplier', label: 'Нийлүүлэгч', permission: 'inventory:read' },
    ],
  },
  {
    id: 'hr',
    label: 'HR удирдлага',
    description: 'Хэрэглэгч, ирц, эрхийн зохицуулалт',
    color: '#722ed1',
    items: [
      { path: '/admin/user', label: 'Хэрэглэгчид', permission: 'user:read' },
      { path: '/admin/org-structure', label: 'Байгууллагын бүтэц', permission: 'user:read' },
      { path: '/admin/role', label: 'Эрхийн зохицуулалт', permission: 'role:read' },
      { path: '/admin/action', label: 'Арга хэмжээ', permission: 'action:read' },
      { path: '/admin/feedback', label: 'Санал хүсэлт', permission: 'feedback:read' },
      { path: '/admin/attendance', label: 'Ирцийн хяналт', permission: 'attendance:read' },
      { path: '/admin/device', label: 'Төхөөрөмж баталгаажуулалт', permission: 'device:read' },
      { path: '/admin/leave-request', label: 'Чөлөөний хүсэлт', permission: 'attendance:read' },
      { path: '/admin/office-location', label: 'Оффисын байршил', permission: 'attendance:read' },
      { path: '/admin/attendance-calculation', label: 'Ирц тооцоолол', permission: 'attendance:read' },
      { path: '/admin/salary-calculation', label: 'Цалин тооцоолол', permission: 'attendance:read' },
    ],
  },
  {
    id: 'homepage',
    label: 'Нүүр хуудас',
    description: 'Лого, холбоо барих, контент',
    color: '#52c41a',
    items: [
      { path: '/admin/homepage', label: 'Контент удирдлага', permission: 'homepage:write' },
    ],
  },
  {
    id: 'tender',
    label: 'Тендер материал',
    description: 'Баримт upload → AI → DOCX',
    color: '#eb2f96',
    items: [
      { path: '/admin/tender', label: 'Тендер багц', permission: 'tender:read' },
    ],
  },
  {
    id: 'document',
    label: 'Баримт бичиг',
    description: 'DMS — гэрээ, зураг, зөвшөөрөл, чанар',
    color: '#13c2c2',
    items: [
      { path: '/admin/document', label: 'Баримт бичиг', permission: 'document:read' },
    ],
  },
  {
    id: 'notification',
    label: 'Мэдэгдэл',
    description: 'Зарлал, мэдэгдэл нийтлэх',
    color: '#fa8c16',
    items: [
      { path: '/admin/notification', label: 'Мэдэгдэл', permission: 'notification:read' },
    ],
  },
  {
    id: 'finance',
    label: 'Санхүү',
    description: 'Нэхэмжлэх, төлбөр, санхүүгийн тайлан',
    color: '#2f54eb',
    items: [
      { path: '/admin/finance', label: 'Самбар', permission: 'finance:read' },
      { path: '/admin/finance/accounts', label: 'Касс / Банк', permission: 'finance:read' },
      { path: '/admin/finance/invoices', label: 'Нэхэмжлэх (авлага)', permission: 'finance:read' },
      { path: '/admin/finance/bills', label: 'Нийлүүлэгчийн нэхэмжлэх', permission: 'finance:read' },
      { path: '/admin/finance/payments', label: 'Төлбөр', permission: 'finance:read' },
      { path: '/admin/finance/contracts', label: 'Гэрээ', permission: 'finance:read' },
      { path: '/admin/finance/budgets', label: 'Төсөв', permission: 'finance:read' },
      { path: '/admin/finance/expenses', label: 'Зардлын бүртгэл', permission: 'finance:read' },
      { path: '/admin/finance/vat', label: 'НӨАТ бүртгэл', permission: 'finance:read' },
      { path: '/admin/finance/reports', label: 'Тайлан', permission: 'finance:read' },
    ],
  },
  {
    id: 'gps',
    label: 'GPS',
    description: 'Тээврийн хэрэгслийн байршил, маршрут',
    color: '#389e0d',
    items: [],
    comingSoon: true,
  },
  {
    id: 'ai-tender',
    label: 'AI Тендер',
    description: 'AI тусламжтай тендерийн баримт бэлтгэх',
    color: '#9254de',
    items: [],
    comingSoon: true,
  },
  {
    id: 'uniform-supply',
    label: 'Хувцас хэрэглэл хангамж',
    description: 'Ажилчдын хувцас, хэрэгслийн хангамж',
    color: '#d4380d',
    items: [
      { path: '/admin/uniform', label: 'Самбар', permission: 'uniform:read' },
      { path: '/admin/uniform/items', label: 'Барааны бүртгэл', permission: 'uniform:read' },
      { path: '/admin/uniform/stock', label: 'Үлдэгдэл', permission: 'uniform:read' },
      { path: '/admin/uniform/issues', label: 'Олголтын бүртгэл', permission: 'uniform:read' },
      { path: '/admin/uniform/returns', label: 'Буцаалт', permission: 'uniform:read' },
      { path: '/admin/uniform/requests', label: 'Хүсэлт', permission: 'uniform:read' },
      { path: '/admin/uniform/reports', label: 'Тайлан', permission: 'uniform:read' },
    ],
  },
  {
    id: 'daily-report',
    label: 'Daily Report',
    description: 'Өдөр тутмын тайлан, захирлын товч',
    color: '#0891b2',
    items: [
      { path: '/admin/daily-report', label: 'Өдрийн товч', permission: 'daily_report:summary' },
      { path: '/admin/daily-report/list', label: 'Тайлангууд', permission: 'daily_report:read' },
      { path: '/admin/daily-report/new', label: 'Шинэ тайлан', permission: 'daily_report:write' },
    ],
  },
  {
    id: 'hse',
    label: 'Хөдөлмөрийн аюулгүй байдал',
    description: 'ISO 45001 — ХАБЭА удирдлагын систем',
    color: '#dc2626',
    items: [
      { path: '/admin/hse', label: 'Самбар', permission: 'hse:read' },
      { path: '/admin/hse/daily-safety', label: 'Өглөөний заавар', permission: 'hse:read' },
      { path: '/admin/hse/toolbox', label: 'Toolbox', permission: 'hse:read' },
      { path: '/admin/hse/observations', label: 'Ажиглалт', permission: 'hse:read' },
      { path: '/admin/hse/near-miss', label: 'Near Miss', permission: 'hse:read' },
      { path: '/admin/hse/incidents', label: 'Осол', permission: 'hse:read' },
      { path: '/admin/hse/risk-assessment', label: 'Эрсдэл', permission: 'hse:read' },
      { path: '/admin/hse/permits', label: 'Зөвшөөрөл', permission: 'hse:read' },
      { path: '/admin/hse/inspections', label: 'Үзлэг', permission: 'hse:read' },
      { path: '/admin/hse/ppe', label: 'PPE', permission: 'hse:read' },
      { path: '/admin/hse/training', label: 'Сургалт', permission: 'hse:read' },
      { path: '/admin/hse/equipment-safety', label: 'Тоног төхөөрөмж', permission: 'hse:read' },
      { path: '/admin/hse/environment', label: 'Байгаль орчин', permission: 'hse:read' },
      { path: '/admin/hse/capa', label: 'CAPA', permission: 'hse:read' },
      { path: '/admin/hse/documents', label: 'Баримт', permission: 'hse:read' },
      { path: '/admin/hse/reports', label: 'Тайлан', permission: 'hse:read' },
      { path: '/admin/accident', label: 'Дуудлага', permission: 'accident:read' },
    ],
  },
  {
    id: 'plant',
    label: 'Үйлдвэр',
    description: 'Асфальт, цемент, бутлуур, эмульс — орлого, зарлага, үйлдвэрлэл',
    color: '#b45309',
    items: [
      { path: '/admin/plant', label: 'Самбар', permission: 'plant:read' },
      { path: '/admin/plant/sites', label: 'Үйлдвэрүүд', permission: 'plant:read' },
      { path: '/admin/plant/products', label: 'Бүтээгдэхүүн', permission: 'plant:read' },
      { path: '/admin/plant/materials', label: 'Түүхий эд', permission: 'plant:read' },
      { path: '/admin/plant/stocks', label: 'Үлдэгдэл', permission: 'plant:read' },
      { path: '/admin/plant/movements', label: 'Орлого / зарлага', permission: 'plant:read' },
      { path: '/admin/plant/batches', label: 'Үйлдвэрлэлийн багц', permission: 'plant:read' },
      { path: '/admin/plant/sales', label: 'Борлуулалт', permission: 'plant:read' },
      { path: '/admin/plant/expenses', label: 'Зардал', permission: 'plant:read' },
      { path: '/admin/plant/daily-reports', label: 'Өдрийн тайлан', permission: 'plant:read' },
    ],
  },
];

export const ADMIN_DATA_FOLDERS: ModuleConfig[] = [
  {
    id: 'data-factory',
    label: 'Үйлдвэр',
    description: 'Үйлдвэрийн байршил, бүтээгдэхүүн — газрын зураг',
    color: '#b45309',
    items: [
      { path: '/admin/data/factory', label: 'Газрын зураг', permission: 'plant:read' },
    ],
  },
  {
    id: 'data-technique',
    label: 'Техник',
    description: 'Техникийн мэдээлэл, тоног төхөөрөмжийн дата',
    color: '#096dd9',
    items: [],
    comingSoon: true,
  },
  {
    id: 'data-brigade',
    label: 'Бригад',
    description: 'Бригад, багийн бүтэц, гүйцэтгэл',
    color: '#531dab',
    items: [
      { path: '/admin/data/brigada', label: 'Бригадын жагсаалт', permission: 'brigada:read' },
    ],
  },
  {
    id: 'data-laboratory',
    label: 'Лаборатори',
    description: 'Лабораторийн шинжилгээ, дүн',
    color: '#08979c',
    items: [],
    comingSoon: true,
  },
  {
    id: 'data-job-seeker',
    label: 'Ажил горилогч',
    description: 'Ажил горилогчдын мэдээлэл',
    color: '#d48806',
    items: [],
    comingSoon: true,
  },
  {
    id: 'data-student',
    label: 'Оюутан',
    description: 'Оюутан, дадлагажигчдын бүртгэл',
    color: '#7c3aed',
    items: [
      { path: '/admin/data/student', label: 'Жагсаалт', permission: 'student:read' },
    ],
  },
  {
    id: 'data-road-sign',
    label: 'Замын тэмдэг',
    description: 'Замын тэмдэг, тэмдэглэгээний дата',
    color: '#ea580c',
    items: [],
    comingSoon: true,
  },
];

/** Admin role name can differ by DB/locale; treat these as full access. */
export function isAdminRole(userRole?: string | null): boolean {
  if (!userRole) return false;
  const normalized = userRole.trim().toLowerCase();
  return (
    normalized === 'админ' ||
    normalized === 'admin' ||
    normalized === 'administrator' ||
    normalized === 'супер админ' ||
    normalized === 'superadmin' ||
    normalized === 'super admin'
  );
}

export function hasPermission(permission: string | undefined, userPermissions: string[]): boolean {
  if (!permission) return true;
  // Empty list = still loading / unknown — do not hide menus prematurely
  if (userPermissions.length === 0) return true;
  return userPermissions.includes(permission);
}

export function filterNavItems(
  items: NavItemConfig[],
  userPermissions: string[],
  userRole?: string
): NavItemConfig[] {
  if (isAdminRole(userRole)) return items;
  return items.filter((item) => hasPermission(item.permission, userPermissions));
}

export function filterModules(userPermissions: string[], userRole?: string): ModuleConfig[] {
  if (isAdminRole(userRole)) {
    return ADMIN_MODULES;
  }
  return ADMIN_MODULES.map((mod) => ({
    ...mod,
    items: filterNavItems(mod.items, userPermissions, userRole),
  })).filter((mod) => mod.comingSoon || mod.items.length > 0);
}

export function filterDataFolders(): ModuleConfig[] {
  return ADMIN_DATA_FOLDERS;
}

export function getModuleForPath(pathname: string): ModuleConfig | null {
  if (pathname === DASHBOARD_PATH) return null;

  // Prefer longest path match so /daily-report/list maps to daily-report module
  let best: ModuleConfig | null = null;
  let bestLen = -1;

  for (const mod of [...ADMIN_MODULES, ...ADMIN_DATA_FOLDERS]) {
    for (const item of mod.items) {
      const match =
        pathname === item.path || pathname.startsWith(`${item.path}/`);
      if (match && item.path.length > bestLen) {
        best = mod;
        bestLen = item.path.length;
      }
    }
  }
  return best;
}

export function getDefaultModulePath(
  mod: ModuleConfig,
  userPermissions: string[],
  userRole?: string,
): string {
  const items = filterNavItems(mod.items, userPermissions, userRole);
  return items[0]?.path ?? mod.items[0]?.path ?? DASHBOARD_PATH;
}
