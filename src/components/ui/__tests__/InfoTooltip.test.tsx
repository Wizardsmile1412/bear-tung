import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { InfoTooltip } from "../InfoTooltip";

const LABEL = "DSR (สัดส่วนภาระหนี้ต่อรายได้) คือ...";

describe("InfoTooltip", () => {
  it("hides the explanation text and has aria-expanded=false initially", () => {
    render(<InfoTooltip label={LABEL} />);

    expect(screen.queryByText(LABEL)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ดูคำอธิบาย" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("reveals the explanation text when the (?) button is clicked, and hides it again on a second click", async () => {
    render(<InfoTooltip label={LABEL} />);

    const button = screen.getByRole("button", { name: "ดูคำอธิบาย" });
    await userEvent.click(button);

    expect(screen.getByText(LABEL)).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(button);

    expect(screen.queryByText(LABEL)).not.toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("renders a real, focusable <button> (not a hover-only tooltip), since hover doesn't work on touch/iPad", () => {
    render(<InfoTooltip label={LABEL} />);

    const button = screen.getByRole("button", { name: "ดูคำอธิบาย" });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
  });
});
