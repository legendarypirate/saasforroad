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

export type EquipmentStatus =
  | 'in_service'
  | 'available'
  | 'rented'
  | 'maintenance'
  | 'retired';

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  in_service: 'Ашиглалтад',
  available: 'Чөлөөтэй',
  rented: 'Түрээстэй',
  maintenance: 'Засвартай',
  retired: 'Хасагдсан',
};

export const EQUIPMENT_STATUS_COLORS: Record<EquipmentStatus, string> = {
  in_service: 'green',
  available: 'blue',
  rented: 'orange',
  maintenance: 'gold',
  retired: 'default',
};

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

export interface ServiceLogRecord {
  id: number;
  equipment_id: number;
  service_date: string;
  motor_hours?: number;
  service_type?: string;
  description?: string;
  parts_replaced?: string;
  cost?: number;
  service_provider?: string;
  engineer?: string;
  next_service_date?: string;
  notes?: string;
}

export interface EquipmentDocRecord {
  id: number;
  equipment_id: number;
  doc_type: string;
  name: string;
  number?: string;
  amount?: number;
  period?: string;
  status?: string;
  issued_at?: string;
  expires_at?: string;
  issuer?: string;
  paid?: boolean;
  notes?: string;
}

export interface MonthlyFinanceRecord {
  id: number;
  equipment_id: number;
  year: number;
  month: number;
  rental_income: number;
  operator_salary: number;
  oil_cost: number;
  service_cost: number;
  fuel_cost: number;
  other_cost: number;
  notes?: string;
}

export interface EquipmentItem {
  id: number;
  asset_no?: string;
  name: string;
  model?: string;
  registration_number?: string;
  serial_number?: string;
  capacity?: string;
  country_of_origin?: string;
  year_manufactured?: string;
  import_date?: string;
  site?: string;
  color?: string;
  responsible_person?: string;
  operator_name?: string;
  phone?: string;
  responsible_user_id?: number | null;
  operator_user_id?: number | null;
  category?: 'machine' | 'tool' | 'material';
  unit?: string;
  default_daily_rate?: number;
  is_rentable?: boolean;
  status?: EquipmentStatus | string;
  motor_hours?: number;
  insurance_company?: string;
  insurance_status?: string;
  insurance_expiry?: string;
  insurance_amount?: number;
  insurance_contract_no?: string;
  insurance_notes?: string;
  road_tax_amount?: number;
  atboyahat_amount?: number;
  air_pollution_fee?: number;
  transaction_fee?: number;
  tax_period?: string;
  tax_paid?: boolean;
  inspection_result?: string;
  inspection_date?: string;
  next_inspection_date?: string;
  inspection_extra_fee?: number;
  inspection_notes?: string;
  last_oil_change_date?: string;
  last_oil_motor_hours?: number;
  next_oil_motor_hours?: number;
  oil_type_name?: string;
  oil_quantity_liters?: number;
  oil_notes?: string;
  tech_certificate?: string;
  certificate_number?: string;
  certificate_expiry?: string;
  owner_name?: string;
  purchase_document?: string;
  certificate_notes?: string;
  photo_front?: string;
  photo_back?: string;
  photo_left?: string;
  photo_right?: string;
  certificate_image?: string;
  notes?: string;
  oilChanges?: OilChangeRecord[];
  serviceLogs?: ServiceLogRecord[];
  documents?: EquipmentDocRecord[];
  monthlyFinances?: MonthlyFinanceRecord[];
  projects?: { id: number; name: string }[];
  responsibleUser?: { id: number; username: string; position?: string; phone?: string };
  operatorUser?: { id: number; username: string; position?: string; phone?: string };
  project_id?: number;
  link_id?: number;
}

/** Expiry traffic-light: red expired, orange ≤90 days, green ok */
export function expiryTone(date?: string | null): 'red' | 'orange' | 'green' | 'default' {
  if (!date) return 'default';
  const end = new Date(`${date}T12:00:00`);
  const days = (end.getTime() - Date.now()) / 86400000;
  if (days < 0) return 'red';
  if (days <= 90) return 'orange';
  return 'green';
}

export function financeTotals(row: MonthlyFinanceRecord) {
  const expense =
    Number(row.operator_salary || 0) +
    Number(row.oil_cost || 0) +
    Number(row.service_cost || 0) +
    Number(row.fuel_cost || 0) +
    Number(row.other_cost || 0);
  const income = Number(row.rental_income || 0);
  const profit = income - expense;
  const pct = income > 0 ? Math.round((profit / income) * 1000) / 10 : 0;
  return { expense, income, profit, pct };
}
