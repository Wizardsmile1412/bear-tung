import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MORTGAGE_INPUTS_STORAGE_KEY } from "../../config/defaults";
import { ParsedMortgageInputs } from "../../import/ImportResult";
import { LocalStorageMortgageInputsRepository } from "../LocalStorageMortgageInputsRepository";

const sampleInputs: ParsedMortgageInputs = {
  homePrice: 4500000,
  homeOrder: 1,
  borrowerAge: 40,
  interestRatePercent: 6.5,
  loanTermYears: 30,
  downPaymentAvailable: 500000,
  dsrLimit: 0.4,
  coBorrowerEnabled: true,
  coDebt: 5000,
};

describe("LocalStorageMortgageInputsRepository", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("load() returns null when nothing is stored", () => {
    expect(new LocalStorageMortgageInputsRepository().load()).toBeNull();
  });

  it("save() then load() round-trips the inputs", () => {
    const repository = new LocalStorageMortgageInputsRepository();
    repository.save(sampleInputs);

    expect(repository.load()).toEqual(sampleInputs);
  });

  it("clear() removes the stored inputs", () => {
    const repository = new LocalStorageMortgageInputsRepository();
    repository.save(sampleInputs);
    repository.clear();

    expect(repository.load()).toBeNull();
  });

  it("stores data under the documented storage key", () => {
    new LocalStorageMortgageInputsRepository().save(sampleInputs);

    expect(localStorage.getItem(MORTGAGE_INPUTS_STORAGE_KEY)).not.toBeNull();
  });

  it("load() returns null and does not throw on corrupt JSON", () => {
    localStorage.setItem(MORTGAGE_INPUTS_STORAGE_KEY, "{not valid json");

    expect(new LocalStorageMortgageInputsRepository().load()).toBeNull();
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
      expect(new LocalStorageMortgageInputsRepository().load()).toBeNull();
    });

    it("save() and clear() are no-ops", () => {
      const repository = new LocalStorageMortgageInputsRepository();
      expect(() => repository.save(sampleInputs)).not.toThrow();
      expect(() => repository.clear()).not.toThrow();
    });
  });
});
