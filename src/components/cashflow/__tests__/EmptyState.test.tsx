import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  it("renders the Thai empty-state message", () => {
    render(<EmptyState />);
    expect(screen.getByText("ยังไม่มีข้อมูล — เริ่มกรอก Cash Flow ของคุณ")).toBeInTheDocument();
  });
});
