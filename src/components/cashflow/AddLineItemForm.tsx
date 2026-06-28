"use client";

import { useState } from "react";

import { LineItem, LineItemCategory } from "@/domain/model/LineItem";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { NumericField } from "@/components/ui/NumericField";

import { SUB_CATEGORY_PRESETS, subCategoryLabel } from "./subCategoryPresets";

interface AddLineItemFormProps {
  category: LineItemCategory;
  startMonth: string;
  onAdd(item: LineItem): void;
}

/** Example placeholder for the "รายการ" field, tailored to each category. */
const LABEL_PLACEHOLDERS: Record<LineItemCategory, string> = {
  income: "เช่น เงินเดือนประจำ",
  expense: "เช่น ค่าเช่าบ้าน",
  debt: "เช่น ผ่อนรถยนต์",
};

/** Inline form for adding one new line item to a category group. */
export function AddLineItemForm({ category, startMonth, onAdd }: AddLineItemFormProps) {
  const presets = SUB_CATEGORY_PRESETS[category];
  const [label, setLabel] = useState("");
  const [subCategory, setSubCategory] = useState(presets[0].value);
  const [amount, setAmount] = useState(0);
  const [effectiveFrom, setEffectiveFrom] = useState(startMonth);
  const [endMonth, setEndMonth] = useState("");

  const isDebt = category === "debt";

  function resetForm() {
    setLabel("");
    setSubCategory(presets[0].value);
    setAmount(0);
    setEffectiveFrom(startMonth);
    setEndMonth("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!effectiveFrom) {
      return;
    }

    // รายการ is optional — fall back to the selected หมวดหมู่ name when blank
    // so the line item still reads meaningfully in the list and Excel export.
    const resolvedLabel = label.trim() || subCategoryLabel(category, subCategory);

    const item = LineItem.create({
      id: crypto.randomUUID(),
      category,
      subCategory,
      label: resolvedLabel,
      changes: [{ effectiveFrom, amount }],
      endMonth: isDebt && endMonth ? endMonth : undefined,
    });

    onAdd(item);
    resetForm();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-card bg-surface-sunken p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor={`${category}-amount`} className="text-sm font-medium text-ink-muted">
          จำนวนเงิน (บาท/เดือน)
        </label>
        <div className="flex items-center gap-2">
          <NumericField
            id={`${category}-amount`}
            inputMode="decimal"
            value={amount}
            onChange={(value) => setAmount(value)}
            placeholder="0"
            required
            className="w-full rounded-input border border-outline bg-surface px-4 py-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary-soft"
          />
          <span className="text-xs text-ink-subtle whitespace-nowrap">บาท/เดือน</span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${category}-subCategory`} className="text-sm font-medium text-ink-muted">
          หมวดหมู่
        </label>
        <select
          id={`${category}-subCategory`}
          value={subCategory}
          onChange={(event) => setSubCategory(event.target.value)}
          className="rounded-input border border-outline bg-surface px-4 py-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary-soft"
        >
          {presets.map((option) => (
            <option key={option.value} value={option.value}>
              {option.labelTh}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${category}-label`} className="text-sm font-medium text-ink-muted">
          รายการ
        </label>
        <input
          id={`${category}-label`}
          type="text"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder={LABEL_PLACEHOLDERS[category]}
          className="rounded-input border border-outline bg-surface px-4 py-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary-soft"
        />
        <p className="text-xs text-ink-subtle">ไม่บังคับ — หากเว้นว่างจะใช้ชื่อหมวดหมู่แทน</p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${category}-effectiveFrom`} className="text-sm font-medium text-ink-muted">
          เริ่มตั้งแต่เดือน
        </label>
        <MonthPicker
          id={`${category}-effectiveFrom`}
          value={effectiveFrom}
          onChange={setEffectiveFrom}
        />
      </div>

      {isDebt && (
        <div className="flex flex-col gap-1">
          <label htmlFor={`${category}-endMonth`} className="text-sm font-medium text-ink-muted">
            ผ่อนหมดเดือน (ไม่มีกำหนด หากไม่กรอก)
          </label>
          <MonthPicker
            id={`${category}-endMonth`}
            value={endMonth}
            onChange={setEndMonth}
            min={effectiveFrom}
            placeholder="ไม่มีกำหนด"
            clearable
          />
        </div>
      )}

      <button
        type="submit"
        className="h-12 rounded-button bg-primary text-base font-semibold text-white transition-colors hover:bg-primary-hover active:scale-[0.98]"
      >
        เพิ่มรายการ
      </button>
    </form>
  );
}
