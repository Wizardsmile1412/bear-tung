import { describe, expect, it, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PROFILE_STORAGE_KEY } from "@/domain/config/defaults";
import { CashFlowProfile } from "@/domain/model/CashFlowProfile";
import { LineItem } from "@/domain/model/LineItem";
import { ProfileProvider } from "@/components/profile/ProfileProvider";

import DashboardPage from "../page";

const START_MONTH = "2026-06";

/**
 * Seeds localStorage directly (rather than going through `useProfile`'s
 * `addItem`) so the profile is already present on the very first render —
 * mirroring how `LocalStorageProfileRepository.load()` reads real returning
 * users' data on mount.
 */
function seedProfile(): void {
  let profile = CashFlowProfile.empty(START_MONTH);
  profile = profile.addItem(
    LineItem.create({
      id: "income-1",
      category: "income",
      subCategory: "salary",
      label: "Salary",
      changes: [{ effectiveFrom: START_MONTH, amount: 40000 }],
    }),
  );
  profile = profile.addItem(
    LineItem.create({
      id: "expense-1",
      category: "expense",
      subCategory: "food",
      label: "Food",
      changes: [{ effectiveFrom: START_MONTH, amount: 10000 }],
    }),
  );
  profile = profile.addItem(
    LineItem.create({
      id: "debt-1",
      category: "debt",
      subCategory: "carLoan",
      label: "Car loan",
      changes: [{ effectiveFrom: START_MONTH, amount: 5000 }],
    }),
  );
  profile = profile.updateAssets({ savings: 90000 });

  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile.toJSON()));
}

