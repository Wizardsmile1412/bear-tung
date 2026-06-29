"use client";

import { useEffect, useState } from "react";

import { ParsedMortgageInputs } from "@/domain/import/ImportResult";
import { LocalStorageMortgageInputsRepository } from "@/domain/storage/LocalStorageMortgageInputsRepository";

const repository = new LocalStorageMortgageInputsRepository();

/**
 * One-shot reader of the mortgage inputs stashed by an Excel import, used to
 * pre-fill the mortgage form. Reads the value synchronously on first render
 * (so the form seeds its initial state from it) and clears it after mount, so
 * it only pre-fills once and stale data never lingers.
 *
 * Keeps localStorage access behind a hook rather than in the page component,
 * consistent with the rest of the app (components go through hooks, not raw
 * storage).
 */
export function useImportedMortgageInputs(): ParsedMortgageInputs | null {
  const [inputs] = useState<ParsedMortgageInputs | null>(() => repository.load());

  useEffect(() => {
    repository.clear();
  }, []);

  return inputs;
}
