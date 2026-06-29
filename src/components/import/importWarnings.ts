// Transient hand-off for import warnings across the navigation from wherever
// the file was imported (e.g. the home page) to the Cash Flow review screen,
// where they're shown in a banner. sessionStorage (not localStorage) so the
// warnings are scoped to the tab and naturally gone on the next session.

const IMPORT_WARNINGS_KEY = "bear-tung:import-warnings";

/** Stashes warnings to show once on the next Cash Flow page load. */
export function stashImportWarnings(warnings: string[]): void {
  if (typeof window === "undefined" || warnings.length === 0) {
    return;
  }
  window.sessionStorage.setItem(IMPORT_WARNINGS_KEY, JSON.stringify(warnings));
}

/** Reads any stashed warnings without clearing them. */
export function peekImportWarnings(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.sessionStorage.getItem(IMPORT_WARNINGS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

/** Clears any stashed warnings. */
export function clearImportWarnings(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(IMPORT_WARNINGS_KEY);
}

/** Reads and clears any stashed warnings in one call (for non-render callers/tests). */
export function takeImportWarnings(): string[] {
  const warnings = peekImportWarnings();
  clearImportWarnings();
  return warnings;
}
