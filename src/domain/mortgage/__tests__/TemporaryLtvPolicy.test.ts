import { describe, expect, it } from "vitest";

import { TemporaryLtvPolicy } from "../TemporaryLtvPolicy";

describe("TemporaryLtvPolicy", () => {
  const policy = new TemporaryLtvPolicy();

  it("always returns 100% LTV regardless of home order or price", () => {
    expect(policy.maxLtv({ homePrice: 3_000_000, homeOrder: 1 })).toBe(1.0);
    expect(policy.maxLtv({ homePrice: 20_000_000, homeOrder: 2, firstHomePaidAtLeastTwoYears: false })).toBe(1.0);
    expect(policy.maxLtv({ homePrice: 50_000_000, homeOrder: 3 })).toBe(1.0);
  });

  it("name is 'temporary'", () => {
    expect(policy.name).toBe("temporary");
  });
});
