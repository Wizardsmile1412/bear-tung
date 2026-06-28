"use client";

import { NavButtonLink } from "@/components/ui/NavButtonLink";
import { useProfile } from "@/components/profile/useProfile";
import { CashFlowSummaryCard } from "@/components/cashflow/CashFlowSummaryCard";
import { CategoryGroupCard } from "@/components/cashflow/CategoryGroupCard";
import { EmptyState } from "@/components/cashflow/EmptyState";
import { ResetButton } from "@/components/cashflow/ResetButton";
import { SavingsCard } from "@/components/cashflow/SavingsCard";

const CATEGORIES = ["income", "expense", "debt"] as const;

export default function CashFlowPage() {
  const { profile, isLoaded, addItem, removeItem, updateItem, updateAssets, reset } = useProfile();

  if (!isLoaded) {
    return null;
  }

  const month = profile.startMonth;
  const hasItems = profile.items.length > 0;
  const hasData = hasItems || profile.assets.savings > 0;

  return (
    <main className="mx-auto flex w-full max-w-[772px] lg:max-w-[1080px] flex-col gap-8 px-6 py-8">
      <header>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ink">Cash Flow ของคุณ</h1>
            <p className="mt-1 text-base text-ink-muted">
              กรอกรายรับ รายจ่าย และหนี้สิน เพื่อดูสุขภาพการเงินของคุณ
            </p>
          </div>
          {hasData && <ResetButton onReset={reset} />}
        </div>
        <div className="mt-4">
          <NavButtonLink href="/dashboard" variant="primary" arrow="right">
            ดูสุขภาพการเงิน
          </NavButtonLink>
        </div>
      </header>

      {hasItems && <CashFlowSummaryCard totals={profile.monthlyTotals(month)} />}

      {!hasItems && <EmptyState />}

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
            onUpdate={updateItem}
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
