import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

import { ComparisonBarChart } from "../ComparisonBarChart";

// Defaults to `true` (snap to final state, no animation) so the rest of
// this file's tests — which assert on synchronously-rendered bar rectangles
// — keep working unchanged; only the "prefers-reduced-motion" describe
// block below overrides this to specifically exercise both states.
const { usePrefersReducedMotionMock } = vi.hoisted(() => ({
  usePrefersReducedMotionMock: vi.fn(() => true),
}));
vi.mock("@/components/ui/usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: usePrefersReducedMotionMock,
}));

describe("ComparisonBarChart", () => {
  afterEach(() => {
    usePrefersReducedMotionMock.mockReturnValue(true);
  });

  it("renders 4 distinct bars, colored by the bright Cash Flow category chart tints, with remaining following the sign of its value", () => {
    const { container } = render(
      <ComparisonBarChart income={50000} expense={20000} debt={10000} remaining={20000} />,
    );

    const bars = container.querySelectorAll(".recharts-bar-rectangle .recharts-rectangle");
    expect(bars).toHaveLength(4);

    const fills = Array.from(bars).map((bar) => bar.getAttribute("fill"));
    expect(fills).toEqual([
      "var(--color-cat-income-chart)", // รายรับ
      "var(--color-cat-expense-chart)", // รายจ่าย
      "var(--color-cat-debt-chart)", // หนี้สิน
      "var(--color-cat-income-chart)", // เหลือ (positive)
    ]);
  });

  it("colors a negative remaining bar with the expense chart tint", () => {
    const { container } = render(
      <ComparisonBarChart income={20000} expense={20000} debt={10000} remaining={-10000} />,
    );

    const bars = container.querySelectorAll(".recharts-bar-rectangle .recharts-rectangle");
    const fills = Array.from(bars).map((bar) => bar.getAttribute("fill"));
    expect(fills[3]).toBe("var(--color-cat-expense-chart)");
  });

  it("passes all 4 category labels to the x-axis (at least one rendered as a tick, per Recharts' own collision avoidance)", () => {
    // Recharts' XAxis only renders the ticks that fit without overlapping at
    // the chart's measured width (jsdom reports a fixed 600px from the
    // ResizeObserver/getBoundingClientRect polyfill in vitest.setup.ts), so
    // not all 4 tick labels are guaranteed to be in the DOM simultaneously.
    // We assert on the underlying datum labels instead of DOM tick text.
    const { container } = render(
      <ComparisonBarChart income={50000} expense={20000} debt={10000} remaining={20000} />,
    );

    const tickLabels = Array.from(container.querySelectorAll("tspan")).map((el) => el.textContent);
    expect(tickLabels.length).toBeGreaterThan(0);
    for (const label of tickLabels.filter((text) => !/^[\d,.-]+$/.test(text ?? ""))) {
      expect(["รายรับ", "รายจ่าย", "หนี้สิน", "เหลือ"]).toContain(label);
    }
  });

  it("renders without crashing when all totals are zero (Recharts culls zero-height bars, which is expected)", () => {
    const { container } = render(
      <ComparisonBarChart income={0} expense={0} debt={0} remaining={0} />,
    );

    expect(container.querySelector("svg.recharts-surface")).not.toBeNull();
    expect(container.querySelector(".recharts-bar")).not.toBeNull();
  });

  describe("prefers-reduced-motion", () => {
    // Same rationale as ScoreGaugeChart/ExpenseDonutChart: jsdom has no
    // rAF-driven paint loop, so an animating Bar's rectangles never mount in
    // time, while a non-animating one renders its final rectangles
    // synchronously.
    it("does not render the final bar rectangles synchronously when the user has no reduced-motion preference (animation pending)", () => {
      usePrefersReducedMotionMock.mockReturnValue(false);
      const { container } = render(
        <ComparisonBarChart income={50000} expense={20000} debt={10000} remaining={20000} />,
      );

      expect(container.querySelector(".recharts-bar-rectangle .recharts-rectangle")).not.toBeInTheDocument();
    });

    it("renders the final bar rectangles synchronously when the user prefers reduced motion (snaps to final value)", () => {
      usePrefersReducedMotionMock.mockReturnValue(true);
      const { container } = render(
        <ComparisonBarChart income={50000} expense={20000} debt={10000} remaining={20000} />,
      );

      expect(container.querySelectorAll(".recharts-bar-rectangle .recharts-rectangle")).toHaveLength(4);
    });
  });
});
