import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ScoreTrendChart, ScoreTrendDatum } from "../ScoreTrendChart";

// Defaults to `true` (snap to final state, no animation) so the rest of
// this file's tests keep working unchanged; only the "prefers-reduced-motion"
// describe block below overrides this to specifically exercise both states.
const { usePrefersReducedMotionMock } = vi.hoisted(() => ({
  usePrefersReducedMotionMock: vi.fn(() => true),
}));
vi.mock("@/components/ui/usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: usePrefersReducedMotionMock,
}));

function buildSixtyMonthData(): ScoreTrendDatum[] {
  const data: ScoreTrendDatum[] = [];
  const monthNames = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];
  for (let i = 0; i < 60; i++) {
    const year = 2026 + Math.floor(i / 12);
    const monthIndex = i % 12;
    data.push({
      month: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
      monthLabel: `${monthNames[monthIndex]} ${year}`,
      score: 50 + (i % 50),
    });
  }
  return data;
}

describe("ScoreTrendChart", () => {
  afterEach(() => {
    usePrefersReducedMotionMock.mockReturnValue(true);
  });

  it("renders without crashing for a 60-point dataset", () => {
    const data = buildSixtyMonthData();
    const { container } = render(<ScoreTrendChart data={data} />);

    expect(container.querySelector(".recharts-line")).toBeInTheDocument();
  });

  it("shows the fallback message when data is empty", () => {
    render(<ScoreTrendChart data={[]} />);
    expect(screen.getByText("ไม่มีข้อมูลแนวโน้ม")).toBeInTheDocument();
  });

  it("renders the selected-month reference line when selectedMonth matches a data point", () => {
    const data = buildSixtyMonthData();
    const { container } = render(<ScoreTrendChart data={data} selectedMonth={data[10].month} />);

    // ReferenceLine renders a <line class="recharts-reference-line-line">.
    expect(container.querySelector(".recharts-reference-line")).toBeInTheDocument();
  });

  it("positions the reference line at the data point matching the selected index, not just any point", () => {
    const data = buildSixtyMonthData();
    // index 10 -> month index 10 % 12 = 10 -> 'พ.ย.' (November), year 2026.
    const { container } = render(<ScoreTrendChart data={data} selectedMonth={data[10].month} />);

    const line = container.querySelector(".recharts-reference-line-line");
    expect(line).toBeInTheDocument();
    // Recharts' categorical x= prop is carried through verbatim onto the
    // rendered <line>'s `x` attribute (pre-pixel-conversion) — asserting on
    // it confirms the line is keyed to data[10]'s exact label, not just that
    // *some* reference line happens to exist anywhere on the chart.
    expect(line).toHaveAttribute("x", data[10].monthLabel);
    expect(line).toHaveAttribute("x", "พ.ย. 2026");

    // A different selectedIndex must move the line to a different label.
    const { container: container2 } = render(<ScoreTrendChart data={data} selectedMonth={data[25].month} />);
    const line2 = container2.querySelector(".recharts-reference-line-line");
    expect(line2).toHaveAttribute("x", data[25].monthLabel);
    expect(line2?.getAttribute("x")).not.toBe(line?.getAttribute("x"));
  });

  it("does not render a reference line when selectedMonth is not provided", () => {
    const data = buildSixtyMonthData();
    const { container } = render(<ScoreTrendChart data={data} />);

    expect(container.querySelector(".recharts-reference-line")).not.toBeInTheDocument();
  });

  it("renders the 3 traffic-light background bands", () => {
    const data = buildSixtyMonthData();
    const { container } = render(<ScoreTrendChart data={data} />);

    const areas = container.querySelectorAll(".recharts-reference-area");
    expect(areas).toHaveLength(3);
  });

  describe("tooltip", () => {
    // Recharts only renders the tooltip's populated content while a point is
    // actively hovered, and a plain `userEvent.hover` on the line path does
    // not move recharts' internal "active index" tracking in jsdom (unlike
    // ExpenseDonutChart's pie sectors, which each have their own hoverable
    // element). LineChart instead tracks the mouse position over the whole
    // chart surface, so we simulate a real mouse move with explicit
    // coordinates (clientX) over `.recharts-surface` — verified empirically
    // against this exact 3-point/600px-wide fixture: x=40 lands on the first
    // point, x=300 on the middle point, x=570 on the last.
    const hoverData: ScoreTrendDatum[] = [
      { month: "2026-06", monthLabel: "มิ.ย. 2026", score: 90 }, // >= 80 -> ดี (good)
      { month: "2026-07", monthLabel: "ก.ค. 2026", score: 60 }, // 50-79 -> พอใช้ (warning)
      { month: "2026-08", monthLabel: "ส.ค. 2026", score: 30 }, // < 50 -> ต้องระวัง (danger)
    ];

    function hoverAt(container: HTMLElement, clientX: number): void {
      const surface = container.querySelector(".recharts-surface")!;
      fireEvent.mouseEnter(surface, { clientX, clientY: 150 });
      fireEvent.mouseMove(surface, { clientX, clientY: 150 });
    }

    it("shows the month label, score, and 'ดี' status when hovering a >=80 point", async () => {
      const { container } = render(<ScoreTrendChart data={hoverData} />);

      hoverAt(container, 40);

      expect(await screen.findByText("มิ.ย. 2026")).toBeInTheDocument();
      expect(await screen.findByText("90")).toBeInTheDocument();
      expect(await screen.findByText(/ดี/)).toBeInTheDocument();
    });

    it("shows the 'พอใช้' status when hovering a 50-79 point", async () => {
      const { container } = render(<ScoreTrendChart data={hoverData} />);

      hoverAt(container, 300);

      expect(await screen.findByText("ก.ค. 2026")).toBeInTheDocument();
      expect(await screen.findByText("60")).toBeInTheDocument();
      expect(await screen.findByText(/พอใช้/)).toBeInTheDocument();
    });

    it("shows the 'ต้องระวัง' status when hovering a <50 point", async () => {
      const { container } = render(<ScoreTrendChart data={hoverData} />);

      hoverAt(container, 570);

      expect(await screen.findByText("ส.ค. 2026")).toBeInTheDocument();
      expect(await screen.findByText("30")).toBeInTheDocument();
      expect(await screen.findByText(/ต้องระวัง/)).toBeInTheDocument();
    });

    it("renders nothing when not hovering (tooltip content returns null while inactive)", () => {
      render(<ScoreTrendChart data={hoverData} />);

      expect(screen.queryByText("คะแนน")).not.toBeInTheDocument();
    });
  });

  describe("prefers-reduced-motion", () => {
    // Recharts animates `Line` via a `stroke-dasharray` reveal rather than
    // delaying the path's mount, so — unlike the bar/pie/radial-bar charts —
    // the curve path is present in both states; the distinguishing marker is
    // whether `stroke-dasharray` is present on the rendered curve at all
    // (only set while the dash-reveal animation is active).
    it("renders the line curve with a stroke-dasharray (animation pending) when the user has no reduced-motion preference", () => {
      usePrefersReducedMotionMock.mockReturnValue(false);
      const data = buildSixtyMonthData();
      const { container } = render(<ScoreTrendChart data={data} />);

      const curve = container.querySelector(".recharts-line-curve");
      expect(curve).toBeInTheDocument();
      expect(curve).toHaveAttribute("stroke-dasharray");
    });

    it("renders the line curve without a stroke-dasharray (snapped to final value) when the user prefers reduced motion", () => {
      usePrefersReducedMotionMock.mockReturnValue(true);
      const data = buildSixtyMonthData();
      const { container } = render(<ScoreTrendChart data={data} />);

      const curve = container.querySelector(".recharts-line-curve");
      expect(curve).toBeInTheDocument();
      expect(curve).not.toHaveAttribute("stroke-dasharray");
    });
  });
});
