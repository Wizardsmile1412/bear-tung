"use client";

import { useState } from "react";

import { Money } from "@/domain/model/Money";
import { NumericField } from "@/components/ui/NumericField";

interface SavingsCardProps {
  savings: number;
  onChange(savings: number): void;
}

const primaryButton =
  "inline-flex h-11 items-center justify-center rounded-button bg-primary px-5 text-base font-semibold text-white transition-colors hover:bg-primary-hover active:scale-[0.98] focus:outline-none focus:ring-3 focus:ring-primary-soft";
const secondaryButton =
  "inline-flex h-11 items-center justify-center rounded-button border border-outline bg-surface px-5 text-base font-semibold text-ink transition-colors hover:bg-surface-sunken active:scale-[0.98] focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary-soft";

/** Single-field card for cumulative savings/cash on hand, with explicit edit/save. */
export function SavingsCard({ savings, onChange }: SavingsCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(savings);

  function startEditing() {
    setDraft(savings);
    setIsEditing(true);
  }

  function save() {
    onChange(draft);
    setIsEditing(false);
  }

  function cancel() {
    setIsEditing(false);
  }

  return (
    <section className="rounded-card border border-outline border-l-4 border-l-primary bg-primary-soft p-6 shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-primary text-white">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden
          >
            {/* shield: savings kept safe */}
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </span>
        <h2 className="text-xl font-semibold text-ink">เงินออมสะสม</h2>
      </div>

      {isEditing ? (
        <div className="mt-4 flex flex-col gap-3">
          <label htmlFor="savings" className="text-sm font-medium text-ink-muted">
            เงินออม/เงินสดที่มีอยู่ตอนนี้
          </label>
          <div className="flex items-center gap-2">
            <NumericField
              id="savings"
              inputMode="decimal"
              value={draft}
              onChange={(value) => setDraft(value)}
              className="w-full rounded-input border border-outline bg-surface px-4 py-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary-soft"
            />
            <span className="text-xs text-ink-subtle whitespace-nowrap">บาท</span>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={save} className={primaryButton}>
              บันทึก
            </button>
            <button type="button" onClick={cancel} className={secondaryButton}>
              ยกเลิก
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink-muted">เงินออม/เงินสดที่มีอยู่ตอนนี้</p>
            <p className="mt-1 text-2xl font-bold text-ink tabular-nums">{Money.formatWithUnit(savings)}</p>
          </div>
          <button type="button" onClick={startEditing} className={secondaryButton}>
            แก้ไข
          </button>
        </div>
      )}
    </section>
  );
}
