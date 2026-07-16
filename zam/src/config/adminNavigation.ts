export interface NavItemConfig {
  path: string;
  label: string;
  /** Nav visibility key, e.g. finance.accounts:read */
  permission?: string;
  /** Short id within module, e.g. accounts */
  menuId?: string;
  /** Extra actions beyond default read/create/update/delete */
  actions?: string[];
}

export interface ModuleConfig {
  id: string;
  /** Permission namespace, e.g. finance | system | gps */
  index?: string;
  label: string;
  description: string;
  color: string;
  moduleKey?: string;
  items: NavItemConfig[];
  comingSoon?: boolean;
}

export const DASHBOARD_PATH = '/admin';

function mk(
  index: string,
  menuId: string,
  action: string = 'read',
): string {
  return `${index}.${menuId}:${action}`;
}

export const ADMIN_MODULES: ModuleConfig[] = [
  {
    id: 'road-engineering',
    index: 'road',
    moduleKey: 'road:module',
    label: 'Замын инженеринг',
    description: 'Тэнхлэг, профиль, шороо, хөндлөн огтлол',
    color: '#0f766e',
    items: [
      { path: '/admin/road-engineering', label: 'Самбар', menuId: 'dashboard', permission: mk('road', 'dashboard'), actions: ['read', 'create', 'update', 'delete', 'approve', 'export'] },
      { path: '/admin/road-engineering/projects', label: 'Төслүүд', menuId: 'projects', permission: mk('road', 'projects'), actions: ['read', 'create', 'update', 'delete', 'approve', 'export'] },
      { path: '/admin/road-engineering/survey', label: 'Хэмжилт', menuId: 'survey', permission: mk('road', 'survey'), actions: ['read', 'create', 'update', 'delete', 'approve', 'export'] },
      { path: '/admin/road-engineering/alignment/horizontal', label: 'Хэвтээ тэнхлэг', menuId: 'horizontal', permission: mk('road', 'horizontal'), actions: ['read', 'create', 'update', 'delete', 'approve', 'export'] },
      { path: '/admin/road-engineering/alignment/vertical', label: 'Босоо тэнхлэг', menuId: 'vertical', permission: mk('road', 'vertical'), actions: ['read', 'create', 'update', 'delete', 'approve', 'export'] },
      { path: '/admin/road-engineering/alignment/stationing', label: 'Станцлал', menuId: 'stationing', permission: mk('road', 'stationing'), actions: ['read', 'create', 'update', 'delete', 'approve', 'export'] },
      { path: '/admin/road-engineering/cross-sections', label: 'Хөндлөн огтлол', menuId: 'cross_sections', permission: mk('road', 'cross_sections'), actions: ['read', 'create', 'update', 'delete', 'approve', 'export'] },
      { path: '/admin/road-engineering/typical-sections', label: 'Ердийн огтлол', menuId: 'typical_sections', permission: mk('road', 'typical_sections'), actions: ['read', 'create', 'update', 'delete', 'approve', 'export'] },
      { path: '/admin/road-engineering/earthwork', label: 'Шорооны ажил', menuId: 'earthwork', permission: mk('road', 'earthwork'), actions: ['read', 'create', 'update', 'delete', 'approve', 'export'] },
      { path: '/admin/road-engineering/pavement', label: 'Хучилт', menuId: 'pavement', permission: mk('road', 'pavement'), actions: ['read', 'create', 'update', 'delete', 'approve', 'export'] },
      { path: '/admin/road-engineering/drainage', label: 'Ус зайлуулалт', menuId: 'drainage', permission: mk('road', 'drainage'), actions: ['read', 'create', 'update', 'delete', 'approve', 'export'] },
      { path: '/admin/road-engineering/structures', label: 'Байгууламж', menuId: 'structures', permission: mk('road', 'structures'), actions: ['read', 'create', 'update', 'delete', 'approve', 'export'] },
      { path: '/admin/road-engineering/quantity', label: 'Хэмжээ тооцоо', menuId: 'quantity', permission: mk('road', 'quantity'), actions: ['read', 'create', 'update', 'delete', 'approve', 'export'] },
      { path: '/admin/road-engineering/drawings', label: 'Зураг төсөл', menuId: 'drawings', permission: mk('road', 'drawings'), actions: ['read', 'create', 'update', 'delete', 'approve', 'export'] },
      { path: '/admin/road-engineering/reports', label: 'Тайлан', menuId: 'reports', permission: mk('road', 'reports'), actions: ['read', 'export'] },
      { path: '/admin/road-engineering/settings', label: 'Тохиргоо', menuId: 'settings', permission: mk('road', 'settings'), actions: ['read', 'update'] },
    ],
  },
  {
    id: 'operations',
    index: 'operations',
    moduleKey: 'operations:module',
    label: 'Төсөл / Ажил',
    description: 'Төсөл, даалгавар, календар',
    color: '#1890ff',
    items: [
      { path: '/admin/project', label: 'Төслүүд', menuId: 'project', permission: mk('operations', 'project') },
      { path: '/admin/task', label: 'Үүрэг даалгаврууд', menuId: 'task', permission: mk('operations', 'task') },
      { path: '/admin/calendar', label: 'Календар', menuId: 'calendar', permission: mk('operations', 'calendar') },
    ],
  },
  {
    id: 'system-access',
    index: 'system',
    moduleKey: 'system:module',
    label: 'Эрхийн зохицуулалт',
    description: 'Эрхийн зохицуулалт',
    color: '#1890ff',
    items: [
      {
        path: '/admin/system-access',
        label: 'Эрхийн зохицуулалт',
        menuId: 'role',
        permission: 'system.role:read',
        actions: ['read', 'create', 'update', 'delete'],
      },
    ],
  },
  {
    id: 'rental',
    index: 'rental',
    moduleKey: 'rental:module',
    label: 'Түрээс',
    description: 'Машин, тоног, барилгын хэрэгслийн түрээс',
    color: '#0d9488',
    items: [
      { path: '/admin/rental', label: 'Самбар', menuId: 'dashboard', permission: mk('rental', 'dashboard') },
      { path: '/admin/rental/contracts', label: 'Түрээсийн гэрээ', menuId: 'contracts', permission: mk('rental', 'contracts') },
      { path: '/admin/rental/payments', label: 'Төлбөр', menuId: 'payments', permission: mk('rental', 'payments') },
    ],
  },
  {
    id: 'equipment',
    index: 'equipment',
    moduleKey: 'equipment:module',
    label: 'Техник',
    description: 'Техникийн бүртгэл, ангилал, ТО, бичиг баримт',
    color: '#1d4ed8',
    items: [
      { path: '/admin/equipment', label: 'Бүртгэл', menuId: 'list', permission: mk('equipment', 'list') },
      { path: '/admin/equipment/categories', label: 'Ангилал', menuId: 'categories', permission: mk('equipment', 'categories') },
    ],
  },
  {
    id: 'inventory',
    index: 'inventory',
    moduleKey: 'inventory:module',
    label: 'Бараа материал',
    description: 'Агуулах, үлдэгдэл, нийлүүлэгч',
    color: '#fa8c16',
    items: [
      { path: '/admin/category', label: 'Ангилал', menuId: 'category', permission: mk('inventory', 'category'), actions: ['read', 'create', 'update', 'delete', 'approve', 'adjust'] },
      { path: '/admin/item', label: 'Бараа материал', menuId: 'item', permission: mk('inventory', 'item'), actions: ['read', 'create', 'update', 'delete', 'approve', 'adjust'] },
      { path: '/admin/warehouse', label: 'Агуулах', menuId: 'warehouse', permission: mk('inventory', 'warehouse'), actions: ['read', 'create', 'update', 'delete', 'approve', 'adjust'] },
      { path: '/admin/stock', label: 'Үлдэгдэл', menuId: 'stock', permission: mk('inventory', 'stock'), actions: ['read', 'create', 'update', 'delete', 'approve', 'adjust'] },
      { path: '/admin/transaction', label: 'Хөдөлгөөн', menuId: 'transaction', permission: mk('inventory', 'transaction'), actions: ['read', 'create', 'update', 'delete', 'approve', 'adjust'] },
      { path: '/admin/supplier', label: 'Нийлүүлэгч', menuId: 'supplier', permission: mk('inventory', 'supplier'), actions: ['read', 'create', 'update', 'delete', 'approve', 'adjust'] },
    ],
  },
  {
    id: 'hr',
    index: 'hr',
    moduleKey: 'hr:module',
    label: 'HR удирдлага',
    description: 'Хэрэглэгч, ирц, эрхийн зохицуулалт',
    color: '#722ed1',
    items: [
      { path: '/admin/user', label: 'Хэрэглэгчид', menuId: 'user', permission: mk('hr', 'user') },
      { path: '/admin/org-structure', label: 'Байгууллагын бүтэц', menuId: 'org_structure', permission: mk('hr', 'org_structure') },
      { path: '/admin/action', label: 'Арга хэмжээ', menuId: 'action', permission: mk('hr', 'action') },
      { path: '/admin/feedback', label: 'Санал хүсэлт', menuId: 'feedback', permission: mk('hr', 'feedback') },
      { path: '/admin/attendance', label: 'Ирцийн хяналт', menuId: 'attendance', permission: mk('hr', 'attendance') },
      { path: '/admin/device', label: 'Төхөөрөмж баталгаажуулалт', menuId: 'device', permission: mk('hr', 'device') },
      { path: '/admin/leave-request', label: 'Чөлөөний хүсэлт', menuId: 'leave_request', permission: mk('hr', 'leave_request') },
      { path: '/admin/office-location', label: 'Оффисын байршил', menuId: 'office_location', permission: mk('hr', 'office_location') },
      { path: '/admin/attendance-calculation', label: 'Ирц тооцоолол', menuId: 'attendance_calculation', permission: mk('hr', 'attendance_calculation') },
      { path: '/admin/salary-calculation', label: 'Цалин тооцоолол', menuId: 'salary_calculation', permission: mk('hr', 'salary_calculation') },
    ],
  },
  {
    id: 'homepage',
    index: 'homepage',
    moduleKey: 'homepage:module',
    label: 'Нүүр хуудас',
    description: 'Лого, холбоо барих, контент',
    color: '#52c41a',
    items: [
      { path: '/admin/homepage', label: 'Контент удирдлага', menuId: 'content', permission: mk('homepage', 'content'), actions: ['read', 'update', 'write'] },
    ],
  },
  {
    id: 'tender',
    index: 'tender',
    moduleKey: 'tender:module',
    label: 'Тендер материал',
    description: 'Баримт upload → AI → DOCX',
    color: '#eb2f96',
    items: [
      { path: '/admin/tender', label: 'Тендер багц', menuId: 'list', permission: mk('tender', 'list') },
    ],
  },
  {
    id: 'document',
    index: 'document',
    moduleKey: 'document:module',
    label: 'Баримт бичиг',
    description: 'DMS — гэрээ, зураг, зөвшөөрөл, чанар',
    color: '#13c2c2',
    items: [
      { path: '/admin/document', label: 'Баримт бичиг', menuId: 'list', permission: mk('document', 'list') },
    ],
  },
  {
    id: 'notification',
    index: 'notification',
    moduleKey: 'notification:module',
    label: 'Мэдэгдэл',
    description: 'Зарлал, мэдэгдэл нийтлэх',
    color: '#fa8c16',
    items: [
      { path: '/admin/notification', label: 'Мэдэгдэл', menuId: 'list', permission: mk('notification', 'list') },
    ],
  },
  {
    id: 'finance',
    index: 'finance',
    moduleKey: 'finance:module',
    label: 'Санхүү',
    description: 'Нэхэмжлэх, төлбөр, санхүүгийн тайлан',
    color: '#2f54eb',
    items: [
      { path: '/admin/finance', label: 'Самбар', menuId: 'dashboard', permission: mk('finance', 'dashboard'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/finance/accounts', label: 'Касс / Банк', menuId: 'accounts', permission: mk('finance', 'accounts'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/finance/invoices', label: 'Нэхэмжлэх (авлага)', menuId: 'invoices', permission: mk('finance', 'invoices'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/finance/bills', label: 'Нийлүүлэгчийн нэхэмжлэх', menuId: 'bills', permission: mk('finance', 'bills'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/finance/payments', label: 'Төлбөр', menuId: 'payments', permission: mk('finance', 'payments'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/finance/contracts', label: 'Гэрээ', menuId: 'contracts', permission: mk('finance', 'contracts'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/finance/budgets', label: 'Төсөв', menuId: 'budgets', permission: mk('finance', 'budgets'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/finance/expenses', label: 'Зардлын бүртгэл', menuId: 'expenses', permission: mk('finance', 'expenses'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/finance/vat', label: 'НӨАТ бүртгэл', menuId: 'vat', permission: mk('finance', 'vat'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/finance/reports', label: 'Тайлан', menuId: 'reports', permission: mk('finance', 'reports'), actions: ['read', 'export'] },
    ],
  },
  {
    id: 'gps',
    index: 'gps',
    moduleKey: 'gps:module',
    label: 'GPS',
    description: 'Тээврийн хэрэгслийн байршил, маршрут',
    color: '#389e0d',
    items: [
      { path: '/admin/gps/live', label: 'GPS live', menuId: 'live', permission: mk('gps', 'live') },
      { path: '/admin/gps/history', label: 'GPS history', menuId: 'history', permission: mk('gps', 'history') },
      { path: '/admin/gps/devices', label: 'GPS devices', menuId: 'devices', permission: mk('gps', 'devices') },
    ],
  },
  {
    id: 'ai-tender',
    index: 'ai_tender',
    moduleKey: 'ai_tender:module',
    label: 'AI Тендер',
    description: 'AI тусламжтай тендерийн баримт бэлтгэх',
    color: '#9254de',
    items: [],
    comingSoon: true,
  },
  {
    id: 'uniform-supply',
    index: 'uniform',
    moduleKey: 'uniform:module',
    label: 'Хувцас хэрэглэл хангамж',
    description: 'Ажилчдын хувцас, хэрэгслийн хангамж',
    color: '#d4380d',
    items: [
      { path: '/admin/uniform', label: 'Самбар', menuId: 'dashboard', permission: mk('uniform', 'dashboard'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/uniform/items', label: 'Барааны бүртгэл', menuId: 'items', permission: mk('uniform', 'items'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/uniform/stock', label: 'Үлдэгдэл', menuId: 'stock', permission: mk('uniform', 'stock'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/uniform/issues', label: 'Олголтын бүртгэл', menuId: 'issues', permission: mk('uniform', 'issues'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/uniform/returns', label: 'Буцаалт', menuId: 'returns', permission: mk('uniform', 'returns'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/uniform/requests', label: 'Хүсэлт', menuId: 'requests', permission: mk('uniform', 'requests'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/uniform/reports', label: 'Тайлан', menuId: 'reports', permission: mk('uniform', 'reports'), actions: ['read', 'export'] },
    ],
  },
  {
    id: 'fleet',
    index: 'fuel',
    moduleKey: 'fuel:module',
    label: 'Автопарк',
    description: 'Шатахуун удирдлага — худалдан авалт, сав, олголт, зарцуулалт',
    color: '#a16207',
    items: [
      { path: '/admin/fuel', label: 'Самбар', menuId: 'dashboard', permission: mk('fuel', 'dashboard'), actions: ['read', 'create', 'update', 'delete', 'export'] },
      { path: '/admin/fuel/purchases', label: 'Худалдан авалт', menuId: 'purchases', permission: mk('fuel', 'purchases'), actions: ['read', 'create', 'update', 'delete', 'export'] },
      { path: '/admin/fuel/tanks', label: 'Сав / танк', menuId: 'tanks', permission: mk('fuel', 'tanks'), actions: ['read', 'create', 'update', 'delete', 'export'] },
      { path: '/admin/fuel/issues', label: 'Олголт', menuId: 'issues', permission: mk('fuel', 'issues'), actions: ['read', 'create', 'update', 'delete', 'export'] },
      { path: '/admin/fuel/consumption', label: 'Зарцуулалт', menuId: 'consumption', permission: mk('fuel', 'consumption'), actions: ['read', 'create', 'update', 'delete', 'export'] },
      { path: '/admin/fuel/suppliers', label: 'Нийлүүлэгч', menuId: 'suppliers', permission: mk('fuel', 'suppliers'), actions: ['read', 'create', 'update', 'delete', 'export'] },
      { path: '/admin/fuel/reports', label: 'Тайлан', menuId: 'reports', permission: mk('fuel', 'reports'), actions: ['read', 'export'] },
    ],
  },
  {
    id: 'daily-report',
    index: 'daily_report',
    moduleKey: 'daily_report:module',
    label: 'Daily Report',
    description: 'Өдөр тутмын тайлан, захирлын товч',
    color: '#0891b2',
    items: [
      { path: '/admin/daily-report', label: 'Өдрийн товч', menuId: 'summary', permission: mk('daily_report', 'summary', 'summary'), actions: ['summary', 'read'] },
      { path: '/admin/daily-report/list', label: 'Тайлангууд', menuId: 'list', permission: mk('daily_report', 'list') },
      { path: '/admin/daily-report/new', label: 'Шинэ тайлан', menuId: 'new', permission: mk('daily_report', 'new'), actions: ['read', 'create', 'write'] },
    ],
  },
  {
    id: 'hse',
    index: 'hse',
    moduleKey: 'hse:module',
    label: 'Хөдөлмөрийн аюулгүй байдал',
    description: 'ISO 45001 — ХАБЭА удирдлагын систем',
    color: '#dc2626',
    items: [
      { path: '/admin/hse', label: 'Самбар', menuId: 'dashboard', permission: mk('hse', 'dashboard'), actions: ['read', 'create', 'update', 'delete', 'approve', 'audit', 'mobile'] },
      { path: '/admin/hse/daily-safety', label: 'Өглөөний заавар', menuId: 'daily_safety', permission: mk('hse', 'daily_safety'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/hse/toolbox', label: 'Toolbox', menuId: 'toolbox', permission: mk('hse', 'toolbox'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/hse/observations', label: 'Ажиглалт', menuId: 'observations', permission: mk('hse', 'observations'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/hse/near-miss', label: 'Near Miss', menuId: 'near_miss', permission: mk('hse', 'near_miss'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/hse/incidents', label: 'Осол', menuId: 'incidents', permission: mk('hse', 'incidents'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/hse/risk-assessment', label: 'Эрсдэл', menuId: 'risk_assessment', permission: mk('hse', 'risk_assessment'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/hse/permits', label: 'Зөвшөөрөл', menuId: 'permits', permission: mk('hse', 'permits'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/hse/inspections', label: 'Үзлэг', menuId: 'inspections', permission: mk('hse', 'inspections'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/hse/ppe', label: 'PPE', menuId: 'ppe', permission: mk('hse', 'ppe'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/hse/training', label: 'Сургалт', menuId: 'training', permission: mk('hse', 'training'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/hse/equipment-safety', label: 'Тоног төхөөрөмж', menuId: 'equipment_safety', permission: mk('hse', 'equipment_safety'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/hse/environment', label: 'Байгаль орчин', menuId: 'environment', permission: mk('hse', 'environment'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/hse/capa', label: 'CAPA', menuId: 'capa', permission: mk('hse', 'capa'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/hse/documents', label: 'Баримт', menuId: 'documents', permission: mk('hse', 'documents'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/hse/reports', label: 'Тайлан', menuId: 'reports', permission: mk('hse', 'reports'), actions: ['read', 'export'] },
      { path: '/admin/accident', label: 'Дуудлага', menuId: 'accident', permission: mk('hse', 'accident'), actions: ['read', 'create', 'update', 'delete'] },
    ],
  },
  {
    id: 'plant',
    index: 'plant',
    moduleKey: 'plant:module',
    label: 'Үйлдвэр',
    description: 'Асфальт, цемент, бутлуур, эмульс — орлого, зарлага, үйлдвэрлэл',
    color: '#b45309',
    items: [
      { path: '/admin/plant', label: 'Самбар', menuId: 'dashboard', permission: mk('plant', 'dashboard'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/plant/sites', label: 'Үйлдвэрүүд', menuId: 'sites', permission: mk('plant', 'sites'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/plant/products', label: 'Бүтээгдэхүүн', menuId: 'products', permission: mk('plant', 'products'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/plant/materials', label: 'Түүхий эд', menuId: 'materials', permission: mk('plant', 'materials'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/plant/stocks', label: 'Үлдэгдэл', menuId: 'stocks', permission: mk('plant', 'stocks'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/plant/movements', label: 'Орлого / зарлага', menuId: 'movements', permission: mk('plant', 'movements'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/plant/batches', label: 'Үйлдвэрлэлийн багц', menuId: 'batches', permission: mk('plant', 'batches'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/plant/sales', label: 'Борлуулалт', menuId: 'sales', permission: mk('plant', 'sales'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/plant/expenses', label: 'Зардал', menuId: 'expenses', permission: mk('plant', 'expenses'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
      { path: '/admin/plant/daily-reports', label: 'Өдрийн тайлан', menuId: 'daily_reports', permission: mk('plant', 'daily_reports'), actions: ['read', 'create', 'update', 'delete', 'approve'] },
    ],
  },
  {
    id: 'budget',
    index: 'budget',
    moduleKey: 'budget:module',
    label: 'Төсөв',
    description: 'Замын төсөв, нэгж үнэ, автомат тооцоо, харьцуулалт',
    color: '#ea580c',
    items: [
      { path: '/admin/budget', label: 'Самбар', menuId: 'dashboard', permission: mk('budget', 'dashboard', 'view'), actions: ['view', 'read', 'create', 'update', 'delete', 'approve', 'export'] },
      { path: '/admin/budget/estimator', label: 'Тооцоолуур', menuId: 'estimator', permission: mk('budget', 'estimator', 'create'), actions: ['view', 'read', 'create', 'update', 'delete', 'approve', 'export'] },
      { path: '/admin/budget/rates', label: 'Нэгж үнэ', menuId: 'rates', permission: mk('budget', 'rates', 'view'), actions: ['view', 'read', 'create', 'update', 'delete', 'approve', 'export'] },
      { path: '/admin/budget/compare', label: 'Харьцуулалт', menuId: 'compare', permission: mk('budget', 'compare', 'view'), actions: ['view', 'read', 'export'] },
      { path: '/admin/budget/reports', label: 'Тайлан', menuId: 'reports', permission: mk('budget', 'reports', 'export'), actions: ['view', 'read', 'export'] },
    ],
  },
];

export const ADMIN_DATA_FOLDERS: ModuleConfig[] = [
  {
    id: 'data-factory',
    index: 'plant',
    moduleKey: 'plant:module',
    label: 'Үйлдвэр',
    description: 'Үйлдвэрийн мэдээлэл — зөвхөн харах / холбогдох',
    color: '#b45309',
    items: [
      { path: '/admin/data/factory', label: 'Жагсаалт', menuId: 'factory_map', permission: mk('plant', 'factory_map') },
    ],
  },
  {
    id: 'data-technique',
    index: 'technique',
    moduleKey: 'technique:module',
    label: 'Техник',
    description: 'Түрээслэх боломжтой техник — жагсаалт / холбогдох',
    color: '#096dd9',
    items: [
      { path: '/admin/data/technique', label: 'Түрээсийн техник', menuId: 'list', permission: mk('technique', 'list') },
    ],
  },
  {
    id: 'data-brigade',
    index: 'brigada',
    moduleKey: 'brigada:module',
    label: 'Бригад',
    description: 'Платформын бригад — ажилд авах, үнэлгээ (бүртгэл app / admin.rcos.mn)',
    color: '#531dab',
    items: [
      { path: '/admin/data/brigada', label: 'Жагсаалт', menuId: 'list', permission: mk('brigada', 'list') },
      {
        path: '/admin/data/brigada/hires',
        label: 'Hire хүсэлт',
        menuId: 'hires',
        permission: mk('brigada', 'list'),
      },
    ],
  },
  {
    id: 'data-laboratory',
    index: 'laboratory',
    moduleKey: 'laboratory:module',
    label: 'Лаборатори',
    description: 'Лаборатори — зөвхөн харах / холбогдох',
    color: '#08979c',
    items: [
      { path: '/admin/data/laboratory', label: 'Жагсаалт', menuId: 'list', permission: mk('laboratory', 'list') },
    ],
  },
  {
    id: 'data-job-seeker',
    index: 'job_seeker',
    moduleKey: 'job_seeker:module',
    label: 'Ажил горилогч',
    description: 'Ажил горилогч — зөвхөн харах / холбогдох',
    color: '#d48806',
    items: [
      { path: '/admin/data/job-seeker', label: 'Жагсаалт', menuId: 'list', permission: mk('job_seeker', 'list') },
    ],
  },
  {
    id: 'data-student',
    index: 'student',
    moduleKey: 'student:module',
    label: 'Оюутан',
    description: 'Оюутан — зөвхөн харах / холбогдох',
    color: '#7c3aed',
    items: [
      { path: '/admin/data/student', label: 'Жагсаалт', menuId: 'list', permission: mk('student', 'list') },
    ],
  },
  {
    id: 'data-road-sign',
    index: 'road_sign',
    moduleKey: 'road_sign:module',
    label: 'Замын тэмдэг',
    description: 'Замын тэмдэг — зөвхөн харах / холбогдох',
    color: '#ea580c',
    items: [
      { path: '/admin/data/road-sign', label: 'Жагсаалт', menuId: 'list', permission: mk('road_sign', 'list') },
    ],
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
  // No permission gate on the nav item → visible
  if (!permission) return true;
  if (!userPermissions.length) return false;

  const granted = new Set(userPermissions.filter(Boolean));
  if (granted.has(permission)) return true;

  // Legacy flat keys: finance:read → finance.accounts:read / finance.dashboard:view
  const [scope, action] = permission.split(':');
  if (!scope || !action) return false;

  if (scope.includes('.')) {
    const moduleIndex = scope.split('.')[0];
    if (granted.has(`${moduleIndex}:${action}`)) return true;
    // read ↔ view aliases used by older seeds (road:view, budget:view)
    if (action === 'read' && granted.has(`${moduleIndex}:view`)) return true;
    if (action === 'view' && granted.has(`${moduleIndex}:read`)) return true;
    if (action === 'read' && granted.has(`${moduleIndex}:dashboard`)) return true;
  }

  return false;
}

export function filterNavItems(
  items: NavItemConfig[],
  userPermissions: string[],
  userRole?: string
): NavItemConfig[] {
  if (isAdminRole(userRole)) return items;
  return items.filter((item) => hasPermission(item.permission, userPermissions));
}

function hasAnyModuleGrant(mod: ModuleConfig, userPermissions: string[]): boolean {
  if (mod.moduleKey && userPermissions.includes(mod.moduleKey)) return true;
  if (!mod.index) return false;
  // Any enterprise key under this module, or legacy module:* row
  return userPermissions.some((key) => {
    if (!key) return false;
    if (key === `${mod.index}:module`) return true;
    if (key.startsWith(`${mod.index}.`)) return true;
    if (key.startsWith(`${mod.index}:`)) return true;
    return false;
  });
}

function filterModuleList(
  modules: ModuleConfig[],
  userPermissions: string[],
  userRole?: string,
  enabledModuleIds?: string[] | null,
): ModuleConfig[] {
  const byTenant = enabledModuleIds?.length
    ? modules.filter((mod) => enabledModuleIds.includes(mod.id))
    : modules;

  if (isAdminRole(userRole)) return byTenant;

  return byTenant
    .map((mod) => ({
      ...mod,
      items: filterNavItems(mod.items, userPermissions, userRole),
    }))
    .filter((mod) => {
      if (mod.items.length > 0) return true;
      // Module added in RBAC (module:module) or legacy module:* with no menu match yet
      return hasAnyModuleGrant(mod, userPermissions);
    });
}

export function filterModules(
  userPermissions: string[],
  userRole?: string,
  enabledModuleIds?: string[] | null,
): ModuleConfig[] {
  return filterModuleList(ADMIN_MODULES, userPermissions, userRole, enabledModuleIds);
}

export function filterDataFolders(
  userPermissions: string[] = [],
  userRole?: string,
  enabledModuleIds?: string[] | null,
): ModuleConfig[] {
  return filterModuleList(ADMIN_DATA_FOLDERS, userPermissions, userRole, enabledModuleIds);
}

export function getModuleForPath(pathname: string): ModuleConfig | null {
  if (pathname === DASHBOARD_PATH) return null;

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
  if (items[0]?.path) return items[0].path;
  // Module granted but no menu yet — stay on first declared path only for admins;
  // otherwise land on dashboard so PageWrapper can deny unauthorized menus.
  if (isAdminRole(userRole) && mod.items[0]?.path) return mod.items[0].path;
  return mod.items[0]?.path && hasPermission(mod.items[0].permission, userPermissions)
    ? mod.items[0].path
    : DASHBOARD_PATH;
}
