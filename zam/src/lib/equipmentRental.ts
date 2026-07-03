export const RENTAL_API = `${process.env.NEXT_PUBLIC_API_URL}/api/equipment_rental`;

export type RentalStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'partial';

export interface RentalPayment {
  id: number;
  rental_id: number;
  period_year: number;
  period_month: number;
  period_start: string;
  period_end: string;
  amount_due: number;
  amount_paid: number;
  paid_date?: string;
  status: PaymentStatus;
  invoice_number?: string;
  notes?: string;
}

export interface EquipmentRental {
  id: number;
  contract_number: string;
  equipment_id: number;
  client_company: string;
  client_register?: string;
  client_director?: string;
  client_phone?: string;
  client_email?: string;
  start_date: string;
  end_date: string;
  monthly_rate: number;
  deposit_amount?: number;
  motor_hours_start?: number;
  motor_hours_end?: number;
  delivery_location?: string;
  status: RentalStatus;
  notes?: string;
  equipment?: {
    id: number;
    name: string;
    model?: string;
    registration_number?: string;
    motor_hours?: number;
  };
  payments?: RentalPayment[];
}

export interface RentalStats {
  activeRentals: number;
  monthlyRevenue: number;
  overdueAmount: number;
  paidThisMonth: number;
}

export const RENTAL_STATUS_LABELS: Record<RentalStatus, string> = {
  draft: 'Ноорог',
  active: 'Идэвхтэй',
  completed: 'Дууссан',
  cancelled: 'Цуцлагдсан',
};

export const RENTAL_STATUS_COLORS: Record<RentalStatus, string> = {
  draft: 'default',
  active: 'processing',
  completed: 'success',
  cancelled: 'error',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Хүлээгдэж буй',
  paid: 'Төлсөн',
  overdue: 'Хугацаа хэтэрсэн',
  partial: 'Хэсэгчлэн',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: 'default',
  paid: 'success',
  overdue: 'error',
  partial: 'warning',
};

const MNT = new Intl.NumberFormat('mn-MN');

export function formatMnt(value?: number | string | null) {
  const num = Number(value) || 0;
  return `${MNT.format(num)} ₮`;
}

export function monthLabel(year: number, month: number) {
  return `${year} оны ${month}-р сар`;
}

export function paymentProgress(payments?: RentalPayment[]) {
  if (!payments?.length) return { paid: 0, due: 0, percent: 0 };
  const due = payments.reduce((s, p) => s + Number(p.amount_due), 0);
  const paid = payments.reduce((s, p) => s + Number(p.amount_paid), 0);
  const percent = due > 0 ? Math.round((paid / due) * 100) : 0;
  return { paid, due, percent };
}
