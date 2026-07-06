const { findApprovedLeaveForDate, getLeaveHoursForDay } = require("./leaveCalculator");

/**
 * Work schedule rules for road company attendance & payroll prep.
 *
 * schedule types:
 * - office_8h: Mon–Fri, daily_work_hours (default 8)
 * - rotation: cycle_work_days + cycle_rest_days from cycle_start_date (e.g. 22/8, 21/7)
 * - rotation_22_8, field_12h: legacy aliases — treated as rotation
 *
 * extended_cycle: (legacy) always skip rest — prefer schedule_exceptions instead
 */

const LEGACY_ROTATION_TYPES = ['rotation', 'rotation_22_8', 'field_12h'];

function findExceptionForDate(exceptions, dateStr) {
  if (!exceptions?.length) return null;
  return exceptions.find(
    (ex) => dateStr >= ex.start_date && dateStr <= ex.end_date
  );
}

function applyScheduleException(baseSchedule, user, dateStr, exceptions) {
  const ex = findExceptionForDate(exceptions, dateStr);
  if (!ex) return baseSchedule;

  const expectedHours = getExpectedHours(user);

  if (ex.override_type === 'skip_rest' && baseSchedule.isRestDay) {
    return {
      ...baseSchedule,
      isWorkDay: true,
      isRestDay: false,
      dayType: 'work',
      expectedHours,
      override: 'skip_rest',
      overrideLabel: 'Амралт алгассан (нэг удаа)',
      overrideReason: ex.reason || null,
    };
  }

  if (ex.override_type === 'force_rest' && baseSchedule.isWorkDay) {
    return {
      ...baseSchedule,
      isWorkDay: false,
      isRestDay: true,
      dayType: 'rest',
      expectedHours: 0,
      override: 'force_rest',
      overrideLabel: 'Нэмэлт амралт',
      overrideReason: ex.reason || null,
    };
  }

  return baseSchedule;
}

