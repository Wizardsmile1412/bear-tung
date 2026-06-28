import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ExcelExporter } from "@/domain/export/ExcelExporter";
import { LineItem } from "@/domain/model/LineItem";

import { ProfileProvider } from "@/components/profile/ProfileProvider";
import { useProfile } from "@/components/profile/useProfile";

import { useExport } from "../useExport";

function TestConsumer() {
  const { profile, addItem } = useProfile();
  const { exportToExcel } = useExport();

  return (
    <div>
      <span data-testid="item-count">{profile.items.length}</span>
      <button
        onClick={() =>
          addItem(
            LineItem.create({
              id: "income-1",
              category: "income",
              subCategory: "salary",
              label: "เงินเดือน",
              changes: [{ effectiveFrom: profile.startMonth, amount: 40000 }],
            }),
          )
        }
      >
        add
      </button>
      <button onClick={exportToExcel}>export</button>
    </div>
  );
}

describe("useExport", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("calls ExcelExporter.export with correctly-shaped data and a filename derived from startMonth", async () => {
    const exportSpy = vi.spyOn(ExcelExporter.prototype, "export").mockImplementation(() => undefined);

    render(
      <ProfileProvider>
        <TestConsumer />
      </ProfileProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "add" }));
    expect(screen.getByTestId("item-count").textContent).toBe("1");

    await userEvent.click(screen.getByRole("button", { name: "export" }));

    expect(exportSpy).toHaveBeenCalledTimes(1);
    const [data, fileName] = exportSpy.mock.calls[0];

    expect(fileName).toMatch(/^bear-tung-\d{4}-\d{2}\.xlsx$/);
    expect(data.cashFlow.rows).toHaveLength(1);
    expect(data.cashFlow.rows[0]).toMatchObject({
      category: "รายรับ",
      subCategory: "เงินเดือน",
      label: "เงินเดือน",
      amountPerMonth: 40000,
    });
    expect(data.cashFlow.totalIncome).toBe(40000);
    expect(data.health.rows.length).toBeGreaterThan(0);
    expect(data.projection).toHaveLength(60);
    expect(data.mortgage).toBeUndefined();

    exportSpy.mockRestore();
  });

  it("formats a debt item's endMonth into payoffMonth, and leaves it undefined for items with no endMonth", async () => {
    const exportSpy = vi.spyOn(ExcelExporter.prototype, "export").mockImplementation(() => undefined);

    function DebtConsumer() {
      const { profile, addItem } = useProfile();
      const { exportToExcel } = useExport();

      return (
        <div>
          <button
            onClick={() =>
              addItem(
                LineItem.create({
                  id: "debt-1",
                  category: "debt",
                  subCategory: "home",
                  label: "ผ่อนบ้าน",
                  changes: [{ effectiveFrom: profile.startMonth, amount: 15000 }],
                  endMonth: "2026-12",
                }),
              )
            }
          >
            add debt
          </button>
          <button onClick={exportToExcel}>export</button>
        </div>
      );
    }

    render(
      <ProfileProvider>
        <DebtConsumer />
      </ProfileProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "add debt" }));
    await userEvent.click(screen.getByRole("button", { name: "export" }));

    const [data] = exportSpy.mock.calls[0];
    const debtRow = data.cashFlow.rows.find((row) => row.label === "ผ่อนบ้าน");
    expect(debtRow?.payoffMonth).toBe("ธ.ค. 2026");

    exportSpy.mockRestore();
  });

  it("passes the mortgage data through when provided to useExport", async () => {
    const exportSpy = vi.spyOn(ExcelExporter.prototype, "export").mockImplementation(() => undefined);

    function MortgageConsumer() {
      const { exportToExcel } = useExport({
        input: {
          homePrice: 3_000_000,
          homeOrder: 1,
          borrowerAge: 30,
          interestRatePercent: 6.5,
          loanTermYears: 30,
          downPaymentAvailable: 300000,
          monthlyIncome: 40000,
          existingDebt: 0,
          dsrLimit: 0.4,
        },
        result: {
          maxLoan: 2_700_000,
          maxLoanByLtv: 3_000_000,
          maxLoanByDsr: 2_700_000,
          bindingConstraint: "dsr",
          ltvPercent: 1,
          requiredDownPayment: 0,
          affordableHomePrice: 3_000_000,
          canAffordTarget: true,
          monthlyPayment: 15000,
          dsrAfterLoan: 0.375,
          effectiveTermYears: 30,
          monthlyRate: 0.0054,
          numPayments: 360,
          ltvPolicyName: "temporary",
        },
      });
      return <button onClick={exportToExcel}>export</button>;
    }

    render(
      <ProfileProvider>
        <MortgageConsumer />
      </ProfileProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "export" }));

    expect(exportSpy).toHaveBeenCalledTimes(1);
    const [data] = exportSpy.mock.calls[0];
    expect(data.mortgage).toBeDefined();
    expect(data.mortgage?.result.maxLoan).toBe(2_700_000);

    exportSpy.mockRestore();
  });
});
