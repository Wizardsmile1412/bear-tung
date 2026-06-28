"use client";

import { useState } from "react";

import { Money } from "@/domain/model/Money";
import { LineItem, LineItemCategory } from "@/domain/model/LineItem";
import { formatMonthLabel } from "@/components/health/formatMonthLabel";

import { AddLineItemForm } from "./AddLineItemForm";
import { subCategoryLabel } from "./subCategoryPresets";

interface LineItemRowProps {
  item: LineItem;
  amount: number;
  category: LineItemCategory;
  startMonth: string;
  onDelete(id: string): void;
  onUpdate(id: string, item: LineItem): void;
}

/** One line item row inside a CategoryGroupCard: label, sub-category, end month (debt only), amount, edit, delete. */
export function LineItemRow({ item, amount, category, startMonth, onDelete, onUpdate }: LineItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <li className="py-3 border-b border-outline last:border-b-0">
        <AddLineItemForm
          category={category}
          startMonth={startMonth}
          initialItem={item}
          onAdd={(updated) => {
            onUpdate(item.id, updated);
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 py-3 border-b border-outline last:border-b-0">
      <div className="flex flex-col">
        <span className="text-base font-medium text-ink">{item.label}</span>
        <span className="text-xs text-ink-subtle">{subCategoryLabel(item.category, item.subCategory)}</span>
        {item.endMonth && (
          <span className="text-xs text-ink-subtle">ผ่อนหมดเดือน {formatMonthLabel(item.endMonth)}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-base font-semibold text-ink tabular-nums">{Money.formatWithUnit(amount)}</span>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label={`แก้ไข ${item.label}`}
          className="flex h-11 items-center justify-center rounded-card px-3 text-sm font-medium text-ink-subtle hover:bg-surface-sunken hover:text-primary transition-colors"
        >
          แก้ไข
        </button>
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
