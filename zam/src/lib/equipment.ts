export const EQUIPMENT_API = `${process.env.NEXT_PUBLIC_API_URL}/api/equipment`;

export const SIDE_LABELS: Record<string, string> = {
  photo_front: 'Урд',
  photo_back: 'Хойд',
  photo_left: 'Зүүн',
  photo_right: 'Баруун',
};

import { resolveAssetUrl } from './assetUrl';

export function assetUrl(relativePath?: string | null) {
  return resolveAssetUrl(relativePath);
}

export interface OilChangeRecord {
  id: number;
  equipment_id: number;
  changed_at: string;
  oil_type?: string;
  motor_hours_at_change?: number;
  quantity_liters?: number;
  notes?: string;
  changed_by?: string;
}

export interface EquipmentItem {
  id: number;
  name: string;
  model?: string;
  registration_number?: string;
  category?: 'machine' | 'tool' | 'material';
  unit?: string;
  default_daily_rate?: number;
  is_rentable?: boolean;
  status?: string;
  motor_hours?: number;
  photo_front?: string;
  photo_back?: string;
  photo_left?: string;
  photo_right?: string;
  certificate_image?: string;
  notes?: string;
  oilChanges?: OilChangeRecord[];
  projects?: { id: number; name: string }[];
  project_id?: number;
  link_id?: number;
}
