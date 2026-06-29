import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ImportButton } from "../ImportButton";
import { ImportSummary } from "../useImport";

const importFromFile = vi.fn<(file: File) => Promise<ImportSummary>>();

vi.mock("../useImport", () => ({
  useImport: () => ({ importFromFile }),
  INVALID_FILE_MESSAGE: "ไฟล์ไม่ถูกต้อง",
}));

function makeFile() {
  return new File(["x"], "bear-tung.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

describe("ImportButton", () => {
  beforeEach(() => {
    importFromFile.mockReset();
  });

  it("imports immediately (no confirm) when there is no existing data", async () => {
    importFromFile.mockResolvedValue({ itemCount: 2, warnings: [], hasMortgage: false });
    const onImported = vi.fn();

    render(<ImportButton confirmReplace={false} onImported={onImported} />);

    await userEvent.upload(screen.getByTestId("import-file-input"), makeFile());

    expect(importFromFile).toHaveBeenCalledTimes(1);
    expect(onImported).toHaveBeenCalledWith({ itemCount: 2, warnings: [], hasMortgage: false });
  });

  it("requires confirmation before importing when data would be replaced", async () => {
    const onImported = vi.fn();
    render(<ImportButton confirmReplace onImported={onImported} />);

    await userEvent.click(screen.getByRole("button", { name: "Import Excel" }));
    expect(screen.getByText(/แทนที่ข้อมูลปัจจุบัน/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "ยกเลิก" }));
    expect(screen.queryByText(/แทนที่ข้อมูลปัจจุบัน/)).not.toBeInTheDocument();
    expect(importFromFile).not.toHaveBeenCalled();
  });

  it("shows an inline error when the import fails", async () => {
    importFromFile.mockRejectedValue(new Error("ไฟล์ไม่ถูกต้อง"));
    const onImported = vi.fn();

    render(<ImportButton confirmReplace={false} onImported={onImported} />);

    await userEvent.upload(screen.getByTestId("import-file-input"), makeFile());

    expect(await screen.findByText("ไฟล์ไม่ถูกต้อง")).toBeInTheDocument();
    expect(onImported).not.toHaveBeenCalled();
  });
});
