import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ScoreGaugeChart } from "../ScoreGaugeChart";

describe("ScoreGaugeChart", () => {
  it("renders the score number centered over the chart", () => {
    render(<ScoreGaugeChart score={72} color="var(--color-warning)" />);

    expect(screen.getByText("72")).toBeInTheDocument();
  });

  it("clamps out-of-range scores into 0-100", () => {
    render(<ScoreGaugeChart score={140} color="var(--color-good)" />);

    expect(screen.getByText("100")).toBeInTheDocument();
  });
});
