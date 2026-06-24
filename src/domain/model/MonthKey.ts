import dayjs, { Dayjs } from "dayjs";

/** Strict 'YYYY-MM' format used for all month keys in the domain. */
const MONTH_FORMAT = "YYYY-MM";
// Captures year/month so the month range (01-12) can be validated explicitly —
// dayjs's native Date parsing (no customParseFormat plugin) silently rolls
// over out-of-range months (e.g. "2026-13" -> 2027-01) instead of rejecting them.
const MONTH_KEY_PATTERN = /^(\d{4})-(\d{2})$/;

/**
 * Value object wrapping a 'YYYY-MM' month key.
 *
 * Represents a calendar month with no day/time component. Used throughout
 * the domain for carry-forward line items and the projection timeline.
 */
export class MonthKey {
  private readonly date: Dayjs;

  private constructor(date: Dayjs) {
    this.date = date.startOf("month");
  }

  /** Parses a strict 'YYYY-MM' string into a MonthKey. Throws on invalid input. */
  static parse(value: string): MonthKey {
    const match = MONTH_KEY_PATTERN.exec(value);
    if (!match) {
      throw new Error(`Invalid month key: "${value}". Expected format 'YYYY-MM'.`);
    }

    const month = Number(match[2]);
    if (month < 1 || month > 12) {
      throw new Error(`Invalid month key: "${value}". Expected format 'YYYY-MM'.`);
    }

    const parsed = dayjs(value);
    if (!parsed.isValid()) {
      throw new Error(`Invalid month key: "${value}". Expected format 'YYYY-MM'.`);
    }
    return new MonthKey(parsed);
  }

  /** Returns the MonthKey for the current month. */
  static current(): MonthKey {
    return new MonthKey(dayjs());
  }

  /**
   * Accepts either a MonthKey or a raw 'YYYY-MM' string and normalizes it
   * to a MonthKey instance.
   */
  static from(value: MonthKey | string): MonthKey {
    return value instanceof MonthKey ? value : MonthKey.parse(value);
  }

  toString(): string {
    return this.date.format(MONTH_FORMAT);
  }

  isBefore(other: MonthKey): boolean {
    return this.date.isBefore(other.date);
  }

  isAfter(other: MonthKey): boolean {
    return this.date.isAfter(other.date);
  }

  isSameOrBefore(other: MonthKey): boolean {
    return !this.isAfter(other);
  }

  isSameOrAfter(other: MonthKey): boolean {
    return !this.isBefore(other);
  }

  /** Returns a new MonthKey shifted by `months` (negative shifts backward). */
  shift(months: number): MonthKey {
    return new MonthKey(this.date.add(months, "month"));
  }

  /** Number of months from `other` to `this` (this - other). */
  diffInMonths(other: MonthKey): number {
    return this.date.diff(other.date, "month");
  }
}
