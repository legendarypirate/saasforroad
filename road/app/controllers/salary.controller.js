const db = require("../models");
const User = db.users;
const Attendance = db.attendances;
const SalaryAdjustment = db.salary_adjustments;
const SalaryMonthSetting = db.salary_month_settings;
const Op = db.Sequelize.Op;
const { monthRange, summarizePeriod } = require("../utils/attendanceCalculator");
const {
  calculateSalaryBreakdown,
  buildSalaryEmailHtml,
  buildSalaryEmailText,
  defaultExpectedHoursForMonth,
  round2,
} = require("../utils/salaryCalculator");
const { sendMail, isConfigured } = require("../utils/mailer");
const { groupApprovedLeavesByUser } = require("../utils/leaveCalculator");
const { getCurrentTenantId } = require("../middleware/tenantScope");

function requireScopedTenantId() {
  const tenantId = getCurrentTenantId();
  if (!tenantId) {
    const err = new Error("Tenant context required");
    err.statusCode = 404;
    throw err;
  }
  return tenantId;
}

const userAttrs = [
  "id",
  "username",
  "email",
  "company_email",
  "salary",
  "work_schedule_type",
  "cycle_start_date",
  "cycle_work_days",
  "cycle_rest_days",
  "daily_work_hours",
  "extended_cycle",
];

const ADJUSTMENT_FIELDS = [
  "worked_hours",
  "billable_hours",
  "overtime_hours",
  "absent_hours",
  "ndsh",
  "hhoat",
  "deduction",
  "additional_deduction",
  "note",
];

/**
 * Safety net: exclude any leftover brigada markers from payroll.
 * Brigade identity now lives on `brigades` — should not appear in users.
 */
async function getExcludedBrigadaUserIds(tenantId) {
  const affiliated = await User.findAll({
    attributes: ["id"],
    where: {
      tenant_id: tenantId,
      [Op.or]: [{ affiliation: "brigada" }, { role: "brigada" }],
    },
    raw: true,
  });
  return affiliated.map((u) => u.id);
}

const NULLABLE_NUM_FIELDS = new Set([
  "worked_hours",
  "billable_hours",
  "overtime_hours",
  "absent_hours",
  "ndsh",
  "hhoat",
]);

async function fetchApprovedLeavesForUsers(userIds, from, to) {
  if (!userIds.length) return {};
  const rows = await db.leave_requests.findAll({
    where: {
      user_id: userIds,
      status: "approved",
      start_date: { [Op.lte]: to },
      end_date: { [Op.gte]: from },
    },
  });
  return groupApprovedLeavesByUser(rows);
}

async function fetchExceptionsForUsers(userIds, from, to) {
  if (!userIds.length) return {};
  const rows = await db.schedule_exceptions.findAll({
    where: {
      user_id: userIds,
      start_date: { [Op.lte]: to },
      end_date: { [Op.gte]: from },
    },
    order: [["start_date", "ASC"]],
  });
  const grouped = {};
  rows.forEach((row) => {
    if (!grouped[row.user_id]) grouped[row.user_id] = [];
    grouped[row.user_id].push(row);
  });
  return grouped;
}

function resolveEmail(user) {
  const email = (user.email || user.company_email || "").trim();
  return email && email.includes("@") ? email : null;
}

function toAdjustmentMap(rows) {
  const map = {};
  rows.forEach((row) => {
    map[row.user_id] = {
      worked_hours: row.worked_hours,
      billable_hours: row.billable_hours,
      overtime_hours: row.overtime_hours,
      absent_hours: row.absent_hours,
      ndsh: row.ndsh,
      hhoat: row.hhoat,
      deduction: Number(row.deduction) || 0,
      additional_deduction: Number(row.additional_deduction) || 0,
      note: row.note || "",
    };
  });
  return map;
}

function pickAdjustmentUpdates(source) {
  const updates = {};
  for (const field of ADJUSTMENT_FIELDS) {
    if (source[field] === undefined) continue;
    if (field === "note") {
      updates.note = source.note || "";
    } else if (NULLABLE_NUM_FIELDS.has(field)) {
      updates[field] = source[field] === null ? null : Number(source[field]) || 0;
    } else {
      updates[field] = Number(source[field]) || 0;
    }
  }
  return updates;
}

async function getMonthExpectedHours(month, tenantId) {
  const setting = await SalaryMonthSetting.findOne({ where: { month, tenant_id: tenantId } });
  if (setting) return Number(setting.expected_hours) || 0;
  return defaultExpectedHoursForMonth(month);
}

