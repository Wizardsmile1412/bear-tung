import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ScoreGauge } from "../ScoreGauge";

describe("ScoreGauge", () => {
  it("renders the score number and a matching status badge for green", () => {
    render(<ScoreGauge score={85} light="green" />);

    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("renders a matching status badge for yellow", () => {
    render(<ScoreGauge score={60} light="yellow" />);

    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("!")).toBeInTheDocument();
  });

  it("renders a matching status badge for red", () => {
    render(<ScoreGauge score={30} light="red" />);

    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("✕")).toBeInTheDocument();
  });
});
