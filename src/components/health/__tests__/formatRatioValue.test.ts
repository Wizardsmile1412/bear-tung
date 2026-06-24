import { describe, expect, it } from "vitest";

import { RatioResult } from "@/domain/ratios/Ratio";

import { formatRatioValue } from "../formatRatioValue";

function makeResult(overrides: Partial<RatioResult>): RatioResult {
  return {
    key: "savingsRate",
    label: "label",
    value: 0,
    score: 0,
    status: "good",
    ...overrides,
  };
}

describe("formatRatioValue", () => {
  it("formats savingsRate as a rounded percentage", () => {
    expect(formatRatioValue(makeResult({ key: "savingsRate", value: 0.183 }))).toBe("18%");
  });

  it("formats dsr as a rounded percentage", () => {
    expect(formatRatioValue(makeResult({ key: "dsr", value: 0.452 }))).toBe("45%");
  });

  it("rounds a half-percent boundary up (Math.round half-away-from-zero)", () => {
    // 0.005 * 100 = 0.5 -> Math.round rounds halves up, not down.
    expect(formatRatioValue(makeResult({ key: "savingsRate", value: 0.005 }))).toBe("1%");
  });

  it("rounds a tiny negative value to 0%, not -0% or -1%", () => {
    // Reachable when overspending is negligible (e.g. savingsRate slightly
    // below zero). `Math.round` yields -0 here; string interpolation must
    // not surface the sign.
    expect(formatRatioValue(makeResult({ key: "savingsRate", value: -0.001 }))).toBe("0%");
  });

  it("formats a finite emergencyFund value as months", () => {
    expect(formatRatioValue(makeResult({ key: "emergencyFund", value: 6.25 }))).toBe("6.3 เดือน");
  });

  it("formats an Infinity emergencyFund value as 'no burn' text", () => {
    expect(formatRatioValue(makeResult({ key: "emergencyFund", value: Infinity }))).toBe(
      "ไม่มีภาระรายจ่าย/หนี้",
    );
  });

  it("falls back to the raw numeric value for an unrecognized ratio key", () => {
    // Defensive branch: `RatioResult.key` is typed as `string`, so this
    // guards against a future ratio being added without a formatter case.
    expect(formatRatioValue(makeResult({ key: "unknownRatio", value: 12.5 }))).toBe("12.5");
  });
});