async function buildMonthlyRows(month, userIds = null) {
  const tenantId = requireScopedTenantId();
  const [year, mon] = String(month).split("-").map(Number);
  if (!year || !mon) {
    const err = new Error("month формат буруу (YYYY-MM)");
    err.statusCode = 400;
    throw err;
  }

  const { from, to } = monthRange(year, mon);
  const expectedHours = await getMonthExpectedHours(month, tenantId);
  const excludedIds = await getExcludedBrigadaUserIds(tenantId);

  const userWhere = { tenant_id: tenantId };
  if (userIds?.length) {
    const allowed = userIds.filter((id) => !excludedIds.includes(Number(id)));
    userWhere.id = allowed.length ? { [Op.in]: allowed } : { [Op.in]: [-1] };
  } else if (excludedIds.length) {
    userWhere.id = { [Op.notIn]: excludedIds };
  }

  const users = await User.findAll({
    where: userWhere,
    attributes: userAttrs,
    order: [["username", "ASC"]],
  });

  const ids = users.map((u) => u.id);

  const [records, adjustments] = await Promise.all([
    Attendance.findAll({
      where: {
        tenant_id: tenantId,
        work_date: { [Op.between]: [from, to] },
        ...(userIds?.length ? { user_id: userIds } : {}),
      },
    }),
    SalaryAdjustment.findAll({
      where: {
        tenant_id: tenantId,
        month,
        ...(userIds?.length ? { user_id: userIds } : {}),
      },
    }),
  ]);

  const exceptionsByUser = await fetchExceptionsForUsers(ids, from, to);
  const leavesByUser = await fetchApprovedLeavesForUsers(ids, from, to);
  const adjustmentMap = toAdjustmentMap(adjustments);

  const byUser = {};
  records.forEach((r) => {
    if (!byUser[r.user_id]) byUser[r.user_id] = [];
    byUser[r.user_id].push(r);
  });

  let totalWorkedHours = 0;
  let totalBillableHours = 0;
  let totalOvertimeHours = 0;
  let totalGrossPay = 0;
  let totalNdsh = 0;
  let totalHhoat = 0;
  let totalNetPay = 0;
  let totalDeduction = 0;
  let totalAdditionalDeduction = 0;

  const rows = users.map((user) => {
    const summary = summarizePeriod(
      user,
      from,
      to,
      byUser[user.id] || [],
      exceptionsByUser[user.id] || [],
      leavesByUser[user.id] || []
    );
    const adjustment = adjustmentMap[user.id] || {
      deduction: 0,
      additional_deduction: 0,
      note: "",
    };
    const breakdown = calculateSalaryBreakdown(
      user,
      summary,
      adjustment,
      expectedHours
    );
    const email = resolveEmail(user);

    totalWorkedHours += breakdown.totalWorkedHours;
    totalBillableHours += breakdown.totalBillableHours;
    totalOvertimeHours += breakdown.totalOvertimeHours;
    totalGrossPay += breakdown.grossPay;
    totalNdsh += breakdown.ndsh;
    totalHhoat += breakdown.hhoat;
    totalNetPay += breakdown.netPay;
    totalDeduction += breakdown.deduction;
    totalAdditionalDeduction += breakdown.additionalDeduction;

    return {
      user_id: user.id,
      username: user.username,
      email,
      salary: breakdown.baseSalary,
      scheduleLabel: summary.scheduleLabel,
      scheduledWorkDays: summary.scheduledWorkDays,
      presentDays: summary.presentDays,
      absentDays: summary.absentDays,
      absentHours: breakdown.absentHours,
      totalWorkedHours: breakdown.totalWorkedHours,
      totalBillableHours: breakdown.totalBillableHours,
      totalOvertimeHours: breakdown.totalOvertimeHours,
      workPay: breakdown.workPay,
      overtimePay: breakdown.overtimePay,
      grossPay: breakdown.grossPay,
      absentDeduction: breakdown.absentDeduction,
      ndsh: breakdown.ndsh,
      hhoat: breakdown.hhoat,
      deduction: breakdown.deduction,
      additional_deduction: breakdown.additionalDeduction,
      note: breakdown.note,
      netPay: breakdown.netPay,
      hourlyRate: breakdown.hourlyRate,
      hasEmail: Boolean(email),
      breakdown,
      summary,
    };
  });

  return {
    month,
    from,
    to,
    expectedHours: round2(expectedHours),
    totals: {
      totalWorkedHours: round2(totalWorkedHours),
      totalBillableHours: round2(totalBillableHours),
      totalOvertimeHours: round2(totalOvertimeHours),
      totalGrossPay: round2(totalGrossPay),
      totalNdsh: round2(totalNdsh),
      totalHhoat: round2(totalHhoat),
      totalNetPay: round2(totalNetPay),
      totalDeduction: round2(totalDeduction),
      totalAdditionalDeduction: round2(totalAdditionalDeduction),
      employeeCount: rows.length,
      withEmailCount: rows.filter((r) => r.hasEmail).length,
    },
    rows,
  };
}