describe("DashboardPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the empty state when there are no line items", () => {
    render(
      <ProfileProvider>
        <DashboardPage />
      </ProfileProvider>,
    );

    expect(screen.getByText("ยังไม่มีข้อมูล — เริ่มกรอก Cash Flow ของคุณ")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "เริ่มกรอก Cash Flow" })).toHaveAttribute(
      "href",
      "/cashflow",
    );
  });

  it("hides the Export Excel button in the empty state", () => {
    render(
      <ProfileProvider>
        <DashboardPage />
      </ProfileProvider>,
    );

    expect(screen.queryByRole("button", { name: /Export Excel/i })).not.toBeInTheDocument();
  });

  it("shows the Export Excel button once there is cash flow data, and clicking it doesn't throw", async () => {
    seedProfile();
    render(
      <ProfileProvider>
        <DashboardPage />
      </ProfileProvider>,
    );

    const exportButton = screen.getByRole("button", { name: /Export Excel/i });
    expect(exportButton).toBeInTheDocument();

    await expect(userEvent.click(exportButton)).resolves.not.toThrow();
  });

  it("renders the score, ratio cards, and charts for a profile with real cash flow data", () => {
    seedProfile();

    render(
      <ProfileProvider>
        <DashboardPage />
      </ProfileProvider>,
    );

    // Should NOT show the empty state.
    expect(screen.queryByText("ยังไม่มีข้อมูล — เริ่มกรอก Cash Flow ของคุณ")).not.toBeInTheDocument();

    // income 40000, expense 10000, debt 5000, savings 90000 (same fixture as
    // useHealth.test.tsx, hand-computed there):
    // savingsRate = (40000-10000-5000)/40000 = 0.625 -> score 100
    // dsr = 5000/40000 = 0.125 -> score 100
    // emergencyFund = 90000/(10000+5000) = 6 months -> score 100
    // healthScore = round(0.35*100 + 0.35*100 + 0.30*100) = 100
    //
    // Note: "100" also appears as the ScoreTrendChart's y-axis tick label
    // (domain [0, 100]), so this asserts at least one match rather than a
    // single unique one — "/ 100" (the gauge's own denominator) is the
    // disambiguating check for the gauge specifically.
    expect(screen.getAllByText("100").length).toBeGreaterThan(0);
    expect(screen.getByText("/ 100")).toBeInTheDocument();

    // 3 ratio cards, one per ratio, each showing its formatted value.
    expect(screen.getByText("63%")).toBeInTheDocument(); // savingsRate: 0.625 -> rounds to 63%
    expect(screen.getByText("13%")).toBeInTheDocument(); // dsr: 0.125 -> rounds to 13%
    expect(screen.getByText("6.0 เดือน")).toBeInTheDocument(); // emergencyFund: 90000/15000 = 6 months

    // Expense donut: only the seeded "food" sub-category, 100% of expense.
    expect(screen.getByText("อาหาร")).toBeInTheDocument();

    // Comparison bar chart section heading renders (chart itself verified
    // in ComparisonBarChart's own tests).
    expect(screen.getByText("เปรียบเทียบรายรับ-รายจ่าย-หนี้สิน")).toBeInTheDocument();
  });

  it("updates the displayed score/ratios/comparison values when the slider moves past a debt's endMonth", async () => {
    // Fixture: a car loan active for the first 3 months (Jun-Aug 2026, i.e.
    // index 0-2), then gone from Sep 2026 (index 3) onward. Hand-computed
    // expectations below (same scoring formulas as ProjectionService.test.ts
    // / HealthScoreService):
    //
    // idx0 (2026-06, loan active): income 30000, expense 15000, debt 12000,
    //   savings 20000 (starting balance).
    //   savingsRate = (30000-15000-12000)/30000 = 0.10 -> score 60
    //   dsr = 12000/30000 = 0.40 -> score 70
    //   emergencyFund = 20000/(15000+12000) = 0.7407... -> score ~22.2
    //   healthScore = round(0.35*60 + 0.35*70 + 0.30*22.22) = round(52.17) = 52 -> yellow
    //
    // Running savings while the loan is active: remainingCashFlow = 30000 -
    //   15000 - 12000 = 3000/month for idx0, idx1, idx2.
    //   savings[0]=20000, savings[1]=23000, savings[2]=26000, savings[3]=29000
    //
    // idx3 (2026-09, loan ended): income 30000, expense 15000, debt 0,
    //   savings 29000.
    //   savingsRate = (30000-15000-0)/30000 = 0.50 -> score 100
    //   dsr = 0/30000 = 0 -> score 100
    //   emergencyFund = 29000/15000 = 1.9333... -> score 44
    //   healthScore = round(0.35*100 + 0.35*100 + 0.30*44) = round(83.2) = 83 -> green
    let profile = CashFlowProfile.empty(START_MONTH);
    profile = profile.addItem(
      LineItem.create({
        id: "income-1",
        category: "income",
        subCategory: "salary",
        label: "Salary",
        changes: [{ effectiveFrom: START_MONTH, amount: 30000 }],
      }),
    );
    profile = profile.addItem(
      LineItem.create({
        id: "expense-1",
        category: "expense",
        subCategory: "food",
        label: "Food",
        changes: [{ effectiveFrom: START_MONTH, amount: 15000 }],
      }),
    );
    profile = profile.addItem(
      LineItem.create({
        id: "debt-1",
        category: "debt",
        subCategory: "carLoan",
        label: "Car loan",
        changes: [{ effectiveFrom: START_MONTH, amount: 12000 }],
        endMonth: "2026-08", // active Jun-Aug 2026 (idx 0-2), gone from idx 3 (2026-09)
      }),
    );
    profile = profile.updateAssets({ savings: 20000 });
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile.toJSON()));

    render(
      <ProfileProvider>
        <DashboardPage />
      </ProfileProvider>,
    );

    // Initial render is at index 0 (the current month): debt active.
    expect(screen.getByText("52")).toBeInTheDocument(); // health score
    expect(screen.getByText("10%")).toBeInTheDocument(); // savingsRate
    expect(screen.getByText("40%")).toBeInTheDocument(); // dsr
    expect(screen.getByText("0.7 เดือน")).toBeInTheDocument(); // emergencyFund

    // Move the slider forward 3 months via the "▶" step button, landing on
    // index 3 (2026-09) — the first month after the loan's endMonth.
    const nextButton = screen.getByRole("button", { name: "เดือนถัดไป" });
    await userEvent.click(nextButton);
    await userEvent.click(nextButton);
    await userEvent.click(nextButton);

    // The displayed month label updates too (ก.ย. = September) — it now
    // appears in both the MonthSlider and the comparison-chart heading.
    expect(screen.getAllByText("ก.ย. 2026").length).toBeGreaterThan(0);

    // Score, ratios, and comparison values now reflect the debt-free month —
    // genuinely different numbers, not just "the slider moved".
    expect(screen.queryByText("52")).not.toBeInTheDocument();
    expect(screen.getByText("83")).toBeInTheDocument(); // health score after debt ends
    expect(screen.getByText("50%")).toBeInTheDocument(); // savingsRate
    expect(screen.getByText("0%")).toBeInTheDocument(); // dsr
    expect(screen.getByText("1.9 เดือน")).toBeInTheDocument(); // emergencyFund
  });

  it("updates the expense donut chart's category breakdown when the selected month changes (selectedEntry.month -> donut wiring)", async () => {
    // Two expense sub-categories: "food" from the start month (always
    // active), and "shopping" only effective from a later month — i.e. the
    // expense breakdown genuinely differs between idx0 and a later index,
    // not just the score/ratio/bar numbers. This exercises the
    // `selectedEntry.month` -> `expenseBySubCategory` -> ExpenseDonutChart
    // wiring path specifically (the existing fixtures only ever have a
    // single constant expense category, so the donut's *category set*
    // was never previously shown to change with the slider).
    let profile = CashFlowProfile.empty(START_MONTH);
    profile = profile.addItem(
      LineItem.create({
        id: "income-1",
        category: "income",
        subCategory: "salary",
        label: "Salary",
        changes: [{ effectiveFrom: START_MONTH, amount: 30000 }],
      }),
    );
    profile = profile.addItem(
      LineItem.create({
        id: "expense-food",
        category: "expense",
        subCategory: "food",
        label: "Food",
        changes: [{ effectiveFrom: START_MONTH, amount: 10000 }],
      }),
    );
    profile = profile.addItem(
      LineItem.create({
        id: "expense-shopping",
        category: "expense",
        subCategory: "shopping",
        label: "Shopping",
        // Not effective yet at START_MONTH (2026-06) — only from 2026-09
        // (index 3) onward, so amountAt() returns 0 before that.
        changes: [{ effectiveFrom: "2026-09", amount: 4000 }],
      }),
    );
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile.toJSON()));

    render(
      <ProfileProvider>
        <DashboardPage />
      </ProfileProvider>,
    );

    // idx0 (2026-06): "shopping" is not yet effective, so its entry
    // contributes 0 — the donut's legend still lists its label (recharts
    // shows a legend entry even for a zero-value slice mixed with nonzero
    // ones), but its *tooltip value* must read 0%, proving the underlying
    // amount really is 0 at this month rather than the real 4000.
    expect(screen.getByText("อาหาร")).toBeInTheDocument();
    expect(screen.getByText("ของใช้")).toBeInTheDocument();

    const sectorsBefore = document.querySelectorAll(".recharts-pie-sector");
    expect(sectorsBefore).toHaveLength(2);
    await userEvent.hover(sectorsBefore[1]); // index 1 = "shopping" (added second)
    expect(await screen.findByText("0 บาท (0%)")).toBeInTheDocument();

    // Move forward 3 months (to idx3, 2026-09), where "shopping" becomes
    // active with a nonzero amount (4000 of a 14000 total = 29%) — proof
    // the donut's underlying data recomputed off the newly-selected month
    // (selectedEntry.month), not the initially-rendered one.
    const nextButton = screen.getByRole("button", { name: "เดือนถัดไป" });
    await userEvent.click(nextButton);
    await userEvent.click(nextButton);
    await userEvent.click(nextButton);

    expect(screen.getAllByText("ก.ย. 2026").length).toBeGreaterThan(0);

    const sectorsAfter = document.querySelectorAll(".recharts-pie-sector");
    expect(sectorsAfter).toHaveLength(2);
    await userEvent.hover(sectorsAfter[1]);
    expect(await screen.findByText("4,000 บาท (29%)")).toBeInTheDocument();
  });

  it("the range input itself also drives the displayed month (not just the step buttons)", async () => {
    let profile = CashFlowProfile.empty(START_MONTH);
    profile = profile.addItem(
      LineItem.create({
        id: "income-1",
        category: "income",
        subCategory: "salary",
        label: "Salary",
        changes: [{ effectiveFrom: START_MONTH, amount: 30000 }],
      }),
    );
    profile = profile.addItem(
      LineItem.create({
        id: "debt-1",
        category: "debt",
        subCategory: "carLoan",
        label: "Car loan",
        changes: [{ effectiveFrom: START_MONTH, amount: 12000 }],
        endMonth: "2026-08",
      }),
    );
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile.toJSON()));

    render(
      <ProfileProvider>
        <DashboardPage />
      </ProfileProvider>,
    );

    expect(screen.getAllByText("มิ.ย. 2026").length).toBeGreaterThan(0);

    const slider = screen.getByLabelText("เลือกเดือนที่ต้องการดู");
    fireEvent.change(slider, { target: { value: "3" } });

    expect(screen.getAllByText("ก.ย. 2026").length).toBeGreaterThan(0);
  });

  it("applies the responsive lg: container width and 3-column ratio-card grid classes (design.md section 4)", () => {
    seedProfile();

    const { container } = render(
      <ProfileProvider>
        <DashboardPage />
      </ProfileProvider>,
    );

    const main = container.querySelector("main");
    expect(main).toHaveClass("max-w-193", "lg:max-w-270");

    const ratioGrid = screen.getByText("อัตราการออม (Savings Rate)").closest("section");
    expect(ratioGrid).toHaveClass("grid-cols-1", "sm:grid-cols-2", "lg:grid-cols-3");
  });
});
