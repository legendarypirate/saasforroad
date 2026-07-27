/**
 * Shared active-flag check for tenant company users.
 * DB column `users.is_active` is STRING ("1" / "0"); older rows may be null/empty.
 * Must stay in sync with zam admin `isUserActive` (user page).
 */
function isUserActive(value) {
  if (value === undefined || value === null || value === "") return true;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "1" || v === "true" || v === "yes" || v === "active") return true;
    if (v === "0" || v === "false" || v === "no" || v === "inactive") return false;
    return false;
  }
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  return false;
}

function isUserInactive(value) {
  return !isUserActive(value);
}

module.exports = { isUserActive, isUserInactive };
