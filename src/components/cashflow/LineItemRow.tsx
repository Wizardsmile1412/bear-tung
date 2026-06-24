"use client";

import { Money } from "@/domain/model/Money";
import { LineItem } from "@/domain/model/LineItem";

import { subCategoryLabel } from "./subCategoryPresets";

interface LineItemRowProps {
  item: LineItem;
  amount: number;
  onDelete(id: string): void;
}

/** One line item row inside a CategoryGroupCard: label, sub-category, amount, delete. */
export function LineItemRow({ item, amount, onDelete }: LineItemRowProps) {
  return (
    <li className="flex items-center justify-between gap-3 py-3 border-b border-outline last:border-b-0">
      <div className="flex flex-col">
        <span className="text-base font-medium text-ink">{item.label}</span>
        <span className="text-xs text-ink-subtle">{subCategoryLabel(item.category, item.subCategory)}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-base font-semibold text-ink tabular-nums">{Money.formatWithUnit(amount)}</span>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          aria-label={`ลบ ${item.label}`}
          className="flex h-11 w-11 items-center justify-center rounded-card text-ink-subtle hover:bg-surface-sunken hover:text-danger transition-colors"
        >
          ลบ
        </button>
      </div>
    </li>
  );
}
