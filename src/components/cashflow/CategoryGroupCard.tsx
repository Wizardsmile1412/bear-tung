"use client";

import { useState } from "react";

import { Money } from "@/domain/model/Money";
import { LineItem, LineItemCategory } from "@/domain/model/LineItem";

import { AddLineItemForm } from "./AddLineItemForm";
import { CATEGORY_LABELS } from "./subCategoryPresets";
import { LineItemRow } from "./LineItemRow";

interface CategoryGroupCardProps {
  category: LineItemCategory;
  items: LineItem[];
  month: string;
  startMonth: string;
  onAdd(item: LineItem): void;
  onDelete(id: string): void;
}

/** One category group card (income / expense / debt): list + subtotal + add form. */
export function CategoryGroupCard({
  category,
  items,
  month,
  startMonth,
  onAdd,
  onDelete,
}: CategoryGroupCardProps) {
  const [isAdding, setIsAdding] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.amountAt(month), 0);

  return (
    <section className="rounded-card border border-outline bg-surface p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink">{CATEGORY_LABELS[category]}</h2>
        <button
          type="button"
          onClick={() => setIsAdding((current) => !current)}
          className="flex h-11 items-center rounded-[12px] border border-outline px-4 text-sm font-medium text-ink hover:bg-surface-sunken transition-colors"
        >
          {isAdding ? "ปิด" : "+ เพิ่มรายการ"}
        </button>
      </div>

      {items.length > 0 ? (
        <ul className="mt-4">
          {items.map((item) => (
            <LineItemRow key={item.id} item={item} amount={item.amountAt(month)} onDelete={onDelete} />
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-ink-subtle">ยังไม่มีรายการในหมวดนี้</p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-outline pt-4">
        <span className="text-sm font-medium text-ink-muted">รวม</span>
        <span className="text-base font-semibold text-ink tabular-nums">{Money.formatWithUnit(subtotal)}</span>
      </div>

      {isAdding && (
        <div className="mt-4">
          <AddLineItemForm
            category={category}
            startMonth={startMonth}
            onAdd={(item) => {
              onAdd(item);
              setIsAdding(false);
            }}
          />
        </div>
      )}
    </section>
  );
}
