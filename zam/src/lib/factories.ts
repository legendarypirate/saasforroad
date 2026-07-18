import { tenantHeaders } from '@/lib/tenant';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export type PublicFactory = {
  id: number;
  name: string;
  company_id?: number | null;
  company_name?: string | null;
  owner_name?: string | null;
  phone?: string | null;
  email?: string | null;
  plant_type?: string | null;
  province?: string | null;
  location?: string | null;
  description?: string | null;
  image?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const PLANT_TYPE_LABELS: Record<string, string> = {
  asphalt: 'Асфальт',
  cement: 'Цемент',
  crushing: 'Хайрга',
  emulsion: 'Эмульс',
  ctb: 'CTB',
  other: 'Бусад',
};

export async function fetchPublicFactories(): Promise<PublicFactory[]> {
  const res = await fetch(`${API}/api/factories`, {
    credentials: 'include',
    headers: tenantHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Ачаалахад алдаа (${res.status})`);
  }
  return (data.factories || data.data || []) as PublicFactory[];
}
