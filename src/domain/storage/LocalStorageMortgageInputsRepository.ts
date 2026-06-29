import { MORTGAGE_INPUTS_STORAGE_KEY } from "../config/defaults";
import { ParsedMortgageInputs } from "../import/ImportResult";
import { MortgageInputsRepository } from "./MortgageInputsRepository";

/**
 * MortgageInputsRepository backed by the browser's localStorage.
 *
 * Same defensive contract as `LocalStorageProfileRepository`: never throws on
 * missing/corrupt data — `load()` returns `null` so the mortgage page simply
 * falls back to its default form values.
 */
export class LocalStorageMortgageInputsRepository implements MortgageInputsRepository {
  load(): ParsedMortgageInputs | null {
    if (typeof window === "undefined") {
      return null;
    }

    const raw = window.localStorage.getItem(MORTGAGE_INPUTS_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as ParsedMortgageInputs;
    } catch {
      return null;
    }
  }

  save(inputs: ParsedMortgageInputs): void {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(MORTGAGE_INPUTS_STORAGE_KEY, JSON.stringify(inputs));
  }

  clear(): void {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(MORTGAGE_INPUTS_STORAGE_KEY);
  }
}
