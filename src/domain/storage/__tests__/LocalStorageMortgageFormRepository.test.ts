import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MORTGAGE_FORM_STORAGE_KEY } from "../../config/defaults";
import { MortgageFormState } from "../MortgageFormRepository";
import { LocalStorageMortgageFormRepository } from "../LocalStorageMortgageFormRepository";

const sampleForm: MortgageFormState = {
  selectedIndex: 2,
  homePrice: 4500000,
  homeOrder: 1,
  firstHomePaidAtLeastTwoYears: false,
  borrowerAge: 40,
  downPaymentAvailable: 500000,
  downPaymentMode: "manual",
  interestRatePercent: 6.5,
  loanTermYears: 30,
  dsrLimitPercent: 40,
  coBorrowerEnabled: true,
  coDebt: 5000,
  coIncomeProvided: 20000,
};

describe("LocalStorageMortgageFormRepository", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("load() returns null when nothing is stored", () => {
    expect(new LocalStorageMortgageFormRepository().load()).toBeNull();
  });

  it("save() then load() round-trips the form state", () => {
    const repository = new LocalStorageMortgageFormRepository();
    repository.save(sampleForm);

    expect(repository.load()).toEqual(sampleForm);
  });

  it("clear() removes the stored form state", () => {
    const repository = new LocalStorageMortgageFormRepository();
    repository.save(sampleForm);
    repository.clear();

    expect(repository.load()).toBeNull();
  });

  it("stores data under the documented storage key", () => {
    new LocalStorageMortgageFormRepository().save(sampleForm);

    expect(localStorage.getItem(MORTGAGE_FORM_STORAGE_KEY)).not.toBeNull();
  });

  it("load() returns null and does not throw on corrupt JSON", () => {
    localStorage.setItem(MORTGAGE_FORM_STORAGE_KEY, "{not valid json");

    expect(new LocalStorageMortgageFormRepository().load()).toBeNull();
  });

  describe("when running outside the browser (SSR, no window)", () => {
    const originalWindow = globalThis.window;

    beforeEach(() => {
      // @ts-expect-error simulating an SSR environment where `window` is undefined
      delete globalThis.window;
    });

    afterEach(() => {
      globalThis.window = originalWindow;
    });

    it("load() returns null without touching localStorage", () => {
      expect(new LocalStorageMortgageFormRepository().load()).toBeNull();
    });

    it("save() and clear() are no-ops", () => {
      const repository = new LocalStorageMortgageFormRepository();
      expect(() => repository.save(sampleForm)).not.toThrow();
      expect(() => repository.clear()).not.toThrow();
    });
  });
});
