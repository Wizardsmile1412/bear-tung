import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

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
    expect(screen.getByText("100")).toBeInTheDocument();
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
});
