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
  netPay: number;
  hasEmail: boolean;
}

export interface SalaryTotals {
  totalWorkedHours: number;
  totalBillableHours: number;
  totalNetPay: number;
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
  return `${Math.round(value).toLocaleString('mn-MN')} ₮`;
}