function parseDateOnly(value) {
  if (!value) return null;
  const str = String(value).slice(0, 10);
  const [y, m, d] = str.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function daysBetween(from, to) {
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

function isWeekday(date) {
  const day = date.getUTCDay();
  return day >= 1 && day <= 5;
}

function isRotationType(scheduleType) {
  return LEGACY_ROTATION_TYPES.includes(scheduleType);
}

function getCycleConfig(user) {
  let workDays = parseInt(user.cycle_work_days, 10);
  let restDays = parseInt(user.cycle_rest_days, 10);

  if (Number.isNaN(workDays) || workDays < 1) {
    workDays = user.work_schedule_type === 'field_12h' ? 22 : 22;
  }
  if (Number.isNaN(restDays) || restDays < 0) {
    restDays = user.work_schedule_type === 'rotation_22_8' ? 8 : 8;
  }

  return { workDays, restDays, cycleLength: workDays + restDays };
}

function getExpectedHours(user) {
  const parsed = parseFloat(user.daily_work_hours);
  if (!Number.isNaN(parsed) && parsed > 0) {
    return parsed;
  }
  if (user.work_schedule_type === 'field_12h') return 11;
  return 8;
}

function getScheduleLabel(user) {
  const scheduleType = user.work_schedule_type || 'office_8h';
  const hours = getExpectedHours(user);

  if (scheduleType === 'office_8h') {
    return `Энгийн (${hours} ц/өдөр)`;
  }

  const { workDays, restDays } = getCycleConfig(user);
  return `${workDays}/${restDays} ээлж (${hours} ц/өдөр)`;
}

function getRotationInfo(targetDate, cycleStartDate, extendedCycle, workDays, restDays) {
  const start = parseDateOnly(cycleStartDate);
  const date = parseDateOnly(targetDate);
  const cycleLength = workDays + restDays;

  if (!start || !date || workDays < 1) {
    return { isWorkDay: false, cycleDay: null, isRestDay: true, cycleIndex: null };
  }

  const dayIndex = daysBetween(start, date);
  if (dayIndex < 0) {
    return { isWorkDay: false, cycleDay: null, isRestDay: true, cycleIndex: null };
  }

  if (extendedCycle) {
    const cycleIndex = Math.floor(dayIndex / workDays);
    const cycleDay = (dayIndex % workDays) + 1;
    return { isWorkDay: true, cycleDay, isRestDay: false, cycleIndex, extended: true };
  }

  const pos = dayIndex % cycleLength;
  const isWorkDay = pos < workDays;
  return {
    isWorkDay,
    cycleDay: isWorkDay ? pos + 1 : null,
    isRestDay: !isWorkDay,
    cycleIndex: Math.floor(dayIndex / cycleLength),
    restDay: !isWorkDay ? pos - workDays + 1 : null,
    workDays,
    restDays,
  };
}

function getScheduleForDate(user, dateStr, exceptions = []) {
  const scheduleType = user.work_schedule_type || 'office_8h';
  const expectedHours = getExpectedHours(user);
  const scheduleLabel = getScheduleLabel(user);

  let base;

  if (scheduleType === 'office_8h') {
    const date = parseDateOnly(dateStr);
    const isWorkDay = date ? isWeekday(date) : false;
    base = {
      scheduleType,
      scheduleLabel,
      date: dateStr,
      isWorkDay,
      isRestDay: !isWorkDay,
      expectedHours: isWorkDay ? expectedHours : 0,
      dayType: isWorkDay ? 'work' : 'rest',
    };
  } else if (isRotationType(scheduleType)) {
    const { workDays, restDays } = getCycleConfig(user);
    const rotation = getRotationInfo(
      dateStr,
      user.cycle_start_date,
      user.extended_cycle === true || user.extended_cycle === 'true' || user.extended_cycle === '1',
      workDays,
      restDays
    );

    base = {
      scheduleType,
      scheduleLabel,
      date: dateStr,
      isWorkDay: rotation.isWorkDay,
      isRestDay: rotation.isRestDay,
      expectedHours: rotation.isWorkDay ? expectedHours : 0,
      dayType: rotation.isWorkDay ? 'work' : 'rest',
      cycleDay: rotation.cycleDay,
      restDay: rotation.restDay,
      cycleIndex: rotation.cycleIndex,
      extended: rotation.extended || false,
      cycleWorkDays: workDays,
      cycleRestDays: restDays,
    };
  } else {
    base = {
      scheduleType,
      scheduleLabel,
      date: dateStr,
      isWorkDay: false,
      isRestDay: true,
      expectedHours: 0,
      dayType: 'rest',
    };
  }

  return applyScheduleException(base, user, dateStr, exceptions);
}

function workedHoursFromRecord(record) {
  if (!record?.check_in_at || !record?.check_out_at) return 0;
  const start = new Date(record.check_in_at).getTime();
  const end = new Date(record.check_out_at).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return Math.round(((end - start) / 3600000) * 100) / 100;
}

function evaluateDay(user, dateStr, attendanceRecord, exceptions = [], approvedLeaves = []) {
  const schedule = getScheduleForDate(user, dateStr, exceptions);
  const workedHoursFromAttendance = workedHoursFromRecord(attendanceRecord);
  const checkIn = attendanceRecord?.check_in_at || null;
  const checkOut = attendanceRecord?.check_out_at || null;
  const approvedLeave = findApprovedLeaveForDate(approvedLeaves, dateStr);

  let status = "rest";
  let workedHours = workedHoursFromAttendance;
  let billableHours = 0;
  let overtimeHours = 0;
  let leaveInfo = null;

  if (approvedLeave && schedule.isWorkDay) {
    const leaveHours = getLeaveHoursForDay(user, dateStr, approvedLeave, exceptions);
    leaveInfo = {
      id: approvedLeave.id,
      leave_type: approvedLeave.leave_type,
      hours: leaveHours,
    };

    if (approvedLeave.leave_type === "paid") {
      status = "leave_paid";
      if (checkIn && checkOut) {
        workedHours = Math.max(workedHoursFromAttendance, leaveHours);
        billableHours = Math.max(
          Math.min(workedHoursFromAttendance, schedule.expectedHours),
          leaveHours
        );
      } else {
        workedHours = leaveHours;
        billableHours = leaveHours;
      }
    } else {
      status = "leave_unpaid";
      workedHours = checkIn ? workedHoursFromAttendance : 0;
      billableHours = checkIn
        ? Math.min(workedHoursFromAttendance, schedule.expectedHours)
        : 0;
    }

    overtimeHours =
      workedHours > schedule.expectedHours
        ? Math.round((workedHours - schedule.expectedHours) * 100) / 100
        : 0;
  } else if (schedule.isWorkDay) {
    if (!checkIn) status = "absent";
    else if (!checkOut) status = "in_progress";
    else if (workedHours >= schedule.expectedHours) status = "complete";
    else if (workedHours >= schedule.expectedHours * 0.75) status = "partial";
    else status = "under";

    billableHours = Math.min(workedHours, schedule.expectedHours);
    overtimeHours =
      workedHours > schedule.expectedHours
        ? Math.round((workedHours - schedule.expectedHours) * 100) / 100
        : 0;
  } else if (checkIn) {
    status = "unscheduled_work";
    billableHours = workedHours;
  }

  return {
    ...schedule,
    check_in_at: checkIn,
    check_out_at: checkOut,
    workedHours,
    billableHours,
    overtimeHours,
    status,
    statusLabel: schedule.overrideLabel || statusLabel(status),
    leave: leaveInfo,
  };
}

function statusLabel(status) {
  const map = {
    rest: 'Амралт',
    absent: 'Тасалсан',
    in_progress: 'Ажиллаж байна',
    complete: 'Бүрэн',
    partial: 'Дутуу',
    under: 'Хангалтгүй',
    unscheduled_work: 'Амралтын өдөр ажилласан',
    leave_paid: 'Цалинтай чөлөө',
    leave_unpaid: 'Цалингүй чөлөө',
  };
  return map[status] || status;
}

function buildCalendarMonth(user, year, month, attendanceByDate, exceptions = [], approvedLeaves = []) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  const days = [];

  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    const dateStr = formatDateOnly(d);
    const record = attendanceByDate[dateStr] || null;
    days.push(evaluateDay(user, dateStr, record, exceptions, approvedLeaves));
  }

  return days;
}