function publicPayload(data) {
  return {
    ...data,
    rows: data.rows.map(({ breakdown, summary, ...row }) => row),
    resendConfigured: isConfigured(),
  };
}

exports.getCalculation = async (req, res) => {
  const month = req.query.month;
  if (!month) {
    return res.status(400).json({ success: false, message: "month (YYYY-MM) шаардлагатай" });
  }

  try {
    const data = await buildMonthlyRows(month);
    res.json({ success: true, data: publicPayload(data) });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.updateMonthSetting = async (req, res) => {
  const { month, expected_hours } = req.body;
  if (!month) {
    return res.status(400).json({ success: false, message: "month шаардлагатай" });
  }

  try {
    const hours = Number(expected_hours);
    if (Number.isNaN(hours) || hours < 0) {
      return res.status(400).json({ success: false, message: "Ажиллавал зохих цаг буруу" });
    }

    const tenantId = requireScopedTenantId();
    const [setting] = await SalaryMonthSetting.findOrCreate({
      where: { month, tenant_id: tenantId },
      defaults: { expected_hours: hours, tenant_id: tenantId },
    });
    await setting.update({ expected_hours: hours });

    const data = await buildMonthlyRows(month);
    res.json({ success: true, data: publicPayload(data) });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.upsertAdjustment = async (req, res) => {
  const { month, user_id } = req.body;

  if (!month || !user_id) {
    return res.status(400).json({
      success: false,
      message: "month болон user_id шаардлагатай",
    });
  }

  try {
    const tenantId = requireScopedTenantId();
    const user = await User.findByPk(user_id);
    if (!user || Number(user.tenant_id) !== Number(tenantId)) {
      return res.status(404).json({ success: false, message: "Хэрэглэгч олдсонгүй" });
    }

    const updates = pickAdjustmentUpdates(req.body);
    const [row] = await SalaryAdjustment.findOrCreate({
      where: { user_id, month, tenant_id: tenantId },
      defaults: { ...updates, tenant_id: tenantId },
    });
    await row.update(updates);

    const data = await buildMonthlyRows(month, [user_id]);
    const resultRow = data.rows[0];
    const { breakdown, summary, ...publicRow } = resultRow || {};

    res.json({ success: true, data: publicRow });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.bulkUpsertAdjustments = async (req, res) => {
  const { month, rows } = req.body;
  if (!month || !Array.isArray(rows)) {
    return res.status(400).json({
      success: false,
      message: "month болон rows массив шаардлагатай",
    });
  }

  try {
    const tenantId = requireScopedTenantId();
    for (const item of rows) {
      if (!item.user_id) continue;
      const user = await User.findByPk(item.user_id);
      if (!user || Number(user.tenant_id) !== Number(tenantId)) continue;
      const updates = pickAdjustmentUpdates(item);
      const [row] = await SalaryAdjustment.findOrCreate({
        where: { user_id: item.user_id, month, tenant_id: tenantId },
        defaults: { ...updates, tenant_id: tenantId },
      });
      await row.update(updates);
    }

    const data = await buildMonthlyRows(month);
    res.json({ success: true, data: publicPayload(data) });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.sendBulk = async (req, res) => {
  const { month, user_ids: userIds } = req.body;
  if (!month) {
    return res.status(400).json({ success: false, message: "month (YYYY-MM) шаардлагатай" });
  }

  if (!isConfigured()) {
    return res.status(503).json({
      success: false,
      message: "Resend тохиргоо хийгдээгүй байна. RESEND_API_KEY, RESEND_FROM тохируулна уу.",
    });
  }

  try {
    const data = await buildMonthlyRows(month, userIds?.length ? userIds : null);
    const targets = data.rows.filter((r) => r.hasEmail);

    if (!targets.length) {
      return res.status(400).json({
        success: false,
        message: "И-мэйл хаягтай хэрэглэгч олдсонгүй",
      });
    }

    const sent = [];
    const failed = [];

    for (const row of targets) {
      try {
        await sendMail({
          to: row.email,
          subject: `${month} сарын цалингийн задаргаа`,
          html: buildSalaryEmailHtml({
            username: row.username,
            month,
            breakdown: row.breakdown,
          }),
          text: buildSalaryEmailText({
            username: row.username,
            month,
            breakdown: row.breakdown,
          }),
        });
        sent.push({ user_id: row.user_id, email: row.email });
      } catch (err) {
        failed.push({
          user_id: row.user_id,
          email: row.email,
          error: err.message,
        });
      }
    }

    res.json({
      success: true,
      data: {
        month,
        sent: sent.length,
        failed: failed.length,
        sentList: sent,
        failedList: failed,
      },
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};
