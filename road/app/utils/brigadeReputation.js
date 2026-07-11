/**
 * Reputation score 0–100:
 * 40% review rating, 20% completed tasks, 15% completion rate,
 * 10% safety, 10% attendance, 5% response time
 */
function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Map average rating 0–5 → 0–100 */
function ratingComponent(averageRating) {
  return clamp((toNum(averageRating) / 5) * 100);
}

/** Soft cap: 50+ completed tasks ≈ full score */
function completedTasksComponent(completedTasks) {
  return clamp((toNum(completedTasks) / 50) * 100);
}

function completionRateComponent(completionRate) {
  return clamp(toNum(completionRate, 100));
}

function safetyComponent(safetyScore) {
  return clamp(toNum(safetyScore, 100));
}

function attendanceComponent(attendanceScore) {
  return clamp(toNum(attendanceScore, 100));
}

/** Faster response → higher score. 1h ≈ 100, 48h+ ≈ 0 */
function responseTimeComponent(responseTimeHours) {
  const hours = Math.max(0, toNum(responseTimeHours, 24));
  return clamp(100 - (hours / 48) * 100);
}

function calculateReputationScore(stats = {}) {
  const score =
    ratingComponent(stats.average_rating) * 0.4 +
    completedTasksComponent(stats.completed_tasks) * 0.2 +
    completionRateComponent(stats.completion_rate) * 0.15 +
    safetyComponent(stats.safety_score) * 0.1 +
    attendanceComponent(stats.attendance_score) * 0.1 +
    responseTimeComponent(stats.response_time_hours) * 0.05;

  return Math.round(clamp(score) * 100) / 100;
}

module.exports = {
  calculateReputationScore,
  ratingComponent,
  completedTasksComponent,
  completionRateComponent,
  safetyComponent,
  attendanceComponent,
  responseTimeComponent,
};
