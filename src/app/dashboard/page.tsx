"use client";

import Link from "next/link";

import { useProfile } from "@/components/profile/useProfile";
import { useHealth } from "@/components/health/useHealth";
import { RatioCard } from "@/components/health/RatioCard";
import { ScoreGauge } from "@/components/health/ScoreGauge";
import { ComparisonBarChart } from "@/components/charts/ComparisonBarChart";
import { ExpenseDonutChart } from "@/components/charts/ExpenseDonutChart";
import { subCategoryLabel } from "@/components/cashflow/subCategoryPresets";

export default function DashboardPage() {
  const { profile, isLoaded } = useProfile();
  const { month, totals, score, light, results } = useHealth();

  if (!isLoaded) {
    return null;
  }

  // Mirrors the precedent in CategoryGroupCard: per-category subtotal
  // grouping is computed inline in the UI layer, not pushed into the domain.
  const expenseBySubCategory = new Map<string, number>();
  for (const item of profile.items) {
    if (item.category !== "expense") {
      continue;
    }
    const current = expenseBySubCategory.get(item.subCategory) ?? 0;
    expenseBySubCategory.set(item.subCategory, current + item.amountAt(month));
  }
  const expenseData = Array.from(expenseBySubCategory.entries()).map(([subCategory, value]) => ({
    label: subCategoryLabel("expense", subCategory),
    value,
  }));

  return (
    <main className="mx-auto flex w-full max-w-[772px] flex-col gap-8 px-6 py-8">
      <header>
        <h1 className="text-3xl font-bold text-ink">สุขภาพการเงินของคุณ</h1>
        <p className="mt-1 text-base text-ink-muted">
          ดูคะแนนสุขภาพการเงิน อัตราส่วนสำคัญ และภาพรวมรายรับ-รายจ่าย
        </p>
        <Link href="/cashflow" className="mt-2 inline-block text-sm font-medium text-primary hover:text-primary-hover">
          ← กลับไปกรอก Cash Flow
        </Link>
      </header>

      {profile.items.length === 0 ? (
        <div className="rounded-card border border-dashed border-outline bg-surface px-6 py-12 text-center">
          <p className="text-base text-ink-muted">ยังไม่มีข้อมูล — เริ่มกรอก Cash Flow ของคุณ</p>
          <Link
            href="/cashflow"
            className="mt-4 inline-flex h-12 items-center justify-center rounded-[12px] bg-primary px-6 text-base font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            เริ่มกรอก Cash Flow
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <section className="rounded-card border border-outline bg-surface p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            <ScoreGauge score={score} light={light} />
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {results.map((result) => (
              <RatioCard key={result.key} result={result} />
            ))}
          </section>

          <section className="rounded-card border border-outline bg-surface p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            <h2 className="text-xl font-semibold text-ink">รายจ่ายแบ่งตามหมวด</h2>
            <div className="mt-4">
              <ExpenseDonutChart data={expenseData} />
            </div>
          </section>

          <section className="rounded-card border border-outline bg-surface p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            <h2 className="text-xl font-semibold text-ink">เปรียบเทียบรายรับ-รายจ่าย-หนี้สิน</h2>
            <div className="mt-4">
              <ComparisonBarChart
                income={totals.totalIncome}
                expense={totals.totalExpense}
                debt={totals.totalDebt}
                remaining={totals.remainingCashFlow}
              />
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
