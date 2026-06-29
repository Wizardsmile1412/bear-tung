"use client";

import { useCallback, useState } from "react";

import { MortgageFormState } from "@/domain/storage/MortgageFormRepository";
import { LocalStorageMortgageFormRepository } from "@/domain/storage/LocalStorageMortgageFormRepository";

/**
 * Persistence for the mortgage page's form inputs, so they survive navigating
 * away and back (the form is otherwise component-local state, lost on unmount).
 *
 * Keeps localStorage access behind a hook (components go through hooks, not raw
 * storage). `initial` is read once on first render — the page seeds its
 * `useState` from it — and `save` is called from an effect on every change.
 * The same store is seeded by an Excel import and cleared by the profile reset,
 * so the mortgage form is treated as part of the user's data.
 */
export interface UseMortgageFormResult {
  /** The persisted form state, read once on mount (null if none saved). */
  initial: MortgageFormState | null;
  /** Persists the latest form state. */
  save(state: MortgageFormState): void;
}

export function useMortgageForm(): UseMortgageFormResult {
  const [repository] = useState(() => new LocalStorageMortgageFormRepository());
  const [initial] = useState(() => repository.load());
  const save = useCallback((state: MortgageFormState) => repository.save(state), [repository]);

  return { initial, save };
}
