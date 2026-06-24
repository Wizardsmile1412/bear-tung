import { describe, expect, it } from "vitest";

import { Money } from "../Money";

describe("Money", () => {
  it("formats a whole-baht amount with Thai-locale thousands separators", () => {
    expect(Money.format(35000)).toBe("35,000");
    expect(Money.format(1234567)).toBe("1,234,567");
  });

  it("formats zero", () => {
    expect(Money.format(0)).toBe("0");
  });

  it("formats negative amounts (overspending case)", () => {
    expect(Money.format(-8000)).toBe("-8,000");
  });

  it("rounds to whole baht (no fraction digits)", () => {
    expect(Money.format(1000.6)).toBe("1,001");
    expect(Money.format(1000.4)).toBe("1,000");
  });

  it("formatWithUnit appends the Thai baht unit suffix", () => {
    expect(Money.formatWithUnit(35000)).toBe("35,000 บาท");
    expect(Money.formatWithUnit(0)).toBe("0 บาท");
  });
});
