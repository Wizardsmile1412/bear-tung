"use client";

import { useState } from "react";
import Image from "next/image";
import { NavButtonLink } from "@/components/ui/NavButtonLink";
import { useProfile } from "@/components/profile/useProfile";
import { CashFlowSummaryCard } from "@/components/cashflow/CashFlowSummaryCard";
import { CategoryGroupCard } from "@/components/cashflow/CategoryGroupCard";
import { EmptyState } from "@/components/cashflow/EmptyState";
import { ResetButton } from "@/components/cashflow/ResetButton";
import { SavingsCard } from "@/components/cashflow/SavingsCard";
import { ImportButton } from "@/components/import/ImportButton";
import { ImportWarningBanner } from "@/components/import/ImportWarningBanner";
import { stashImportWarnings } from "@/components/import/importWarnings";
import { ImportSummary } from "@/components/import/useImport";

const CATEGORIES = ["income", "expense", "debt"] as const;

export default function CashFlowPage() {
  const { profile, isLoaded, addItem, removeItem, updateItem, updateAssets, reset } = useProfile();

  // The profile updates in place via context after an import, but the warning
  // banner only reads its stashed warnings on mount — bump this key to remount
  // it so an in-place import on this page still surfaces any warnings.
  const [bannerKey, setBannerKey] = useState(0);

  function handleImported(summary: ImportSummary) {
    stashImportWarnings(summary.warnings);
    setBannerKey((key) => key + 1);
  }

  if (!isLoaded) {
    return null;
  }

  const month = (() => {
    if (profile.items.length === 0) return profile.startMonth;
    const minFrom = profile.items
      .map((item) => item.changes[0].effectiveFrom)
      .sort()[0];
    return minFrom > profile.startMonth ? minFrom : profile.startMonth;
  })();
  const hasItems = profile.items.length > 0;
  const hasData = hasItems || profile.assets.savings > 0;

  return (
    <>
      <div className="fixed inset-0 -z-10">
        <Image
          src="/cashflow-bg.jpg"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-white/70" />
      </div>
    <main className="mx-auto flex w-full max-w-193 lg:max-w-270 flex-col gap-8 px-6 py-8">
      <header>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ink">Cash Flow ของคุณ</h1>
            <p className="mt-1 text-base text-ink-muted">
              กรอกรายรับ รายจ่าย และหนี้สิน เพื่อดูสุขภาพการเงินของคุณ
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ImportButton confirmReplace={hasData} onImported={handleImported} />
            {hasData && <ResetButton onReset={reset} />}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <NavButtonLink href="/" variant="secondary" arrow="left">
            กลับหน้าแรก
          </NavButtonLink>
          <NavButtonLink href="/dashboard" variant="primary" arrow="right">
            ดูสุขภาพการเงิน
          </NavButtonLink>
        </div>
      </header>

      <ImportWarningBanner key={bannerKey} />

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
    </>
  );
}
