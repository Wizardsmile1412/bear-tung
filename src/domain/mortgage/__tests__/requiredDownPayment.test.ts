import { describe, expect, it } from "vitest";

import { requiredDownPayment } from "../requiredDownPayment";

// Dates straddling the 2027-06-30 relaxation boundary (see LtvPolicyFactory).
const TEMPORARY_DATE = new Date("2027-05-01"); // <= boundary -> 100% LTV everywhere
const NORMAL_DATE = new Date("2027-07-01"); // > boundary -> normal rules

describe("requiredDownPayment", () => {
  it("is 0 under the temporary 100% LTV policy, regardless of home order", () => {
    expect(requiredDownPayment({ homePrice: 4_000_000, homeOrder: 1, assessmentDate: TEMPORARY_DATE })).toBe(0);
    expect(requiredDownPayment({ homePrice: 4_000_000, homeOrder: 3, assessmentDate: TEMPORARY_DATE })).toBe(0);
  });

  it("is 0 for a first home under 10M under normal rules (100% LTV)", () => {
    expect(requiredDownPayment({ homePrice: 3_000_000, homeOrder: 1, assessmentDate: NORMAL_DATE })).toBe(0);
  });

  it("is 10% for a first home >= 10M under normal rules (90% LTV)", () => {
    expect(requiredDownPayment({ homePrice: 12_000_000, homeOrder: 1, assessmentDate: NORMAL_DATE })).toBe(1_200_000);
  });

  it("is 20% for a 2nd home not yet paid 2 years under normal rules (80% LTV)", () => {
    expect(
      requiredDownPayment({
        homePrice: 2_000_000,
        homeOrder: 2,
        firstHomePaidAtLeastTwoYears: false,
        assessmentDate: NORMAL_DATE,
      }),
    ).toBe(400_000);
  });

  it("is 10% for a 2nd home paid >= 2 years under normal rules (90% LTV)", () => {
    expect(
      requiredDownPayment({
        homePrice: 2_000_000,
        homeOrder: 2,
        firstHomePaidAtLeastTwoYears: true,
        assessmentDate: NORMAL_DATE,
      }),
    ).toBe(200_000);
  });

  it("is 30% for a 3rd+ home under normal rules (70% LTV)", () => {
    expect(requiredDownPayment({ homePrice: 1_000_000, homeOrder: 3, assessmentDate: NORMAL_DATE })).toBe(300_000);
  });

  it("is 0 when the home price is 0", () => {
    expect(requiredDownPayment({ homePrice: 0, homeOrder: 2, assessmentDate: NORMAL_DATE })).toBe(0);
  });
});
