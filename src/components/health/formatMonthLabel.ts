// Thai abbreviated month names, indexed by the 2-digit month number ('01'-'12').
// A plain lookup (rather than a dayjs Thai locale plugin) keeps this simple
// and sidesteps any Buddhist-era year ambiguity — the year shown is always
// Gregorian, by deliberate choice.
const THAI_ABBREVIATED_MONTHS: Record<string, string> = {
  "01": "ม.ค.",
  "02": "ก.พ.",
  "03": "มี.ค.",
  "04": "เม.ย.",
  "05": "พ.ค.",
  "06": "มิ.ย.",
  "07": "ก.ค.",
  "08": "ส.ค.",
  "09": "ก.ย.",
  "10": "ต.ค.",
  "11": "พ.ย.",
  "12": "ธ.ค.",
};

/**
 * Formats a 'YYYY-MM' month key into a Thai abbreviated-month + Gregorian
 * year label, e.g. '2026-06' -> 'มิ.ย. 2026'.
 */
export function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split("-");
  const thaiMonth = THAI_ABBREVIATED_MONTHS[monthNumber] ?? monthNumber;
  return `${thaiMonth} ${year}`;
}
