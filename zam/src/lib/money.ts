/** Thousand-separated money display: 4,000,000 */

export function parseMoneyInput(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  const cleaned = String(raw).replace(/,/g, '').replace(/\s/g, '').trim();
  if (!cleaned || cleaned === '-' || cleaned === '.') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Format a numeric value for display (4,000,000 or 4,000,000.5). */
export function formatMoneyGrouped(
  value: number | string | null | undefined,
  maxFractionDigits = 2,
): string {
  if (value === null || value === undefined || value === '') return '';
  const n = typeof value === 'number' ? value : parseMoneyInput(value);
  if (n === null) return '';
  return n.toLocaleString('en-US', {
    maximumFractionDigits: maxFractionDigits,
    minimumFractionDigits: 0,
  });
}

/**
 * Format while typing: keep digits/optional decimal, group integer part.
 * Allows a trailing "." while the user is entering fractions.
 */
export function formatMoneyTyping(raw: string, maxFractionDigits = 2): string {
  let s = String(raw ?? '').replace(/[^\d.]/g, '');
  const neg = String(raw ?? '').trim().startsWith('-');
  const firstDot = s.indexOf('.');
  if (firstDot !== -1) {
    s =
      s.slice(0, firstDot + 1) +
      s.slice(firstDot + 1).replace(/\./g, '');
  }
  let [intPart = '', fracPart] = s.split('.');
  intPart = intPart.replace(/^0+(?=\d)/, '');
  if (intPart === '') intPart = fracPart !== undefined ? '0' : '';
  const grouped =
    intPart === ''
      ? ''
      : Number(intPart).toLocaleString('en-US', { maximumFractionDigits: 0 });
  let out = grouped;
  if (fracPart !== undefined) {
    out += `.${fracPart.slice(0, maxFractionDigits)}`;
  }
  if (neg && out) out = `-${out}`;
  return out;
}

/** Detect money-like form fields (vs qty / % / station / ids). */
export function isMoneyFormField(key: string, label?: string): boolean {
  const k = String(key || '').toLowerCase();
  if (
    /vat_rate|interest_rate|_pct$|_share$|quantity|^qty$|_id$|^year$|version|station|productivity|capacity|stock|hours|fuel_used|power|downtime|headcount|shift_count|lane|slope|radius|width|length|thickness|elevation|northing|easting|azimuth|bearing|offset|diameter|motor_hours|quantity_liters|standard_cost_qty/.test(
      k,
    )
  ) {
    return false;
  }
  if (
    /(^|_)(amount|price|cost|salary|budget|deposit|balance|fee|payment|income|expense)(_|$)/.test(
      k,
    ) ||
    /daily_rate|hourly_rate|default_daily_rate|salary_offer|liquidated_damages|unit_price|unit_cost|standard_cost|opening_balance|planned_amount|amount_paid|committed_amount|rental_income|operator_salary|vat_amount|base_amount|budget_note/.test(
      k,
    )
  ) {
    return true;
  }
  const lab = label || '';
  if (/%/.test(lab)) return false;
  if (/[₮]/.test(lab)) return true;
  if (/(дүн|үнэ|өртөг|төсөв|цалин|төлбөр|зардал|орлого|түрээс)/i.test(lab)) {
    return true;
  }
  return false;
}
