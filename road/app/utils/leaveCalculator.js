function dateInRange(dateStr, startStr, endStr) {
  return dateStr >= startStr && dateStr <= endStr;
}

function findApprovedLeaveForDate(approvedLeaves, dateStr) {
  if (!approvedLeaves?.length) return null;
  return (
    approvedLeaves.find(
      (leave) =>
        leave.status === "approved" &&
        dateInRange(dateStr, leave.start_date, leave.end_date)
    ) || null
  );
}

function getLeaveHoursForDay(user, dateStr, leave, exceptions = []) {
  const { getScheduleForDate } = require("./attendanceCalculator");
  const schedule = getScheduleForDate(user, dateStr, exceptions);
  if (!schedule.isWorkDay) return 0;

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
  return Math.round(total * 100) / 100;
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
  groupApprovedLeavesByUser,
};
