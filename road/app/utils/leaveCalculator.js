function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function parseInstant(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dateInRange(dateStr, startStr, endStr) {
  return dateStr >= startStr && dateStr <= endStr;
}

function findApprovedLeaveForDate(approvedLeaves, dateStr) {
  if (!approvedLeaves?.length) return null;
  return (
    approvedLeaves.find((leave) => {
      if (leave.status !== "approved") return false;
      if (leave.start_at && leave.end_at) {
        const startDate = String(leave.start_at).slice(0, 10);
        const endDate = String(leave.end_at).slice(0, 10);
        return dateInRange(dateStr, startDate, endDate);
      }
      return dateInRange(dateStr, leave.start_date, leave.end_date);
    }) || null
  );
}

function getDayBounds(dateStr) {
  return {
    start: new Date(`${dateStr}T00:00:00`),
    end: new Date(`${dateStr}T23:59:59.999`),
  };
}

function computeHoursBetween(startAt, endAt) {
  const start = parseInstant(startAt);
  const end = parseInstant(endAt);
  if (!start || !end || end <= start) return 0;
  return round2((end.getTime() - start.getTime()) / 3600000);
}

function getLeaveHoursForDay(user, dateStr, leave, exceptions = []) {
  const { getScheduleForDate } = require("./attendanceCalculator");
  const schedule = getScheduleForDate(user, dateStr, exceptions);
  if (!schedule.isWorkDay) return 0;

  if (leave.start_at && leave.end_at) {
    const leaveStart = parseInstant(leave.start_at);
    const leaveEnd = parseInstant(leave.end_at);
    const { start: dayStart, end: dayEnd } = getDayBounds(dateStr);
    const overlapStart = Math.max(dayStart.getTime(), leaveStart.getTime());
    const overlapEnd = Math.min(dayEnd.getTime(), leaveEnd.getTime());
    if (overlapEnd <= overlapStart) return 0;
    return round2((overlapEnd - overlapStart) / 3600000);
  }

  if (
    leave.start_date === leave.end_date &&
    leave.hours !== undefined &&
    leave.hours !== null &&
    leave.hours !== ""
  ) {
    const partial = Number(leave.hours) || 0;
    return Math.min(partial, schedule.expectedHours);
  }

  return schedule.expectedHours;
}

function computeLeaveTotalHours(user, leave, exceptions = []) {
  if (leave.start_at && leave.end_at) {
    return computeHoursBetween(leave.start_at, leave.end_at);
  }

  const {
    parseDateOnly,
    formatDateOnly,
    addDays,
  } = require("./attendanceCalculator");

  const start = parseDateOnly(leave.start_date);
  const end = parseDateOnly(leave.end_date);
  if (!start || !end || end < start) return 0;

  let total = 0;
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    const dateStr = formatDateOnly(d);
    total += getLeaveHoursForDay(user, dateStr, leave, exceptions);
  }
  return round2(total);
}

function groupApprovedLeavesByUser(rows) {
  const grouped = {};
  rows.forEach((row) => {
    if (!grouped[row.user_id]) grouped[row.user_id] = [];
    grouped[row.user_id].push(row);
  });
  return grouped;
}

module.exports = {
  dateInRange,
  findApprovedLeaveForDate,
  getLeaveHoursForDay,
  computeLeaveTotalHours,
  computeHoursBetween,
  groupApprovedLeavesByUser,
  parseInstant,
};
