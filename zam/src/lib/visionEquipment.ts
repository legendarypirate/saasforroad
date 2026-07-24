import dayjs, { type Dayjs } from 'dayjs';

const VISION_API =
  process.env.NEXT_PUBLIC_VISION_API_URL || 'http://127.0.0.1:5055';

/** Fields returned by vision API `equipment` object (matches form names). */
export type EquipmentPrefill = {
  name?: string;
  model?: string;
  registration_number?: string;
  serial_number?: string;
  capacity?: string;
  year_manufactured?: string;
  import_date?: string | Dayjs;
  color?: string;
  site?: string;
  notes?: string;
  status?: string;
  category?: string;
  unit?: string;
  is_rentable?: boolean;
  [key: string]: unknown;
};

export async function extractEquipmentFromCertificate(
  file: File,
): Promise<EquipmentPrefill> {
  const body = new FormData();
  body.append('file', file);
  const res = await fetch(`${VISION_API}/extract`, {
    method: 'POST',
    body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      typeof err.detail === 'string' ? err.detail : `Vision API ${res.status}`,
    );
  }
  const json = await res.json();
  if (!json.success || !json.equipment) {
    throw new Error(json.message || 'Таних амжилтгүй');
  }
  const eq = { ...(json.equipment as EquipmentPrefill) };
  if (typeof eq.import_date === 'string' && eq.import_date) {
    const d = dayjs(eq.import_date);
    eq.import_date = d.isValid() ? d : undefined;
  }
  return eq;
}
