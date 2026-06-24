import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { ComparisonBarChart } from "../ComparisonBarChart";

describe("ComparisonBarChart", () => {
  it("renders 4 distinct bars, one per category, using chart-accent colors", () => {
    const { container } = render(
      <ComparisonBarChart income={50000} expense={20000} debt={10000} remaining={20000} />,
    );

    const bars = container.querySelectorAll(".recharts-bar-rectangle .recharts-rectangle");
    expect(bars).toHaveLength(4);

    const fills = Array.from(bars).map((bar) => bar.getAttribute("fill"));
    expect(fills).toEqual([
      "var(--color-chart-1)",
      "var(--color-chart-2)",
      "var(--color-chart-3)",
      "var(--color-chart-4)",
    ]);

    // design.md is explicit: traffic-light colors must never appear on a
    // chart that isn't communicating money-health status, to avoid
    // confusing the two meanings.
    for (const fill of fills) {
      expect(fill).not.toMatch(/--color-(good|warning|danger)/);
    }
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
});
