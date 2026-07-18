import { tenantHeaders } from '@/lib/tenant';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export type DataCatalogKind =
  | 'brigada'
  | 'job-seeker'
  | 'factory'
  | 'student'
  | 'laboratory'
  | 'technique'
  | 'road-sign';

export type DataCatalogEntry = {
  id: number;
  kind: string;
  name: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  province?: string | null;
  location?: string | null;
  description?: string | null;
  meta?: Record<string, unknown>;
  image?: string | null;
  status: string;
  is_active: boolean;
};

export const DATA_CATALOG_LABELS: Record<DataCatalogKind, string> = {
  brigada: 'Бригад',
  'job-seeker': 'Ажил горилогч',
  factory: 'Үйлдвэр',
  student: 'Оюутан',
  laboratory: 'Лаборатори',
  technique: 'Техник',
  'road-sign': 'Замын тэмдэг',
};

export async function fetchDataCatalog(kind: DataCatalogKind): Promise<DataCatalogEntry[]> {
  const res = await fetch(
    `${API}/api/data-catalog?kind=${encodeURIComponent(kind)}`,
    { headers: tenantHeaders(), cache: 'no-store' }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Ачаалахад алдаа (${res.status})`);
  }
  return (data.entries || []) as DataCatalogEntry[];
}
