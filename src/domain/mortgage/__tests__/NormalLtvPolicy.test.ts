import { describe, expect, it } from "vitest";

import { NormalLtvPolicy } from "../NormalLtvPolicy";

describe("NormalLtvPolicy", () => {
  const policy = new NormalLtvPolicy();

  it("1st home, price < 10M -> 100% LTV", () => {
    expect(policy.maxLtv({ homePrice: 5_000_000, homeOrder: 1 })).toBe(1.0);
  });

  it("1st home, price >= 10M -> 90% LTV", () => {
    expect(policy.maxLtv({ homePrice: 10_000_000, homeOrder: 1 })).toBe(0.9);
  });

  it("2nd home, 1st home paid >= 2 years -> 90% LTV", () => {
    expect(policy.maxLtv({ homePrice: 5_000_000, homeOrder: 2, firstHomePaidAtLeastTwoYears: true })).toBe(0.9);
  });

  it("2nd home, 1st home paid < 2 years -> 80% LTV", () => {
    expect(policy.maxLtv({ homePrice: 5_000_000, homeOrder: 2, firstHomePaidAtLeastTwoYears: false })).toBe(0.8);
  });

  it("3rd+ home -> 70% LTV regardless of price", () => {
    expect(policy.maxLtv({ homePrice: 20_000_000, homeOrder: 3 })).toBe(0.7);
  });

  it("name is 'normal'", () => {
    expect(policy.name).toBe("normal");
  });
});