function summarizePeriod(user, fromStr, toStr, attendanceRecords, exceptions = [], approvedLeaves = []) {
  const attendanceByDate = {};
  for (const r of attendanceRecords) {
    attendanceByDate[r.work_date] = r;
  }

  const from = parseDateOnly(fromStr);
  const to = parseDateOnly(toStr);
  if (!from || !to || to < from) {
    return null;
  }

  let scheduledWorkDays = 0;
  let presentDays = 0;
  let absentDays = 0;
  let restDays = 0;
  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;
  let totalWorkedHours = 0;
  let totalBillableHours = 0;
  let totalOvertimeHours = 0;
  let paidLeaveHours = 0;
  let unpaidLeaveHours = 0;
  let unscheduledWorkDays = 0;
  const daily = [];

  for (let d = new Date(from); d <= to; d = addDays(d, 1)) {
    const dateStr = formatDateOnly(d);
    const record = attendanceByDate[dateStr] || null;
    const day = evaluateDay(user, dateStr, record, exceptions, approvedLeaves);
    daily.push(day);

    if (day.isWorkDay) scheduledWorkDays += 1;
    else restDays += 1;

    if (day.status === "absent") absentDays += 1;
    if (day.status === "leave_paid") {
      paidLeaveDays += 1;
      paidLeaveHours += day.leave?.hours || day.billableHours || 0;
    }
    if (day.status === "leave_unpaid") {
      unpaidLeaveDays += 1;
      unpaidLeaveHours += day.leave?.hours || 0;
    }
    if (day.check_in_at) presentDays += 1;
    else if (day.status === "leave_paid") presentDays += 1;
    if (day.status === "unscheduled_work") unscheduledWorkDays += 1;

    totalWorkedHours += day.workedHours;
    totalBillableHours += day.billableHours;
    totalOvertimeHours += day.overtimeHours;
  }

  const { workDays, restDays: cycleRestDays } = getCycleConfig(user);

  return {
    user_id: user.id,
    username: user.username,
    scheduleType: user.work_schedule_type || 'office_8h',
    scheduleLabel: getScheduleLabel(user),
    cycleWorkDays: workDays,
    cycleRestDays: cycleRestDays,
    dailyWorkHours: getExpectedHours(user),
    from: fromStr,
    to: toStr,
    scheduledWorkDays,
    presentDays,
    absentDays,
    restDays,
    paidLeaveDays,
    unpaidLeaveDays,
    paidLeaveHours: Math.round(paidLeaveHours * 100) / 100,
    unpaidLeaveHours: Math.round(unpaidLeaveHours * 100) / 100,
    unscheduledWorkDays,
    totalWorkedHours: Math.round(totalWorkedHours * 100) / 100,
    totalBillableHours: Math.round(totalBillableHours * 100) / 100,
    totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
    attendanceRate:
      scheduledWorkDays > 0
        ? Math.round((presentDays / scheduledWorkDays) * 1000) / 10
        : 0,
    daily,
  };
}

function monthRange(year, month) {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

module.exports = {
  getScheduleLabel,
  getCycleConfig,
  getScheduleForDate,
  evaluateDay,
  buildCalendarMonth,
  summarizePeriod,
  monthRange,
  workedHoursFromRecord,
  parseDateOnly,
  formatDateOnly,
  addDays,
};
