import { LineItem, LineItemData } from "./LineItem";
import { MonthKey } from "./MonthKey";

export interface Assets {
  savings: number; // current savings/cash on hand, cumulative
}

export interface CashFlowProfileData {
  items: LineItemData[];
  assets: Assets;
  startMonth: string; // 'YYYY-MM', projection start month = current month
  meta: { updatedAt: string };
}

export interface MonthlyTotals {
  totalIncome: number;
  totalExpense: number;
  totalDebt: number;
  remainingCashFlow: number;
}

/**
 * Aggregate of all cash flow line items + assets for one profile.
 *
 * Immutable: every mutating method returns a *new* CashFlowProfile instance
 * rather than mutating `this`, which plays well with React state.
 */
export class CashFlowProfile {
  private readonly data: { items: LineItem[]; assets: Assets; startMonth: string; meta: { updatedAt: string } };

  private constructor(data: {
    items: LineItem[];
    assets: Assets;
    startMonth: string;
    meta: { updatedAt: string };
  }) {
    this.data = data;
  }

  /** An empty profile, starting at `startMonth` (defaults to the current month). */
  static empty(startMonth?: string): CashFlowProfile {
    return new CashFlowProfile({
      items: [],
      assets: { savings: 0 },
      startMonth: startMonth ?? MonthKey.current().toString(),
      meta: { updatedAt: new Date().toISOString() },
    });
  }

  static fromJSON(data: CashFlowProfileData): CashFlowProfile {
    return new CashFlowProfile({
      items: data.items.map((item) => LineItem.fromJSON(item)),
      assets: { ...data.assets },
      startMonth: data.startMonth,
      meta: { ...data.meta },
    });
  }

  get items(): LineItem[] {
    return [...this.data.items];
  }

  get assets(): Assets {
    return { ...this.data.assets };
  }

  get startMonth(): string {
    return this.data.startMonth;
  }

  /** Returns a new profile with `item` appended. */
  addItem(item: LineItem): CashFlowProfile {
    return new CashFlowProfile({
      ...this.data,
      items: [...this.data.items, item],
      meta: { updatedAt: new Date().toISOString() },
    });
  }

  /** Returns a new profile without the item matching `id`. */
  removeItem(id: string): CashFlowProfile {
    return new CashFlowProfile({
      ...this.data,
      items: this.data.items.filter((item) => item.id !== id),
      meta: { updatedAt: new Date().toISOString() },
    });
  }

  /** Returns a new profile with the item matching `id` replaced by `item`. */
  updateItem(id: string, item: LineItem): CashFlowProfile {
    return new CashFlowProfile({
      ...this.data,
      items: this.data.items.map((existing) => (existing.id === id ? item : existing)),
      meta: { updatedAt: new Date().toISOString() },
    });
  }

  /** Returns a new profile with `assets` merged into the current assets. */
  updateAssets(assets: Partial<Assets>): CashFlowProfile {
    return new CashFlowProfile({
      ...this.data,
      assets: { ...this.data.assets, ...assets },
      meta: { updatedAt: new Date().toISOString() },
    });
  }

  /** Per-month totals across all items, for the given month. */
  monthlyTotals(month: string | MonthKey): MonthlyTotals {
    const totalIncome = this.sumCategory("income", month);
    const totalExpense = this.sumCategory("expense", month);
    const totalDebt = this.sumCategory("debt", month);

    return {
      totalIncome,
      totalExpense,
      totalDebt,
      remainingCashFlow: totalIncome - totalExpense - totalDebt,
    };
  }

  private sumCategory(category: LineItem["category"], month: string | MonthKey): number {
    return this.data.items
      .filter((item) => item.category === category)
      .reduce((sum, item) => sum + item.amountAt(month), 0);
  }

  toJSON(): CashFlowProfileData {
    return {
      items: this.data.items.map((item) => item.toJSON()),
      assets: { ...this.data.assets },
      startMonth: this.data.startMonth,
      meta: { ...this.data.meta },
    };
  }
}
