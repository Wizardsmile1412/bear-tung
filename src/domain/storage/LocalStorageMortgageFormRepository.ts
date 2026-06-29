import { MORTGAGE_FORM_STORAGE_KEY } from "../config/defaults";
import { MortgageFormRepository, MortgageFormState } from "./MortgageFormRepository";

/**
 * MortgageFormRepository backed by the browser's localStorage.
 *
 * Same defensive contract as `LocalStorageProfileRepository`: never throws on
 * missing/corrupt data — `load()` returns `null` so the mortgage page falls
 * back to its default form values.
 */
export class LocalStorageMortgageFormRepository implements MortgageFormRepository {
  load(): MortgageFormState | null {
    if (typeof window === "undefined") {
      return null;
    }

    const raw = window.localStorage.getItem(MORTGAGE_FORM_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as MortgageFormState;
    } catch {
      return null;
    }
  }

  save(state: MortgageFormState): void {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(MORTGAGE_FORM_STORAGE_KEY, JSON.stringify(state));
  }

  clear(): void {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(MORTGAGE_FORM_STORAGE_KEY);
  }
}
