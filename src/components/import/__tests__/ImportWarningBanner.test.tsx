import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ImportWarningBanner } from "../ImportWarningBanner";
import { stashImportWarnings, takeImportWarnings } from "../importWarnings";

describe("importWarnings", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("stashes then takes warnings once (one-shot)", () => {
    stashImportWarnings(["a", "b"]);

    expect(takeImportWarnings()).toEqual(["a", "b"]);
    expect(takeImportWarnings()).toEqual([]); // cleared after first read
  });

  it("stashes nothing for an empty list", () => {
    stashImportWarnings([]);
    expect(takeImportWarnings()).toEqual([]);
  });
});

describe("ImportWarningBanner", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("renders nothing when there are no stashed warnings", () => {
    const { container } = render(<ImportWarningBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows stashed warnings and can be dismissed", async () => {
    stashImportWarnings(["ตรวจพบการเปลี่ยนแปลงในอนาคต"]);

    render(<ImportWarningBanner />);

    expect(screen.getByText("ตรวจพบการเปลี่ยนแปลงในอนาคต")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "ปิด" }));
    expect(screen.queryByText("ตรวจพบการเปลี่ยนแปลงในอนาคต")).not.toBeInTheDocument();
  });
});
