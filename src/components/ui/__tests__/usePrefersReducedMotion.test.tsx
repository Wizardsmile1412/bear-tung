import { describe, expect, it, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { usePrefersReducedMotion } from "../usePrefersReducedMotion";

/** Builds a fake MediaQueryList whose `matches` + change listener are controllable from the test. */
function mockMatchMedia(initialMatches: boolean) {
  let listener: ((event: MediaQueryListEvent) => void) | null = null;
  const mql = {
    matches: initialMatches,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: vi.fn((type: string, cb: (event: MediaQueryListEvent) => void) => {
      if (type === "change") {
        listener = cb;
      }
    }),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };

  vi.spyOn(window, "matchMedia").mockReturnValue(mql as unknown as MediaQueryList);

  return {
    mql,
    fireChange(matches: boolean) {
      mql.matches = matches;
      listener?.({ matches } as MediaQueryListEvent);
    },
  };
}

describe("usePrefersReducedMotion", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false when the media query does not match on mount", () => {
    mockMatchMedia(false);

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(false);
  });

  it("returns true when the media query already matches on mount", () => {
    mockMatchMedia(true);

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(true);
  });

  it("responds to a runtime 'change' event on the MediaQueryList (OS setting flipped while the tab is open)", () => {
    const { fireChange } = mockMatchMedia(false);

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      fireChange(true);
    });

    expect(result.current).toBe(true);
  });

  it("subscribes via addEventListener('change', ...) and unsubscribes on unmount", () => {
    const { mql } = mockMatchMedia(false);

    const { unmount } = renderHook(() => usePrefersReducedMotion());
    expect(mql.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));

    unmount();
    expect(mql.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });
});
