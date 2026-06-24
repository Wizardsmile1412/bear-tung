import { MonthKey } from "./MonthKey";

export type LineItemCategory = "income" | "expense" | "debt";

export interface LineItemChange {
  effectiveFrom: string; // 'YYYY-MM'
  amount: number; // amount per month, >= 0
}

export interface LineItemData {
  id: string;
  category: LineItemCategory;
  subCategory: string;
  label: string;
  changes: LineItemChange[];
  endMonth?: string; // 'YYYY-MM', debts only; absent/undefined = open-ended
}

/**
 * Entity for one income/expense/debt line, carrying its own carry-forward
 * history (`changes`) and, for debts, an optional `endMonth`.
 *
 * The carry-forward rule is a step function: the amount in effect for a
 * given month is the amount of the latest change whose `effectiveFrom` is
 * on or before that month.
 */
export class LineItem {
  private readonly data: LineItemData;

  private constructor(data: LineItemData) {
    this.data = data;
  }

  /** Validates and normalizes raw data into a LineItem (changes sorted ascending). */
  private static createInternal(data: LineItemData): LineItem {
    if (!data.changes || data.changes.length === 0) {
      throw new Error(`LineItem "${data.id}" must have at least one change.`);
    }

    const sortedChanges = [...data.changes].sort((a, b) =>
      MonthKey.parse(a.effectiveFrom).diffInMonths(MonthKey.parse(b.effectiveFrom)),
    );

    return new LineItem({
      id: data.id,
      category: data.category,
      subCategory: data.subCategory,
      label: data.label,
      changes: sortedChanges.map((change) => ({ ...change })),
      endMonth: data.endMonth,
    });
  }

  /** Creates a new LineItem from raw data, validating and sorting changes. */
  static create(data: LineItemData): LineItem {
    return LineItem.createInternal(data);
  }

  static fromJSON(data: LineItemData): LineItem {
    return LineItem.createInternal(data);
  }

  get id(): string {
    return this.data.id;
  }

  get category(): LineItemCategory {
    return this.data.category;
  }

  get subCategory(): string {
    return this.data.subCategory;
  }

  get label(): string {
    return this.data.label;
  }

  get endMonth(): string | undefined {
    return this.data.endMonth;
  }

  /**
   * Carry-forward step function: the amount in effect for `month`.
   * - 0 if `month` is before the first change.
   * - 0 if an `endMonth` is set and `month` is after it (the end month
   *   itself is still active — "last month still paying").
   * - otherwise, the amount of the latest change with `effectiveFrom <= month`.
   */
  amountAt(month: string | MonthKey): number {
    const target = MonthKey.from(month);

    if (this.data.endMonth) {
      const end = MonthKey.parse(this.data.endMonth);
      if (target.isAfter(end)) {
        return 0;
      }
    }

    let latest: LineItemChange | undefined;
    for (const change of this.data.changes) {
      const effectiveFrom = MonthKey.parse(change.effectiveFrom);
      if (effectiveFrom.isSameOrBefore(target)) {
        latest = change;
      } else {
        break; // changes are sorted ascending; no later candidate can match
      }
    }

    return latest ? latest.amount : 0;
  }

  /** Plain serializable data (defensive copy). */
  toJSON(): LineItemData {
    return {
      id: this.data.id,
      category: this.data.category,
      subCategory: this.data.subCategory,
      label: this.data.label,
      changes: this.data.changes.map((change) => ({ ...change })),
      endMonth: this.data.endMonth,
    };
  }
}
