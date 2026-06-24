import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ExportButton } from "../ExportButton";

describe("ExportButton", () => {
  it("renders the 'Export Excel' label", () => {
    render(<ExportButton onClick={() => {}} />);
    expect(screen.getByRole("button", { name: /Export Excel/i })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<ExportButton onClick={onClick} />);

    await userEvent.click(screen.getByRole("button", { name: /Export Excel/i }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
