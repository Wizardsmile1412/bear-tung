import { describe, expect, it } from "vitest";

import { formatMonthLabel } from "../formatMonthLabel";

describe("formatMonthLabel", () => {
  // All 12 months, hand-verified against the Thai abbreviated month names
  // (not just a sample of 3) — every entry in THAI_ABBREVIATED_MONTHS must
  // be exercised so a typo in any one of them would fail a test.
  it.each([
    ["2026-01", "ม.ค. 2026"],
    ["2026-02", "ก.พ. 2026"],
    ["2026-03", "มี.ค. 2026"],
    ["2026-04", "เม.ย. 2026"],
    ["2026-05", "พ.ค. 2026"],
    ["2026-06", "มิ.ย. 2026"],
    ["2026-07", "ก.ค. 2026"],
    ["2026-08", "ส.ค. 2026"],
    ["2026-09", "ก.ย. 2026"],
    ["2026-10", "ต.ค. 2026"],
    ["2026-11", "พ.ย. 2026"],
    ["2026-12", "ธ.ค. 2026"],
  ])("formats %s as %s", (month, expected) => {
    expect(formatMonthLabel(month)).toBe(expected);
  });

  it("uses the Gregorian year as-is, even across a year boundary", () => {
    expect(formatMonthLabel("2027-01")).toBe("ม.ค. 2027");
  });
});
