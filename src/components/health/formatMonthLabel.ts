// Thai abbreviated month names in calendar order (index 0 = January).
// A plain array (rather than a dayjs Thai locale plugin) keeps this simple
// and sidesteps any Buddhist-era year ambiguity — the year shown is always
// Gregorian, by deliberate choice. Shared by `formatMonthLabel` and the
// month-grid in `MonthPicker` so the two never drift apart.
export const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
] as const;

/**
 * Formats a 'YYYY-MM' month key into a Thai abbreviated-month + Gregorian
 * year label, e.g. '2026-06' -> 'มิ.ย. 2026'.
 */
export function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split("-");
  const thaiMonth = THAI_MONTHS_SHORT[Number(monthNumber) - 1] ?? monthNumber;
  return `${thaiMonth} ${year}`;
}

/**
 * Inverse of `formatMonthLabel`: parses a Thai month label (e.g. 'มิ.ย. 2026')
 * back into a 'YYYY-MM' key, or `undefined` if it isn't a recognized label.
 * Used when importing an exported workbook's payoff-month column.
 */
export function parseMonthLabel(label: string): string | undefined {
  const [thaiMonth, year] = label.trim().split(/\s+/);
  const index = THAI_MONTHS_SHORT.indexOf(thaiMonth as (typeof THAI_MONTHS_SHORT)[number]);
  if (index < 0 || !/^\d{4}$/.test(year ?? "")) {
    return undefined;
  }
  return `${year}-${String(index + 1).padStart(2, "0")}`;
}
