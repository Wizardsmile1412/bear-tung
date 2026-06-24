import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { StatusBadge } from "../StatusBadge";

describe("StatusBadge", () => {
  it("renders the check icon and text for tone=good", () => {
    render(<StatusBadge tone="good" label="ดี" />);

    expect(screen.getByText("✓")).toBeInTheDocument();
    expect(screen.getByText("ดี")).toBeInTheDocument();
  });

  it("renders the warning icon and text for tone=warning", () => {
    render(<StatusBadge tone="warning" label="พอใช้" />);

    expect(screen.getByText("!")).toBeInTheDocument();
    expect(screen.getByText("พอใช้")).toBeInTheDocument();
  });

  it("renders the cross icon and text for tone=danger", () => {
    render(<StatusBadge tone="danger" label="ต้องระวัง" />);

    expect(screen.getByText("✕")).toBeInTheDocument();
    expect(screen.getByText("ต้องระวัง")).toBeInTheDocument();
  });
});
