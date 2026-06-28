"use client";

import { useState } from "react";
import Link from "next/link";

import { useProfile } from "@/components/profile/useProfile";
import { useProjectionSeries } from "@/components/health/useProjectionSeries";
import { formatMonthLabel } from "@/components/health/formatMonthLabel";
import { MonthSlider } from "@/components/health/MonthSlider";
import { RatioCard } from "@/components/health/RatioCard";
import { ScoreGauge } from "@/components/health/ScoreGauge";
import { ComparisonBarChart } from "@/components/charts/ComparisonBarChart";
import { ExpenseDonutChart } from "@/components/charts/ExpenseDonutChart";
import { ScoreTrendChart } from "@/components/charts/ScoreTrendChart";
import { subCategoryLabel } from "@/components/cashflow/subCategoryPresets";
import { ExportButton } from "@/components/export/ExportButton";
import { useExport } from "@/components/export/useExport";
import { NavButtonLink } from "@/components/ui/NavButtonLink";

export default function DashboardPage() {
  const { profile, isLoaded: profileLoaded } = useProfile();
  const { series, isLoaded: seriesLoaded } = useProjectionSeries();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { exportToExcel } = useExport();

  if (!profileLoaded || !seriesLoaded) {
    return null;
  }

  const selectedEntry = series[selectedIndex];

  // Mirrors the precedent in CategoryGroupCard: per-category subtotal
  // grouping is computed inline in the UI layer, not pushed into the domain.
  const expenseBySubCategory = new Map<string, number>();
  for (const item of profile.items) {
    if (item.category !== "expense") {
      continue;
    }
    const current = expenseBySubCategory.get(item.subCategory) ?? 0;
    expenseBySubCategory.set(item.subCategory, current + item.amountAt(selectedEntry.month));
  }
  const expenseData = Array.from(expenseBySubCategory.entries()).map(([subCategory, value]) => ({
    label: subCategoryLabel("expense", subCategory),
    value,
  }));

  const trendData = series.map((entry) => ({
    month: entry.month,
    monthLabel: formatMonthLabel(entry.month),
    score: entry.score,
  }));

  return (
    <main className="mx-auto flex w-full max-w-[772px] lg:max-w-[1080px] flex-col gap-8 px-6 py-8">
      <header>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ink">สุขภาพการเงินของคุณ</h1>
            <p className="mt-1 text-base text-ink-muted">
              ดูคะแนนสุขภาพการเงิน อัตราส่วนสำคัญ และภาพรวมรายรับ-รายจ่าย
            </p>
          </div>
          {profile.items.length > 0 && <ExportButton onClick={exportToExcel} />}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <NavButtonLink href="/cashflow" variant="secondary" arrow="left">
            กลับไปกรอก Cash Flow
          </NavButtonLink>
          <NavButtonLink href="/mortgage" variant="primary" arrow="right">
            ประเมินสินเชื่อบ้าน
          </NavButtonLink>
        </div>
      </header>

      {profile.items.length === 0 ? (
        <div className="rounded-card border border-dashed border-outline bg-surface px-6 py-12 text-center">
          <p className="text-base text-ink-muted">ยังไม่มีข้อมูล — เริ่มกรอก Cash Flow ของคุณ</p>
          <Link
            href="/cashflow"
            className="mt-4 inline-flex h-12 items-center justify-center rounded-button bg-primary px-6 text-base font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            เริ่มกรอก Cash Flow
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <MonthSlider
            months={series.map((entry) => entry.month)}
            selectedIndex={selectedIndex}
            onChange={setSelectedIndex}
          />

          <section className="rounded-card border border-outline bg-surface p-6 shadow-card">
            <h2 className="text-xl font-semibold text-ink">แนวโน้มคะแนนสุขภาพการเงิน 5 ปี</h2>
            <div className="mt-4">
              <ScoreTrendChart data={trendData} selectedMonth={selectedEntry.month} />
            </div>
          </section>

          <section className="rounded-card border border-outline bg-surface p-6 shadow-card">
            <ScoreGauge score={selectedEntry.score} light={selectedEntry.light} />
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selectedEntry.ratioResults.map((result) => (
              <RatioCard key={result.key} result={result} />
            ))}
          </section>

          <section className="rounded-card border border-outline bg-surface p-6 shadow-card">
            <h2 className="text-xl font-semibold text-ink">รายจ่ายแบ่งตามหมวด</h2>
            <div className="mt-4">
              <ExpenseDonutChart data={expenseData} />
            </div>
          </section>

          <section className="rounded-card border border-outline bg-surface p-6 shadow-card">
            <h2 className="text-xl font-semibold text-ink">เปรียบเทียบรายรับ-รายจ่าย-หนี้สิน</h2>
            <div className="mt-4">
              <ComparisonBarChart
                income={selectedEntry.totalIncome}
                expense={selectedEntry.totalExpense}
                debt={selectedEntry.totalDebt}
                remaining={selectedEntry.remainingCashFlow}
              />
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
