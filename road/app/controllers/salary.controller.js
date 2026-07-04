const db = require("../models");
const User = db.users;
const Attendance = db.attendances;
const SalaryAdjustment = db.salary_adjustments;
const Op = db.Sequelize.Op;
const { monthRange, summarizePeriod } = require("../utils/attendanceCalculator");
const {
  calculateSalaryBreakdown,
  buildSalaryEmailHtml,
  buildSalaryEmailText,
  round2,
} = require("../utils/salaryCalculator");
const { sendMail, isConfigured } = require("../utils/mailer");

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
      deduction: Number(row.deduction) || 0,
      additional_deduction: Number(row.additional_deduction) || 0,
      note: row.note || "",
    };
  });
  return map;
}

async function buildMonthlyRows(month, userIds = null) {
  const [year, mon] = String(month).split("-").map(Number);
  if (!year || !mon) {
    const err = new Error("month формат буруу (YYYY-MM)");
    err.statusCode = 400;
    throw err;
  }

  const { from, to } = monthRange(year, mon);
  const userWhere = userIds?.length ? { id: userIds } : {};

  const users = await User.findAll({
    where: userWhere,
    attributes: userAttrs,
    order: [["username", "ASC"]],
  });

  const ids = users.map((u) => u.id);

  const [records, adjustments] = await Promise.all([
    Attendance.findAll({
      where: {
        work_date: { [Op.between]: [from, to] },
        ...(userIds?.length ? { user_id: userIds } : {}),
      },
    }),
    SalaryAdjustment.findAll({
      where: {
        month,
        ...(userIds?.length ? { user_id: userIds } : {}),
      },
    }),
  ]);

  const exceptionsByUser = await fetchExceptionsForUsers(ids, from, to);
  const adjustmentMap = toAdjustmentMap(adjustments);

  const byUser = {};
  records.forEach((r) => {
    if (!byUser[r.user_id]) byUser[r.user_id] = [];
    byUser[r.user_id].push(r);
  });

  let totalWorkedHours = 0;
  let totalBillableHours = 0;
  let totalNetPay = 0;
  let totalDeduction = 0;
  let totalAdditionalDeduction = 0;

  const rows = users.map((user) => {
    const summary = summarizePeriod(
      user,
      from,
      to,
      byUser[user.id] || [],
      exceptionsByUser[user.id] || []
    );
    const adjustment = adjustmentMap[user.id] || {
      deduction: 0,
      additional_deduction: 0,
      note: "",
    };
    const breakdown = calculateSalaryBreakdown(user, summary, adjustment);
    const email = resolveEmail(user);

    totalWorkedHours += breakdown.totalWorkedHours;
    totalBillableHours += breakdown.totalBillableHours;
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
      totalWorkedHours: breakdown.totalWorkedHours,
      totalBillableHours: breakdown.totalBillableHours,
      totalOvertimeHours: breakdown.totalOvertimeHours,
      workPay: breakdown.workPay,
      overtimePay: breakdown.overtimePay,
      absentDeduction: breakdown.absentDeduction,
      deduction: breakdown.deduction,
      additional_deduction: breakdown.additionalDeduction,
      note: breakdown.note,
      grossPay: breakdown.grossPay,
      netPay: breakdown.netPay,
      hasEmail: Boolean(email),
      breakdown,
      summary,
    };
  });

  return {
    month,
    from,
    to,
    totals: {
      totalWorkedHours: round2(totalWorkedHours),
      totalBillableHours: round2(totalBillableHours),
      totalNetPay: round2(totalNetPay),
      totalDeduction: round2(totalDeduction),
      totalAdditionalDeduction: round2(totalAdditionalDeduction),
      employeeCount: rows.length,
      withEmailCount: rows.filter((r) => r.hasEmail).length,
    },
    rows,
  };
}

exports.getCalculation = async (req, res) => {
  const month = req.query.month;
  if (!month) {
    return res.status(400).json({ success: false, message: "month (YYYY-MM) шаардлагатай" });
  }

  try {
    const data = await buildMonthlyRows(month);
    res.json({
      success: true,
      data: {
        ...data,
        rows: data.rows.map(({ breakdown, summary, ...row }) => row),
        resendConfigured: isConfigured(),
      },
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.upsertAdjustment = async (req, res) => {
  const { month, user_id, deduction, additional_deduction, note } = req.body;

  if (!month || !user_id) {
    return res.status(400).json({
      success: false,
      message: "month болон user_id шаардлагатай",
    });
  }

  try {
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Хэрэглэгч олдсонгүй" });
    }

    const [row] = await SalaryAdjustment.findOrCreate({
      where: { user_id, month },
      defaults: {
        deduction: Number(deduction) || 0,
        additional_deduction: Number(additional_deduction) || 0,
        note: note || "",
      },
    });

    await row.update({
      deduction: deduction !== undefined ? Number(deduction) || 0 : row.deduction,
      additional_deduction:
        additional_deduction !== undefined
          ? Number(additional_deduction) || 0
          : row.additional_deduction,
      note: note !== undefined ? note || "" : row.note,
    });

    const data = await buildMonthlyRows(month, [user_id]);
    const resultRow = data.rows[0];
    const { breakdown, summary, ...publicRow } = resultRow || {};

    res.json({ success: true, data: publicRow });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
    for (const item of rows) {
      if (!item.user_id) continue;
      const [row] = await SalaryAdjustment.findOrCreate({
        where: { user_id: item.user_id, month },
        defaults: {
          deduction: Number(item.deduction) || 0,
          additional_deduction: Number(item.additional_deduction) || 0,
          note: item.note || "",
        },
      });
      await row.update({
        deduction: item.deduction !== undefined ? Number(item.deduction) || 0 : row.deduction,
        additional_deduction:
          item.additional_deduction !== undefined
            ? Number(item.additional_deduction) || 0
            : row.additional_deduction,
        note: item.note !== undefined ? item.note || "" : row.note,
      });
    }

    const data = await buildMonthlyRows(month);
    res.json({
      success: true,
      data: {
        ...data,
        rows: data.rows.map(({ breakdown, summary, ...row }) => row),
        resendConfigured: isConfigured(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
