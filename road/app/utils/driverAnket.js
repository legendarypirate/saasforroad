/**
 * Driver anket completeness — used to gate job applications.
 * Apply requires anket_percent >= ANKET_APPLY_THRESHOLD.
 */

const ANKET_APPLY_THRESHOLD = 80;

/** Fields counted toward anket %. Order matches mobile form. */
const ANKET_FIELDS = [
  "full_name",
  "phone",
  "email",
  "gender",
  "birth_date",
  "register_number",
  "province",
  "location",
  "desired_role",
  "experience_years",
  "education_level",
  "license_category",
  "vehicle_label",
  "plate_number",
  "about",
  "salary_expect",
];

function isFilled(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

function computeAnket(user) {
  const row = user?.toJSON ? user.toJSON() : user || {};
  const filled = [];
  const missing = [];
  for (const key of ANKET_FIELDS) {
    if (isFilled(row[key])) filled.push(key);
    else missing.push(key);
  }
  const total = ANKET_FIELDS.length;
  const percent =
    total === 0 ? 0 : Math.round((filled.length / total) * 100);
  return {
    anket_percent: percent,
    anket_filled: filled.length,
    anket_total: total,
    anket_missing: missing,
    can_apply: percent >= ANKET_APPLY_THRESHOLD,
    anket_threshold: ANKET_APPLY_THRESHOLD,
  };
}

module.exports = {
  ANKET_APPLY_THRESHOLD,
  ANKET_FIELDS,
  computeAnket,
  isFilled,
};
