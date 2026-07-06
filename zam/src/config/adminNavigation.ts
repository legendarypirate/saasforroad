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
    description: 'Төсөл, даалгавар, тоног төхөөрөмж, түрээс',
    color: '#1890ff',
    items: [
      { path: '/admin/project', label: 'Төслүүд', permission: 'project:read' },
      { path: '/admin/task', label: 'Үүрэг даалгаврууд', permission: 'task:read' },
      { path: '/admin/equipment', label: 'Тоног төхөөрөмж' },
      { path: '/admin/equipment-rental', label: 'Тоног төхөөрөмж түрээс' },
      { path: '/admin/calendar', label: 'Календар' },
      { path: '/admin/accident', label: 'Ослын дуудлага', permission: 'accident:read' },
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
    id: 'documents',
    label: 'Баримт / Мэдэгдэл',
    description: 'Баримт бичиг, мэдэгдэл',
    color: '#13c2c2',
    items: [
      { path: '/admin/document', label: 'Баримт бичиг', permission: 'document:read' },
      { path: '/admin/notification', label: 'Мэдэгдэл', permission: 'notification:read' },
    ],
  },
  {
    id: 'finance',
    label: 'Санхүү',
    description: 'Нэхэмжлэх, төлбөр, санхүүгийн тайлан',
    color: '#2f54eb',
    items: [],
    comingSoon: true,
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
    items: [],
    comingSoon: true,
  },
];

export const ADMIN_DATA_FOLDERS: ModuleConfig[] = [
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
    items: [],
    comingSoon: true,
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
    id: 'data-production',
    label: 'Үйлдвэр',
    description: 'Үйлдвэрлэл, гүйцэтгэлийн дата',
    color: '#cf1322',
    items: [],
    comingSoon: true,
  },
];

export function hasPermission(permission: string | undefined, userPermissions: string[]): boolean {
  if (!permission) return true;
  if (userPermissions.length === 0) return true;
  return userPermissions.includes(permission);
}

export function filterNavItems(
  items: NavItemConfig[],
  userPermissions: string[],
  userRole?: string
): NavItemConfig[] {
  if (userRole === 'Админ') return items;
  return items.filter((item) => hasPermission(item.permission, userPermissions));
}

export function filterModules(userPermissions: string[], userRole?: string): ModuleConfig[] {
  if (userRole === 'Админ') {
    return ADMIN_MODULES;
  }
  return ADMIN_MODULES.map((mod) => ({
    ...mod,
    items: filterNavItems(mod.items, userPermissions),
  })).filter((mod) => mod.comingSoon || mod.items.length > 0);
}

export function filterDataFolders(): ModuleConfig[] {
  return ADMIN_DATA_FOLDERS;
}

export function getModuleForPath(pathname: string): ModuleConfig | null {
  if (pathname === DASHBOARD_PATH) return null;

  for (const mod of ADMIN_MODULES) {
    const matches = mod.items.some(
      (item) => pathname === item.path || pathname.startsWith(`${item.path}/`)
    );
    if (matches) return mod;
  }
  return null;
}

export function getDefaultModulePath(mod: ModuleConfig, userPermissions: string[]): string {
  const items = filterNavItems(mod.items, userPermissions);
  return items[0]?.path ?? mod.items[0].path;
}
