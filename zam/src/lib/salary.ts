export const SALARY_API = `${process.env.NEXT_PUBLIC_API_URL}/api/salary`;

export interface SalaryRow {
  user_id: number;
  username: string;
  email: string | null;
  salary: number;
  scheduleLabel: string;
  scheduledWorkDays: number;
  presentDays: number;
  absentDays: number;
  totalWorkedHours: number;
  totalBillableHours: number;
  totalOvertimeHours: number;
  workPay: number;
  overtimePay: number;
  absentDeduction: number;
  deduction: number;
  additional_deduction: number;
  note: string;
  grossPay: number;
  netPay: number;
  hasEmail: boolean;
}

export interface SalaryTotals {
  totalWorkedHours: number;
  totalBillableHours: number;
  totalNetPay: number;
  totalDeduction: number;
  totalAdditionalDeduction: number;
  employeeCount: number;
  withEmailCount: number;
}

export interface SalaryCalculationResponse {
  month: string;
  from: string;
  to: string;
  totals: SalaryTotals;
  rows: SalaryRow[];
  resendConfigured: boolean;
}

export async function fetchSalaryCalculation(month: string): Promise<SalaryCalculationResponse> {
  const res = await fetch(`${SALARY_API}/calculation?month=${month}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Ачаалахад алдаа');
  return json.data;
}

export async function saveSalaryAdjustment(
  month: string,
  payload: {
    user_id: number;
    deduction?: number;
    additional_deduction?: number;
    note?: string;
  }
): Promise<SalaryRow> {
  const res = await fetch(`${SALARY_API}/adjustment`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month, ...payload }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Хадгалахад алдаа');
  return json.data;
}

export async function saveSalaryAdjustmentsBulk(
  month: string,
  rows: Array<{
    user_id: number;
    deduction?: number;
    additional_deduction?: number;
    note?: string;
  }>
): Promise<SalaryCalculationResponse> {
  const res = await fetch(`${SALARY_API}/adjustments/bulk`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month, rows }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Хадгалахад алдаа');
  return json.data;
}

export async function sendBulkSalaryEmails(month: string, userIds?: number[]) {
  const res = await fetch(`${SALARY_API}/send-bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month, user_ids: userIds }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Илгээхэд алдаа');
  return json.data as {
    month: string;
    sent: number;
    failed: number;
    sentList: { user_id: number; email: string }[];
    failedList: { user_id: number; email: string; error: string }[];
  };
}

export function formatMnt(value: number) {
  return `${Math.round(Number(value) || 0).toLocaleString('mn-MN')} ₮`;
}

/** Recalculate net pay locally while typing (Excel-like instant feedback). */
export function recalcRow(row: SalaryRow): SalaryRow {
  const deduction = Number(row.deduction) || 0;
  const additional = Number(row.additional_deduction) || 0;
  const grossPay = (Number(row.workPay) || 0) + (Number(row.overtimePay) || 0);
  const netPay = Math.max(
    0,
    grossPay - (Number(row.absentDeduction) || 0) - deduction - additional
  );
  return {
    ...row,
    deduction,
    additional_deduction: additional,
    grossPay,
    netPay: Math.round(netPay * 100) / 100,
  };
}

export function sumTotals(rows: SalaryRow[]): SalaryTotals {
  return {
    totalWorkedHours: Math.round(rows.reduce((s, r) => s + (r.totalWorkedHours || 0), 0) * 100) / 100,
    totalBillableHours: Math.round(rows.reduce((s, r) => s + (r.totalBillableHours || 0), 0) * 100) / 100,
    totalNetPay: Math.round(rows.reduce((s, r) => s + (r.netPay || 0), 0) * 100) / 100,
    totalDeduction: Math.round(rows.reduce((s, r) => s + (r.deduction || 0), 0) * 100) / 100,
    totalAdditionalDeduction:
      Math.round(rows.reduce((s, r) => s + (r.additional_deduction || 0), 0) * 100) / 100,
    employeeCount: rows.length,
    withEmailCount: rows.filter((r) => r.hasEmail).length,
  };
}
