/**
 * Presentation helper for formatting money amounts (Thai locale).
 *
 * This is NOT a domain entity / value object wrapping stored data — amounts
 * stay plain `number` in the data model so it remains trivially JSON
 * serializable for local storage. Money is purely a formatting utility.
 */
export class Money {
  /** Formats a whole-baht amount with Thai-locale thousands separators. */
  static format(amount: number): string {
    return amount.toLocaleString("th-TH", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });
  }

  /** Same as `format`, with a trailing " บาท" unit suffix. */
  static formatWithUnit(amount: number): string {
    return `${Money.format(amount)} บาท`;
  }
}
