function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function formatMoney(n) {
  return round2(n).toLocaleString("mn-MN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * @param {object} user - user row with salary
 * @param {object} summary - summarizePeriod() result
 * @param {object} [adjustment] - accountant edits { deduction, additional_deduction, note }
 */
function calculateSalaryBreakdown(user, summary, adjustment = {}) {
  const baseSalary = Number(user.salary) || 0;
  const scheduledWorkDays = summary.scheduledWorkDays || 0;
  const dailyWorkHours = summary.dailyWorkHours || 8;
  const expectedHours = scheduledWorkDays * dailyWorkHours;
  const totalWorkedHours = summary.totalWorkedHours || 0;
  const totalBillableHours = summary.totalBillableHours || 0;
  const totalOvertimeHours = summary.totalOvertimeHours || 0;
  const absentDays = summary.absentDays || 0;

  const hourlyRate = expectedHours > 0 ? baseSalary / expectedHours : 0;
  const workPay = hourlyRate * totalBillableHours;
  const overtimePay = hourlyRate * 1.5 * totalOvertimeHours;
  const absentDeduction =
    scheduledWorkDays > 0 ? (baseSalary / scheduledWorkDays) * absentDays : 0;
  const deduction = Number(adjustment.deduction) || 0;
  const additionalDeduction = Number(adjustment.additional_deduction) || 0;
  const grossPay = workPay + overtimePay;
  const totalDeductions = absentDeduction + deduction + additionalDeduction;
  const netPay = Math.max(0, grossPay - totalDeductions);

  return {
    baseSalary: round2(baseSalary),
    hourlyRate: round2(hourlyRate),
    expectedHours: round2(expectedHours),
    scheduledWorkDays,
    absentDays,
    dailyWorkHours,
    totalWorkedHours: round2(totalWorkedHours),
    totalBillableHours: round2(totalBillableHours),
    totalOvertimeHours: round2(totalOvertimeHours),
    workPay: round2(workPay),
    overtimePay: round2(overtimePay),
    absentDeduction: round2(absentDeduction),
    deduction: round2(deduction),
    additionalDeduction: round2(additionalDeduction),
    note: adjustment.note || "",
    grossPay: round2(grossPay),
    totalDeductions: round2(totalDeductions),
    netPay: round2(netPay),
    formatMoney,
  };
}

function buildSalaryEmailHtml({ username, month, breakdown }) {
  const b = breakdown;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 560px; margin:0 auto;">
  <div style="background:linear-gradient(135deg,#722ed1,#9254de);color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
    <h2 style="margin:0;font-size:20px;">Цалингийн задаргаа</h2>
    <p style="margin:6px 0 0;opacity:0.9;">${month} сар</p>
  </div>
  <div style="border:1px solid #f0f0f0;border-top:none;padding:20px 24px;border-radius:0 0 12px 12px;">
    <p>Сайн байна уу, <strong>${username}</strong>,</p>
    <p>Таны цалингийн дэлгэрэнгүй задаргаа:</p>
    <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding:8px; border-bottom:1px solid #eee;">Суурь цалин</td><td style="padding:8px; border-bottom:1px solid #eee; text-align:right;">${formatMoney(b.baseSalary)} ₮</td></tr>
      <tr><td style="padding:8px; border-bottom:1px solid #eee;">Нийт ажилласан цаг</td><td style="padding:8px; border-bottom:1px solid #eee; text-align:right;">${b.totalWorkedHours} цаг</td></tr>
      <tr><td style="padding:8px; border-bottom:1px solid #eee;">Тооцох цаг</td><td style="padding:8px; border-bottom:1px solid #eee; text-align:right;">${b.totalBillableHours} цаг</td></tr>
      <tr><td style="padding:8px; border-bottom:1px solid #eee;">Илүү цаг</td><td style="padding:8px; border-bottom:1px solid #eee; text-align:right;">${b.totalOvertimeHours} цаг</td></tr>
      <tr><td style="padding:8px; border-bottom:1px solid #eee;">Цагийн олговол</td><td style="padding:8px; border-bottom:1px solid #eee; text-align:right;">${formatMoney(b.workPay)} ₮</td></tr>
      <tr><td style="padding:8px; border-bottom:1px solid #eee;">Илүү цагийн олговол</td><td style="padding:8px; border-bottom:1px solid #eee; text-align:right;">${formatMoney(b.overtimePay)} ₮</td></tr>
      <tr><td style="padding:8px; border-bottom:1px solid #eee;">Тасалсаны хасалт (${b.absentDays} өдөр)</td><td style="padding:8px; border-bottom:1px solid #eee; text-align:right; color:#cf1322;">-${formatMoney(b.absentDeduction)} ₮</td></tr>
      <tr><td style="padding:8px; border-bottom:1px solid #eee;">Суутгал</td><td style="padding:8px; border-bottom:1px solid #eee; text-align:right; color:#cf1322;">-${formatMoney(b.deduction)} ₮</td></tr>
      <tr><td style="padding:8px; border-bottom:1px solid #eee;">Нэмэлт суутгал</td><td style="padding:8px; border-bottom:1px solid #eee; text-align:right; color:#cf1322;">-${formatMoney(b.additionalDeduction)} ₮</td></tr>
      <tr style="background:#f9f0ff;"><td style="padding:12px 8px; font-weight:bold;">Нийт олгох</td><td style="padding:12px 8px; text-align:right; font-weight:bold; color:#722ed1;font-size:18px;">${formatMoney(b.netPay)} ₮</td></tr>
    </table>
    ${b.note ? `<p style="font-size:13px;color:#595959;background:#fafafa;padding:10px;border-radius:8px;"><strong>Тэмдэглэл:</strong> ${b.note}</p>` : ""}
    <p style="font-size:12px; color:#888;margin-bottom:0;">Энэ имэйлийг HR системээс автоматаар илгээсэн.</p>
  </div>
</body>
</html>`;
}

function buildSalaryEmailText({ username, month, breakdown }) {
  const b = breakdown;
  return `Сайн байна уу, ${username},

${month} сарын цалингийн задаргаа:

Суурь цалин: ${formatMoney(b.baseSalary)} ₮
Нийт ажилласан цаг: ${b.totalWorkedHours} цаг
Тооцох цаг: ${b.totalBillableHours} цаг
Илүү цаг: ${b.totalOvertimeHours} цаг
Цагийн олговол: ${formatMoney(b.workPay)} ₮
Илүү цагийн олговол: ${formatMoney(b.overtimePay)} ₮
Тасалсаны хасалт: -${formatMoney(b.absentDeduction)} ₮
Суутгал: -${formatMoney(b.deduction)} ₮
Нэмэлт суутгал: -${formatMoney(b.additionalDeduction)} ₮
Нийт олгох: ${formatMoney(b.netPay)} ₮${b.note ? `\nТэмдэглэл: ${b.note}` : ""}`;
}

module.exports = {
  calculateSalaryBreakdown,
  buildSalaryEmailHtml,
  buildSalaryEmailText,
  formatMoney,
  round2,
};
