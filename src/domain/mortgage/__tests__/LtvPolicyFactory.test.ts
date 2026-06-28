import { describe, expect, it } from "vitest";

import { LtvPolicyFactory } from "../LtvPolicyFactory";
import { NormalLtvPolicy } from "../NormalLtvPolicy";
import { TemporaryLtvPolicy } from "../TemporaryLtvPolicy";

describe("LtvPolicyFactory", () => {
  it("selects TemporaryLtvPolicy for a date exactly on the relaxation end date (2027-06-30)", () => {
    const policy = LtvPolicyFactory.forDate(new Date("2027-06-30"));
    expect(policy).toBeInstanceOf(TemporaryLtvPolicy);
    expect(policy.name).toBe("temporary");
  });

  it("selects TemporaryLtvPolicy for a date before the relaxation ends", () => {
    const policy = LtvPolicyFactory.forDate(new Date("2026-01-15"));
    expect(policy).toBeInstanceOf(TemporaryLtvPolicy);
  });

  it("selects NormalLtvPolicy for a date after the relaxation ends (2027-07-01)", () => {
    const policy = LtvPolicyFactory.forDate(new Date("2027-07-01"));
    expect(policy).toBeInstanceOf(NormalLtvPolicy);
    expect(policy.name).toBe("normal");
  });
});
