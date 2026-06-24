import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PROJECTION_MONTHS } from "@/domain/config/defaults";
import { LineItem } from "@/domain/model/LineItem";
import { ProjectionService } from "@/domain/projection/ProjectionService";
import { ProfileProvider } from "@/components/profile/ProfileProvider";
import { useProfile } from "@/components/profile/useProfile";

import { useProjectionSeries } from "../useProjectionSeries";

function TestConsumer() {
  const { profile, addItem } = useProfile();
  const { isLoaded, series } = useProjectionSeries();

  return (
    <div>
      <span data-testid="loaded">{String(isLoaded)}</span>
      <span data-testid="length">{series.length}</span>
      <span data-testid="score-0">{series[0]?.score}</span>
      <span data-testid="score-6">{series[6]?.score}</span>
      <button
        onClick={() => {
          addItem(
            LineItem.create({
              id: "salary",
              category: "income",
              subCategory: "salary",
              label: "Salary",
              changes: [
                { effectiveFrom: profile.startMonth, amount: 20000 },
                { effectiveFrom: profile.startMonth, amount: 20000 },
              ],
            }),
          );
        }}
      >
        seed
      </button>
    </div>
  );
}

// A separate "unrelated state" piece (modeling a page-level `selectedIndex`
// from a month slider) that lives alongside the hook but is NOT part of its
// memo key — re-rendering because of this must not re-trigger buildSeries.
function HarnessWithUnrelatedState() {
  const { series } = useProjectionSeries();
  const [tick, setTick] = useState(0);

  return (
    <div>
      <span data-testid="length">{series.length}</span>
      <span data-testid="tick">{tick}</span>
      <button onClick={() => setTick((t: number) => t + 1)}>bump-unrelated-state</button>
    </div>
  );
}

describe("useProjectionSeries", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it(`returns a series of exactly PROJECTION_MONTHS (${PROJECTION_MONTHS}) entries`, () => {
    render(
      <ProfileProvider>
        <TestConsumer />
      </ProfileProvider>,
    );

    expect(screen.getByTestId("loaded").textContent).toBe("true");
    expect(screen.getByTestId("length").textContent).toBe(String(PROJECTION_MONTHS));
  });

  it("computes a score for an empty profile at index 0 and index 6 (zero income -> guarded, not NaN)", () => {
    render(
      <ProfileProvider>
        <TestConsumer />
      </ProfileProvider>,
    );

    // Empty profile: income/expense/debt all 0. Divide-by-zero must be
    // guarded so this is a real number, not NaN.
    expect(Number.isNaN(Number(screen.getByTestId("score-0").textContent))).toBe(false);
    expect(Number.isNaN(Number(screen.getByTestId("score-6").textContent))).toBe(false);
  });

  it("recomputes the series when the profile changes", async () => {
    render(
      <ProfileProvider>
        <TestConsumer />
      </ProfileProvider>,
    );

    const before = screen.getByTestId("score-0").textContent;

    await userEvent.click(screen.getByRole("button", { name: "seed" }));

    const after = screen.getByTestId("score-0").textContent;
    expect(after).not.toBe(before);
  });

  it("does NOT recompute buildSeries when only unrelated state changes (memo key is `profile` only)", async () => {
    const buildSeriesSpy = vi.spyOn(ProjectionService.prototype, "buildSeries");
    buildSeriesSpy.mockClear();

    render(
      <ProfileProvider>
        <HarnessWithUnrelatedState />
      </ProfileProvider>,
    );

    const callsAfterMount = buildSeriesSpy.mock.calls.length;
    expect(callsAfterMount).toBeGreaterThan(0);

    // Trigger several re-renders driven by state that has nothing to do
    // with the profile (e.g. a slider's selectedIndex on the real page).
    await userEvent.click(screen.getByRole("button", { name: "bump-unrelated-state" }));
    await userEvent.click(screen.getByRole("button", { name: "bump-unrelated-state" }));
    await userEvent.click(screen.getByRole("button", { name: "bump-unrelated-state" }));

    expect(screen.getByTestId("tick").textContent).toBe("3");
    // buildSeries must not have been called again — the memo key is `profile`
    // only, so re-renders from unrelated state must not re-derive the series.
    expect(buildSeriesSpy.mock.calls.length).toBe(callsAfterMount);

    buildSeriesSpy.mockRestore();
  });
});
