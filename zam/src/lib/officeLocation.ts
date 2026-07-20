import { tenantHeaders } from '@/lib/tenant';

export const OFFICE_API = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/office_location`;

export interface OfficeLocation {
  id: number;
  name: string;
  latitude: number | string;
  longitude: number | string;
  radius_meters: number;
  address?: string;
  is_active: boolean;
  tenant_id?: number | null;
}

export type OfficeLocationFormValues = {
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
};

export type OfficeLocationPayload = {
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
};

function authHeaders(json = false): HeadersInit {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const extra: Record<string, string> = {};
  if (json) extra['Content-Type'] = 'application/json';
  if (token) extra['Authorization'] = token;
  return tenantHeaders(extra);
}

async function officeFetch<T>(
  path = '',
  init?: RequestInit,
): Promise<{ success: boolean; data?: T; message?: string }> {
  const res = await fetch(`${OFFICE_API}${path}`, {
    ...init,
    headers: {
      ...authHeaders(Boolean(init?.body)),
      ...init?.headers,
    },
    cache: 'no-store',
  });
  return res.json().catch(() => ({
    success: false,
    message: `Алдаа (${res.status})`,
  }));
}

export const officeLocationApi = {
  list() {
    return officeFetch<OfficeLocation[]>('');
  },
  create(body: OfficeLocationPayload) {
    return officeFetch<OfficeLocation>('', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  update(id: number, body: Partial<OfficeLocationPayload>) {
    return officeFetch<OfficeLocation>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  remove(id: number) {
    return officeFetch(`/${id}`, { method: 'DELETE' });
  },
};
