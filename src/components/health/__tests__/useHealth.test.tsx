import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LineItem } from "@/domain/model/LineItem";
import { MonthKey } from "@/domain/model/MonthKey";
import { ProfileProvider } from "@/components/profile/ProfileProvider";
import { useProfile } from "@/components/profile/useProfile";

import { useHealth } from "../useHealth";

function TestConsumer({ month }: { month?: string } = {}) {
  const { profile, addItem, updateAssets } = useProfile();
  const { isLoaded, month: resolvedMonth, totals, score, light, results } = useHealth(month);

  return (
    <div>
      <span data-testid="loaded">{String(isLoaded)}</span>
      <span data-testid="month">{resolvedMonth}</span>
      <span data-testid="income">{totals.totalIncome}</span>
      <span data-testid="expense">{totals.totalExpense}</span>
      <span data-testid="debt">{totals.totalDebt}</span>
      <span data-testid="remaining">{totals.remainingCashFlow}</span>
      <span data-testid="score">{score}</span>
      <span data-testid="light">{light}</span>
      <span data-testid="result-count">{results.length}</span>
      <button
        onClick={() => {
          addItem(
            LineItem.create({
              id: "income-1",
              category: "income",
              subCategory: "salary",
              label: "Salary",
              changes: [{ effectiveFrom: profile.startMonth, amount: 40000 }],
            }),
          );
          addItem(
            LineItem.create({
              id: "expense-1",
              category: "expense",
              subCategory: "food",
              label: "Food",
              changes: [{ effectiveFrom: profile.startMonth, amount: 10000 }],
            }),
          );
          addItem(
            LineItem.create({
              id: "debt-1",
              category: "debt",
              subCategory: "carLoan",
              label: "Car loan",
              changes: [{ effectiveFrom: profile.startMonth, amount: 5000 }],
            }),
          );
          updateAssets({ savings: 90000 });
        }}
      >
        seed
      </button>
    </div>
  );
}

describe("useHealth", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with all-zero totals and a score for an empty profile", () => {
    render(
      <ProfileProvider>
        <TestConsumer />
      </ProfileProvider>,
    );

    expect(screen.getByTestId("loaded").textContent).toBe("true");
    expect(screen.getByTestId("income").textContent).toBe("0");
    expect(screen.getByTestId("expense").textContent).toBe("0");
    expect(screen.getByTestId("debt").textContent).toBe("0");
    expect(screen.getByTestId("remaining").textContent).toBe("0");
    expect(screen.getByTestId("result-count").textContent).toBe("3");
  });

  it("evaluates a known fixed profile to a consistent score/light/results", async () => {
    render(
      <ProfileProvider>
        <TestConsumer />
      </ProfileProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "seed" }));

    // income 40000, expense 10000, debt 5000, savings 90000
    // savingsRate = (40000-10000-5000)/40000 = 0.625 -> score 100
    // dsr = 5000/40000 = 0.125 -> score 100
    // emergencyFund = 90000/(10000+5000) = 6 months -> score 100
    // health score = round(0.35*100 + 0.35*100 + 0.30*100) = 100
    expect(screen.getByTestId("income").textContent).toBe("40000");
    expect(screen.getByTestId("expense").textContent).toBe("10000");
    expect(screen.getByTestId("debt").textContent).toBe("5000");
    expect(screen.getByTestId("remaining").textContent).toBe("25000");
    expect(screen.getByTestId("score").textContent).toBe("100");
    expect(screen.getByTestId("light").textContent).toBe("green");
    expect(screen.getByTestId("result-count").textContent).toBe("3");
  });

  it("uses profile.startMonth by default, and an explicit month argument changes the result", async () => {
    function ExplicitMonthHarness() {
      const { profile, addItem } = useProfile();
      const futureMonth = MonthKey.parse(profile.startMonth).shift(3).toString();

      const defaultHealth = useHealth();
      const futureHealth = useHealth(futureMonth);

      return (
        <div>
          <span data-testid="default-month">{defaultHealth.month}</span>
          <span data-testid="default-income">{defaultHealth.totals.totalIncome}</span>
          <span data-testid="future-month">{futureHealth.month}</span>
          <span data-testid="future-income">{futureHealth.totals.totalIncome}</span>
          <button
            onClick={() =>
              addItem(
                LineItem.create({
                  id: "income-raise",
                  category: "income",
                  subCategory: "salary",
                  label: "Salary",
                  changes: [
                    { effectiveFrom: profile.startMonth, amount: 30000 },
                    { effectiveFrom: futureMonth, amount: 50000 },
                  ],
                }),
              )
            }
          >
            seed-raise
          </button>
        </div>
      );
    }

    render(
      <ProfileProvider>
        <ExplicitMonthHarness />
      </ProfileProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "seed-raise" }));

    // Default (no `month` arg) resolves to `profile.startMonth` -> pre-raise amount.
    expect(screen.getByTestId("default-income").textContent).toBe("30000");
    // Explicit future month resolves to that month -> post-raise amount.
    expect(screen.getByTestId("future-income").textContent).toBe("50000");
    expect(screen.getByTestId("default-month").textContent).not.toBe(
      screen.getByTestId("future-month").textContent,
    );
  });
});
