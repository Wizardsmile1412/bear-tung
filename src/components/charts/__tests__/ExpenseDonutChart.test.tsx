import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ExpenseDonutChart } from "../ExpenseDonutChart";

// Defaults to `true` (snap to final state, no animation) so the rest of
// this file's tests — which assert on synchronously-rendered sectors/
// tooltips — keep working unchanged; only the "prefers-reduced-motion"
// describe block below overrides this to specifically exercise both states.
const { usePrefersReducedMotionMock } = vi.hoisted(() => ({
  usePrefersReducedMotionMock: vi.fn(() => true),
}));
vi.mock("@/components/ui/usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: usePrefersReducedMotionMock,
}));

describe("ExpenseDonutChart", () => {
  afterEach(() => {
    usePrefersReducedMotionMock.mockReturnValue(true);
  });

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

  describe("prefers-reduced-motion", () => {
    // Same rationale as ScoreGaugeChart's tests: jsdom has no rAF-driven
    // paint loop, so an animating Pie's sectors never mount in time, while a
    // non-animating one renders its final sectors synchronously.
    it("does not render the final sector path synchronously when the user has no reduced-motion preference (animation pending)", () => {
      usePrefersReducedMotionMock.mockReturnValue(false);
      const { container } = render(
        <ExpenseDonutChart data={[{ label: "อาหาร", value: 5000 }]} />,
      );

      expect(container.querySelector(".recharts-pie-sector path")).not.toBeInTheDocument();
    });

    it("renders the final sector path synchronously when the user prefers reduced motion (snaps to final value)", () => {
      usePrefersReducedMotionMock.mockReturnValue(true);
      const { container } = render(
        <ExpenseDonutChart data={[{ label: "อาหาร", value: 5000 }]} />,
      );

      expect(container.querySelector(".recharts-pie-sector path")).toBeInTheDocument();
    });
  });
});
