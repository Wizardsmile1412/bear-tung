import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ExpenseDonutChart } from "../ExpenseDonutChart";

describe("ExpenseDonutChart", () => {
  it("renders without crashing given sample data", () => {
    render(
      <ExpenseDonutChart
        data={[
          { label: "อาหาร", value: 5000 },
          { label: "ค่าเดินทาง", value: 2000 },
        ]}
      />,
    );

    expect(screen.getByText("อาหาร")).toBeInTheDocument();
    expect(screen.getByText("ค่าเดินทาง")).toBeInTheDocument();
  });

  it("shows the fallback message instead of an empty chart when data is empty", () => {
    render(<ExpenseDonutChart data={[]} />);

    expect(screen.getByText("ไม่มีข้อมูลรายจ่าย")).toBeInTheDocument();
  });

  it("shows the fallback message when all values sum to zero", () => {
    render(
      <ExpenseDonutChart
        data={[
          { label: "อาหาร", value: 0 },
          { label: "ค่าเดินทาง", value: 0 },
        ]}
      />,
    );

    expect(screen.getByText("ไม่มีข้อมูลรายจ่าย")).toBeInTheDocument();
  });

  it("tooltip formatter shows both the baht value and the correct percentage", async () => {
    // 100 / 100 / 200 -> 25% / 25% / 50%, a hand-computable case.
    const { container } = render(
      <ExpenseDonutChart
        data={[
          { label: "A", value: 100 },
          { label: "B", value: 100 },
          { label: "C", value: 200 },
        ]}
      />,
    );

    const sectors = container.querySelectorAll(".recharts-pie-sector");
    expect(sectors).toHaveLength(3);

    await userEvent.hover(sectors[0]);
    expect(await screen.findByText("100 บาท (25%)")).toBeInTheDocument();

    await userEvent.hover(sectors[2]);
    expect(await screen.findByText("200 บาท (50%)")).toBeInTheDocument();
  });
});
