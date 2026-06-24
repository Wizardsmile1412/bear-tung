"use client";

import Link from "next/link";

import { useProfile } from "@/components/profile/useProfile";
import { CategoryGroupCard } from "@/components/cashflow/CategoryGroupCard";
import { EmptyState } from "@/components/cashflow/EmptyState";
import { SavingsCard } from "@/components/cashflow/SavingsCard";

const CATEGORIES = ["income", "expense", "debt"] as const;

export default function CashFlowPage() {
  const { profile, isLoaded, addItem, removeItem, updateAssets } = useProfile();

  if (!isLoaded) {
    return null;
  }

  const month = profile.startMonth;

  return (
    <main className="mx-auto flex w-full max-w-[772px] flex-col gap-8 px-6 py-8">
      <header>
        <h1 className="text-3xl font-bold text-ink">Cash Flow ของคุณ</h1>
        <p className="mt-1 text-base text-ink-muted">
          กรอกรายรับ รายจ่าย และหนี้สิน เพื่อดูสุขภาพการเงินของคุณ
        </p>
        <Link href="/dashboard" className="mt-2 inline-block text-sm font-medium text-primary hover:text-primary-hover">
          ดูสุขภาพการเงิน →
        </Link>
      </header>

      {profile.items.length === 0 && <EmptyState />}

      <div className="flex flex-col gap-6">
        {CATEGORIES.map((category) => (
          <CategoryGroupCard
            key={category}
            category={category}
            items={profile.items.filter((item) => item.category === category)}
            month={month}
            startMonth={profile.startMonth}
            onAdd={addItem}
            onDelete={removeItem}
          />
        ))}

        <SavingsCard
          savings={profile.assets.savings}
          onChange={(savings) => updateAssets({ savings })}
        />
      </div>
    </main>
  );
}
