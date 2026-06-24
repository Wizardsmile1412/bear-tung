"use client";

import { useMemo } from "react";

import { MonthlyProjectionEntry } from "@/domain/projection/ProjectionService";
import { createProjectionService } from "@/domain/projection/createProjectionService";

import { useProfile } from "@/components/profile/useProfile";

// Stateless pure service — safe to create once at module scope rather than
// per-render or per-component-instance (same justification as useHealth.ts's
// module-level healthScoreService singleton).
const projectionService = createProjectionService();

export interface UseProjectionSeriesResult {
  isLoaded: boolean;
  series: MonthlyProjectionEntry[];
}

/**
 * Builds the full 60-month projection series for the current profile.
 *
 * The memo key is `profile` only — a "selected month index" tracked
 * elsewhere on the page (e.g. by `MonthSlider`) must never cause
 * `buildSeries` to re-run, since the whole series already contains every
 * month's data. Re-deriving 60 months of ratios on every slider drag would
 * be wasteful; this hook guarantees that doesn't happen.
 */
export function useProjectionSeries(): UseProjectionSeriesResult {
  const { profile, isLoaded } = useProfile();

  const series = useMemo(() => projectionService.buildSeries(profile), [profile]);

  return { isLoaded, series };
}
