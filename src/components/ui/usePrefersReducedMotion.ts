"use client";

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function getInitialValue(): boolean {
  // Guard for SSR the same way ProfileProvider does elsewhere in this
  // codebase — `window`/`matchMedia` don't exist during server rendering.
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(QUERY).matches;
}

/**
 * Reads `prefers-reduced-motion` on mount and subscribes to runtime changes
 * (the user can flip this OS setting while the tab stays open). Used to
 * disable Recharts count-up/fill animations (design.md section 7) — set
 * `isAnimationActive={!prefersReducedMotion}` on the relevant chart element.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getInitialValue);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQueryList = window.matchMedia(QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQueryList.addEventListener("change", handleChange);
    return () => mediaQueryList.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}
