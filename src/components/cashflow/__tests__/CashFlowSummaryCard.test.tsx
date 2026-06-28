import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { CashFlowSummaryCard } from "../CashFlowSummaryCard";

const totals = (over: Partial<Parameters<typeof CashFlowSummaryCard>[0]["totals"]> = {}) => ({
  totalIncome: 75000,
  totalExpense: 5000,
  totalDebt: 3000,
  remainingCashFlow: 67000,
  ...over,
});

describe("CashFlowSummaryCard", () => {
  it("renders each category total and the remaining figure", () => {
    render(<CashFlowSummaryCard totals={totals()} />);

    expect(screen.getByText("75,000 บาท")).toBeInTheDocument();
    expect(screen.getByText("5,000 บาท")).toBeInTheDocument();
    expect(screen.getByText("3,000 บาท")).toBeInTheDocument();
    expect(screen.getByText("67,000 บาท")).toBeInTheDocument();
  });

  it("uses the good (green) tone when remaining is >= 0", () => {
    const { container } = render(<CashFlowSummaryCard totals={totals({ remainingCashFlow: 0 })} />);

    expect(screen.getByLabelText("คงเหลือเป็นบวก")).toBeInTheDocument();
    expect(container.querySelector("section")?.className).toContain("bg-good-soft");
  });

  it("uses the danger (red) tone and shows the signed figure when remaining is < 0", () => {
    const { container } = render(
      <CashFlowSummaryCard totals={totals({ totalExpense: 50000, totalDebt: 40000, remainingCashFlow: -15000 })} />,
    );

    expect(screen.getByLabelText("คงเหลือติดลบ")).toBeInTheDocument();
    expect(container.querySelector("section")?.className).toContain("bg-danger-soft");
    expect(screen.getByText("-15,000 บาท")).toBeInTheDocument();
  });
});
