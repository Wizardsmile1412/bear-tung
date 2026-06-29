import { describe, expect, it } from "vitest";

import { suggestedDownPayment } from "../suggestedDownPayment";

const TEMPORARY_DATE = new Date("2027-05-01"); // <= boundary -> 100% LTV everywhere
const NORMAL_DATE = new Date("2027-07-01"); // > boundary -> normal rules

describe("suggestedDownPayment", () => {
  it("suggests 5% of the home price when the LTV rule requires no down payment (100% LTV)", () => {
    // Temporary policy: 100% LTV for all orders -> required 0 -> suggest 5%.
    expect(suggestedDownPayment({ homePrice: 5_000_000, homeOrder: 2, assessmentDate: TEMPORARY_DATE })).toBe(250_000);
    // Normal first home < 10M is also 100% LTV -> required 0 -> suggest 5%.
    expect(suggestedDownPayment({ homePrice: 3_000_000, homeOrder: 1, assessmentDate: NORMAL_DATE })).toBe(150_000);
  });

  it("returns the LTV-required amount when a down payment is required (no 5% override)", () => {
    // 2nd home, not paid 2 years, normal -> 80% LTV -> required 20% = 1,000,000.
    expect(
      suggestedDownPayment({
        homePrice: 5_000_000,
        homeOrder: 2,
        firstHomePaidAtLeastTwoYears: false,
        assessmentDate: NORMAL_DATE,
      }),
    ).toBe(1_000_000);
  });

  it("is 0 when the home price is 0", () => {
    expect(suggestedDownPayment({ homePrice: 0, homeOrder: 1, assessmentDate: TEMPORARY_DATE })).toBe(0);
  });
});
