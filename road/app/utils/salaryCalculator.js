function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function formatMoney(n) {
  return round2(n).toLocaleString("mn-MN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function isSet(value) {
  return value !== undefined && value !== null && value !== "";
}

/** Employee social insurance (НДШ) rate */
const NDSH_RATE = 0.115;
/** Personal income tax (ХХОАТ) rate on (gross − НДШ) */
const HHOAT_RATE = 0.1;

/**
 * Default "ажиллавал зохих цаг" for a month: weekdays × 8.
 */
function defaultExpectedHoursForMonth(month) {
  const [year, mon] = String(month).split("-").map(Number);
  if (!year || !mon) return 176;
  const lastDay = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  let weekdays = 0;
  for (let d = 1; d <= lastDay; d += 1) {
    const day = new Date(Date.UTC(year, mon - 1, d)).getUTCDay();
    if (day >= 1 && day <= 5) weekdays += 1;
  }
  return weekdays * 8;
}

function resolveHours(adjustment, summary, expectedHours) {
  const attendanceWorked = Number(summary.totalWorkedHours) || 0;
  const attendanceBillable = Number(summary.totalBillableHours) || 0;
  const attendanceOvertime = Number(summary.totalOvertimeHours) || 0;
  const hasAttendance = attendanceWorked > 0 || attendanceBillable > 0;

  let worked = isSet(adjustment.worked_hours)
    ? Number(adjustment.worked_hours)
    : attendanceWorked;
  let billable = isSet(adjustment.billable_hours)
    ? Number(adjustment.billable_hours)
    : attendanceBillable;
  let overtime = isSet(adjustment.overtime_hours)
    ? Number(adjustment.overtime_hours)
    : attendanceOvertime;

  const hasHourOverride =
    isSet(adjustment.worked_hours) ||
    isSet(adjustment.billable_hours) ||
    isSet(adjustment.overtime_hours);

  // No attendance and no override → full month (so salary shows, not 0)
  if (!hasAttendance && !hasHourOverride && expectedHours > 0) {
    worked = expectedHours;
    billable = expectedHours;
    overtime = 0;
  }

  // Legacy: all-zero hour overrides saved by mistake when attendance was empty
  if (
    !hasAttendance &&
    hasHourOverride &&
    worked === 0 &&
    billable === 0 &&
    overtime === 0 &&
    expectedHours > 0
  ) {
    worked = expectedHours;
    billable = expectedHours;
    overtime = 0;
  }

  return {
    totalWorkedHours: worked,
    totalBillableHours: billable,
    totalOvertimeHours: overtime,
  };
}

/**
 * @param {object} user
 * @param {object} summary
 * @param {object} [adjustment]
 * @param {number} [monthExpectedHours]
 */
function calculateSalaryBreakdown(user, summary, adjustment = {}, monthExpectedHours) {
  const baseSalary = Number(user.salary) || 0;
  const scheduledWorkDays = summary.scheduledWorkDays || 0;
  const dailyWorkHours = Number(summary.dailyWorkHours) || 8;
  const autoExpected = scheduledWorkDays * dailyWorkHours;

  const expectedHours =
    monthExpectedHours !== undefined && monthExpectedHours !== null
      ? Number(monthExpectedHours) || 0
      : autoExpected || 176;

  const hours = resolveHours(adjustment, summary, expectedHours);
  const totalWorkedHours = hours.totalWorkedHours;
  const totalBillableHours = hours.totalBillableHours;
  const totalOvertimeHours = hours.totalOvertimeHours;
  const absentDays = summary.absentDays || 0;
  // Default always 0 — accountant enters тасалсан цаг manually
  const absentHours = isSet(adjustment.absent_hours)
    ? Number(adjustment.absent_hours) || 0
    : 0;

  const hourlyRate = expectedHours > 0 ? baseSalary / expectedHours : 0;
  const workPay = hourlyRate * totalBillableHours;
  const overtimePay = hourlyRate * 1.5 * totalOvertimeHours;
  const grossPay = workPay + overtimePay;

  // Тасалсан хасалт = цагийн хөлс × тасалсан цаг
  const absentDeduction = hourlyRate * absentHours;

  const autoNdsh = grossPay * NDSH_RATE;
  const ndsh = isSet(adjustment.ndsh) ? Number(adjustment.ndsh) : autoNdsh;
  const taxableForHhoat = Math.max(0, grossPay - ndsh);
  const autoHhoat = taxableForHhoat * HHOAT_RATE;
  const hhoat = isSet(adjustment.hhoat) ? Number(adjustment.hhoat) : autoHhoat;

  const deduction = Number(adjustment.deduction) || 0;
  const additionalDeduction = Number(adjustment.additional_deduction) || 0;

  const totalDeductions =
    absentDeduction + ndsh + hhoat + deduction + additionalDeduction;
  const netPay = Math.max(0, grossPay - totalDeductions);

  return {
    baseSalary: round2(baseSalary),
    hourlyRate: round2(hourlyRate),
    expectedHours: round2(expectedHours),
    scheduledWorkDays,
    absentDays,
    absentHours: round2(absentHours),
    dailyWorkHours,
    totalWorkedHours: round2(totalWorkedHours),
    totalBillableHours: round2(totalBillableHours),
    totalOvertimeHours: round2(totalOvertimeHours),
    workPay: round2(workPay),
    overtimePay: round2(overtimePay),
    grossPay: round2(grossPay),
    absentDeduction: round2(absentDeduction),
    ndsh: round2(ndsh),
    hhoat: round2(hhoat),
    ndshAuto: round2(autoNdsh),
    hhoatAuto: round2(autoHhoat),
    deduction: round2(deduction),
    additionalDeduction: round2(additionalDeduction),
    note: adjustment.note || "",
    totalDeductions: round2(totalDeductions),
    netPay: round2(netPay),
    ndshRate: NDSH_RATE,
    hhoatRate: HHOAT_RATE,
    formatMoney,
  };
}

function buildSalaryEmailHtml({ username, month, breakdown }) {
  const b = breakdown;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.5; max-width: 560px; margin:0 auto;">
  <div style="background:linear-gradient(135deg,#722ed1,#9254de);color:#fff;padding:18px 20px;border-radius:12px 12px 0 0;">
    <h2 style="margin:0;font-size:18px;">Цалингийн задаргаа</h2>
    <p style="margin:4px 0 0;opacity:0.9;font-size:13px;">${month} сар</p>
  </div>
  <div style="border:1px solid #f0f0f0;border-top:none;padding:16px 20px;border-radius:0 0 12px 12px;">
    <p style="margin-top:0;">Сайн байна уу, <strong>${username}</strong>,</p>
    <table style="width:100%; border-collapse: collapse; font-size:13px;">
      <tr><td style="padding:6px 0; border-bottom:1px solid #f0f0f0;">Суурь цалин</td><td style="padding:6px 0; border-bottom:1px solid #f0f0f0; text-align:right;">${formatMoney(b.baseSalary)} ₮</td></tr>
      <tr><td style="padding:6px 0; border-bottom:1px solid #f0f0f0;">Ажиллавал зохих цаг</td><td style="padding:6px 0; border-bottom:1px solid #f0f0f0; text-align:right;">${b.expectedHours} ц</td></tr>
      <tr><td style="padding:6px 0; border-bottom:1px solid #f0f0f0;">Ажилласан / Тооцох / Илүү</td><td style="padding:6px 0; border-bottom:1px solid #f0f0f0; text-align:right;">${b.totalWorkedHours} / ${b.totalBillableHours} / ${b.totalOvertimeHours} ц</td></tr>
      <tr><td style="padding:6px 0; border-bottom:1px solid #f0f0f0;">Цагийн олговол</td><td style="padding:6px 0; border-bottom:1px solid #f0f0f0; text-align:right;">${formatMoney(b.workPay)} ₮</td></tr>
      <tr><td style="padding:6px 0; border-bottom:1px solid #f0f0f0;">Илүү цагийн олговол</td><td style="padding:6px 0; border-bottom:1px solid #f0f0f0; text-align:right;">${formatMoney(b.overtimePay)} ₮</td></tr>
      <tr><td style="padding:6px 0; border-bottom:1px solid #f0f0f0;font-weight:600;">Нийт олговол</td><td style="padding:6px 0; border-bottom:1px solid #f0f0f0; text-align:right;font-weight:600;">${formatMoney(b.grossPay)} ₮</td></tr>
      <tr><td style="padding:6px 0; border-bottom:1px solid #f0f0f0;color:#cf1322;">Тасалсан (${b.absentHours} ц)</td><td style="padding:6px 0; border-bottom:1px solid #f0f0f0; text-align:right;color:#cf1322;">-${formatMoney(b.absentDeduction)} ₮</td></tr>
      <tr><td style="padding:6px 0; border-bottom:1px solid #f0f0f0;color:#cf1322;">НДШ (11.5%)</td><td style="padding:6px 0; border-bottom:1px solid #f0f0f0; text-align:right;color:#cf1322;">-${formatMoney(b.ndsh)} ₮</td></tr>
      <tr><td style="padding:6px 0; border-bottom:1px solid #f0f0f0;color:#cf1322;">ХХОАТ (10%)</td><td style="padding:6px 0; border-bottom:1px solid #f0f0f0; text-align:right;color:#cf1322;">-${formatMoney(b.hhoat)} ₮</td></tr>
      <tr><td style="padding:6px 0; border-bottom:1px solid #f0f0f0;color:#cf1322;">Суутгал</td><td style="padding:6px 0; border-bottom:1px solid #f0f0f0; text-align:right;color:#cf1322;">-${formatMoney(b.deduction)} ₮</td></tr>
      <tr><td style="padding:6px 0; border-bottom:1px solid #f0f0f0;color:#cf1322;">Нэмэлт суутгал</td><td style="padding:6px 0; border-bottom:1px solid #f0f0f0; text-align:right;color:#cf1322;">-${formatMoney(b.additionalDeduction)} ₮</td></tr>
      <tr style="background:#f9f0ff;"><td style="padding:10px 6px; font-weight:bold;">Нийт олгох</td><td style="padding:10px 6px; text-align:right; font-weight:bold; color:#722ed1;font-size:16px;">${formatMoney(b.netPay)} ₮</td></tr>
    </table>
    ${b.note ? `<p style="font-size:12px;color:#595959;background:#fafafa;padding:8px;border-radius:6px;"><strong>Тэмдэглэл:</strong> ${b.note}</p>` : ""}
    <p style="font-size:11px; color:#888;margin-bottom:0;">Энэ имэйлийг HR системээс автоматаар илгээсэн.</p>
  </div>
</body>
</html>`;
}

function buildSalaryEmailText({ username, month, breakdown }) {
  const b = breakdown;
  return `Сайн байна уу, ${username},

${month} сарын цалингийн задаргаа:

Суурь цалин: ${formatMoney(b.baseSalary)} ₮
Ажиллавал зохих цаг: ${b.expectedHours} ц
Ажилласан: ${b.totalWorkedHours} ц | Тооцох: ${b.totalBillableHours} ц | Илүү: ${b.totalOvertimeHours} ц
Цагийн олговол: ${formatMoney(b.workPay)} ₮
Илүү цагийн олговол: ${formatMoney(b.overtimePay)} ₮
Нийт олговол: ${formatMoney(b.grossPay)} ₮
Тасалсан (${b.absentHours} ц): -${formatMoney(b.absentDeduction)} ₮
НДШ: -${formatMoney(b.ndsh)} ₮
ХХОАТ: -${formatMoney(b.hhoat)} ₮
Суутгал: -${formatMoney(b.deduction)} ₮
Нэмэлт суутгал: -${formatMoney(b.additionalDeduction)} ₮
Нийт олгох: ${formatMoney(b.netPay)} ₮${b.note ? `\nТэмдэглэл: ${b.note}` : ""}`;
}

module.exports = {
  calculateSalaryBreakdown,
  buildSalaryEmailHtml,
  buildSalaryEmailText,
  defaultExpectedHoursForMonth,
  formatMoney,
  round2,
  NDSH_RATE,
  HHOAT_RATE,
};
