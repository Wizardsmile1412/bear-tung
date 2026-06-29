import { ParsedMortgageInputs } from "../import/ImportResult";

/**
 * Repository abstraction (DIP) for the transient mortgage form inputs handed
 * off from an Excel import to the mortgage page. Separate from
 * `ProfileRepository` (ISP) — it holds a one-shot pre-fill payload, not core
 * persisted state, so it also exposes `clear()` for consuming it once used.
 */
export interface MortgageInputsRepository {
  load(): ParsedMortgageInputs | null;
  save(inputs: ParsedMortgageInputs): void;
  clear(): void;
}
