import { tenantHeaders } from '@/lib/tenant';

export const SALARY_API = `${process.env.NEXT_PUBLIC_API_URL}/api/salary`;

export const NDSH_RATE = 0.115;
export const HHOAT_RATE = 0.1;

export interface SalaryRow {
  user_id: number;
  username: string;
  email: string | null;
  salary: number;
  scheduleLabel: string;
  scheduledWorkDays: number;
  presentDays: number;
  absentDays: number;
  absentHours: number;
  totalWorkedHours: number;
  totalBillableHours: number;
  totalOvertimeHours: number;
  workPay: number;
  overtimePay: number;
  grossPay: number;
  absentDeduction: number;
  ndsh: number;
  hhoat: number;
  deduction: number;
  additional_deduction: number;
  note: string;
  netPay: number;
  hourlyRate: number;
  hasEmail: boolean;
}

export interface SalaryTotals {
  totalWorkedHours: number;
  totalBillableHours: number;
  totalOvertimeHours: number;
  totalGrossPay: number;
  totalNdsh: number;
  totalHhoat: number;
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
  expectedHours: number;
  totals: SalaryTotals;
  rows: SalaryRow[];
  resendConfigured: boolean;
}

export type SalaryAdjustmentPayload = {
  user_id: number;
  worked_hours?: number;
  billable_hours?: number;
  overtime_hours?: number;
  absent_hours?: number;
  ndsh?: number;
  hhoat?: number;
  deduction?: number;
  additional_deduction?: number;
  note?: string;
};

function salaryHeaders(json = false): HeadersInit {
  return tenantHeaders(json ? { 'Content-Type': 'application/json' } : undefined);
}

export async function fetchSalaryCalculation(month: string): Promise<SalaryCalculationResponse> {
  const res = await fetch(`${SALARY_API}/calculation?month=${month}`, {
    headers: salaryHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Ачаалахад алдаа');
  return json.data;
}

export async function saveMonthExpectedHours(
  month: string,
  expectedHours: number
): Promise<SalaryCalculationResponse> {
  const res = await fetch(`${SALARY_API}/month-setting`, {
    method: 'PUT',
    headers: salaryHeaders(true),
    body: JSON.stringify({ month, expected_hours: expectedHours }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Хадгалахад алдаа');
  return json.data;
}

export async function saveSalaryAdjustment(
  month: string,
  payload: SalaryAdjustmentPayload
): Promise<SalaryRow> {
  const res = await fetch(`${SALARY_API}/adjustment`, {
    method: 'PUT',
    headers: salaryHeaders(true),
    body: JSON.stringify({ month, ...payload }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Хадгалахад алдаа');
  return json.data;
}

export async function saveSalaryAdjustmentsBulk(
  month: string,
  rows: SalaryAdjustmentPayload[]
): Promise<SalaryCalculationResponse> {
  const res = await fetch(`${SALARY_API}/adjustments/bulk`, {
    method: 'PUT',
    headers: salaryHeaders(true),
    body: JSON.stringify({ month, rows }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Хадгалахад алдаа');
  return json.data;
}

export async function sendBulkSalaryEmails(month: string, userIds?: number[]) {
  const res = await fetch(`${SALARY_API}/send-bulk`, {
    method: 'POST',
    headers: salaryHeaders(true),
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
  return Math.round(Number(value) || 0).toLocaleString('mn-MN');
}

function r2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Recalculate full payslip locally (Excel-like). */
export function recalcRow(row: SalaryRow, expectedHours: number): SalaryRow {
  const baseSalary = Number(row.salary) || 0;
  const worked = Number(row.totalWorkedHours) || 0;
  const billable = Number(row.totalBillableHours) || 0;
  const overtime = Number(row.totalOvertimeHours) || 0;
  const absentHours = Number(row.absentHours) || 0;
  const expected = expectedHours > 0 ? expectedHours : 1;

  const hourlyRate = baseSalary / expected;
  const workPay = hourlyRate * billable;
  const overtimePay = hourlyRate * 1.5 * overtime;
  const grossPay = workPay + overtimePay;
  const absentDeduction = hourlyRate * absentHours;

  const ndsh = row.ndsh !== undefined && row.ndsh !== null
    ? Number(row.ndsh) || 0
    : grossPay * NDSH_RATE;
  const hhoat = row.hhoat !== undefined && row.hhoat !== null
    ? Number(row.hhoat) || 0
    : Math.max(0, grossPay - ndsh) * HHOAT_RATE;
  const deduction = Number(row.deduction) || 0;
  const additional = Number(row.additional_deduction) || 0;

  const netPay = Math.max(
    0,
    grossPay - absentDeduction - ndsh - hhoat - deduction - additional
  );

  return {
    ...row,
    totalWorkedHours: r2(worked),
    totalBillableHours: r2(billable),
    totalOvertimeHours: r2(overtime),
    absentHours: r2(absentHours),
    hourlyRate: r2(hourlyRate),
    workPay: r2(workPay),
    overtimePay: r2(overtimePay),
    grossPay: r2(grossPay),
    absentDeduction: r2(absentDeduction),
    ndsh: r2(ndsh),
    hhoat: r2(hhoat),
    deduction,
    additional_deduction: additional,
    netPay: r2(netPay),
  };
}

/** When hours change, also refresh auto НДШ/ХХОАТ. */
export function recalcRowWithAutoTax(row: SalaryRow, expectedHours: number): SalaryRow {
  const expected = expectedHours > 0 ? expectedHours : 1;
  const hourlyRate = (Number(row.salary) || 0) / expected;
  const workPay = hourlyRate * (Number(row.totalBillableHours) || 0);
  const overtimePay = hourlyRate * 1.5 * (Number(row.totalOvertimeHours) || 0);
  const grossPay = workPay + overtimePay;
  const ndsh = grossPay * NDSH_RATE;
  const hhoat = Math.max(0, grossPay - ndsh) * HHOAT_RATE;
  return recalcRow({ ...row, ndsh, hhoat }, expectedHours);
}

export function sumTotals(rows: SalaryRow[]): SalaryTotals {
  return {
    totalWorkedHours: r2(rows.reduce((s, r) => s + (r.totalWorkedHours || 0), 0)),
    totalBillableHours: r2(rows.reduce((s, r) => s + (r.totalBillableHours || 0), 0)),
    totalOvertimeHours: r2(rows.reduce((s, r) => s + (r.totalOvertimeHours || 0), 0)),
    totalGrossPay: r2(rows.reduce((s, r) => s + (r.grossPay || 0), 0)),
    totalNdsh: r2(rows.reduce((s, r) => s + (r.ndsh || 0), 0)),
    totalHhoat: r2(rows.reduce((s, r) => s + (r.hhoat || 0), 0)),
    totalNetPay: r2(rows.reduce((s, r) => s + (r.netPay || 0), 0)),
    totalDeduction: r2(rows.reduce((s, r) => s + (r.deduction || 0), 0)),
    totalAdditionalDeduction: r2(rows.reduce((s, r) => s + (r.additional_deduction || 0), 0)),
    employeeCount: rows.length,
    withEmailCount: rows.filter((r) => r.hasEmail).length,
  };
}

export function rowToPayload(row: SalaryRow): SalaryAdjustmentPayload {
  return {
    user_id: row.user_id,
    worked_hours: row.totalWorkedHours,
    billable_hours: row.totalBillableHours,
    overtime_hours: row.totalOvertimeHours,
    absent_hours: row.absentHours,
    ndsh: row.ndsh,
    hhoat: row.hhoat,
    deduction: row.deduction,
    additional_deduction: row.additional_deduction,
    note: row.note,
  };
}
