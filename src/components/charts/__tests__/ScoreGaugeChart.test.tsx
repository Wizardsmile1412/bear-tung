import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { ScoreGaugeChart } from "../ScoreGaugeChart";

const { usePrefersReducedMotionMock } = vi.hoisted(() => ({
  usePrefersReducedMotionMock: vi.fn(() => false),
}));
vi.mock("@/components/ui/usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: usePrefersReducedMotionMock,
}));

describe("ScoreGaugeChart", () => {
  it("renders the score number centered over the chart", () => {
    render(<ScoreGaugeChart score={72} color="var(--color-warning)" />);

    expect(screen.getByText("72")).toBeInTheDocument();
  });

  it("clamps out-of-range scores into 0-100", () => {
    render(<ScoreGaugeChart score={140} color="var(--color-good)" />);

    expect(screen.getByText("100")).toBeInTheDocument();
  });

  describe("prefers-reduced-motion", () => {
    // jsdom has no rAF-driven paint loop, so Recharts' Animate wrapper never
    // progresses past frame 0: when isAnimationActive is true, the sector
    // path simply never mounts into `.recharts-radial-bar-sectors` (it stays
    // empty). When isAnimationActive is false, Recharts skips the Animate
    // wrapper entirely and renders the final sector path synchronously. That
    // presence/absence is what these tests assert on.
    it("does not render the final sector synchronously when the user has no reduced-motion preference (animation pending)", () => {
      usePrefersReducedMotionMock.mockReturnValue(false);
      const { container } = render(<ScoreGaugeChart score={72} color="var(--color-warning)" />);

      expect(container.querySelector(".recharts-radial-bar-sectors path")).not.toBeInTheDocument();
    });

    it("renders the final sector synchronously when the user prefers reduced motion (snaps to final value, no animation)", () => {
      usePrefersReducedMotionMock.mockReturnValue(true);
      const { container } = render(<ScoreGaugeChart score={72} color="var(--color-warning)" />);

      expect(container.querySelector(".recharts-radial-bar-sectors path")).toBeInTheDocument();
      expect(screen.getByText("72")).toBeInTheDocument();
    });
  });
});
