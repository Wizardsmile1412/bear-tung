import { describe, expect, it } from "vitest";

import { MonthKey } from "../MonthKey";

describe("MonthKey", () => {
  it("parses a valid 'YYYY-MM' string and round-trips via toString", () => {
    const month = MonthKey.parse("2026-06");
    expect(month.toString()).toBe("2026-06");
  });

  it("throws on invalid input", () => {
    expect(() => MonthKey.parse("2026-13")).toThrow();
    expect(() => MonthKey.parse("not-a-month")).toThrow();
    expect(() => MonthKey.parse("2026/06")).toThrow();
    expect(() => MonthKey.parse("2026")).toThrow();
    expect(() => MonthKey.parse("2026-00")).toThrow();
    expect(() => MonthKey.parse("")).toThrow();
  });

  it("current() returns today's month", () => {
    expect(MonthKey.current().toString()).toBe("2026-06");
  });

  it("shift() adds and subtracts months", () => {
    const month = MonthKey.parse("2026-06");
    expect(month.shift(1).toString()).toBe("2026-07");
    expect(month.shift(-1).toString()).toBe("2026-05");
    expect(month.shift(12).toString()).toBe("2027-06");
  });

  it("compares months correctly", () => {
    const a = MonthKey.parse("2026-06");
    const b = MonthKey.parse("2026-07");

    expect(a.isBefore(b)).toBe(true);
    expect(b.isAfter(a)).toBe(true);
    expect(a.isSameOrBefore(a)).toBe(true);
    expect(a.isSameOrAfter(a)).toBe(true);
    expect(a.isAfter(b)).toBe(false);
  });

  it("diffInMonths returns the month distance", () => {
    const a = MonthKey.parse("2027-01");
    const b = MonthKey.parse("2026-06");
    expect(a.diffInMonths(b)).toBe(7);
    expect(b.diffInMonths(a)).toBe(-7);
  });

  it("from() normalizes either a MonthKey or a raw string", () => {
    const month = MonthKey.parse("2026-06");
    expect(MonthKey.from(month)).toBe(month);
    expect(MonthKey.from("2026-06").toString()).toBe("2026-06");
  });
});
