export type TrafficLight = "green" | "yellow" | "red";
export type Tone = "good" | "warning" | "danger";

/**
 * Maps the domain's `HealthScoreService` traffic-light value to the same
 * `good | warning | danger` tone vocabulary that `RatioResult.status`
 * already uses, so `ScoreGauge` and `RatioCard` can both render through the
 * same `StatusBadge` without duplicating the color mapping.
 */
export function lightToTone(light: TrafficLight): Tone {
  switch (light) {
    case "green":
      return "good";
    case "yellow":
      return "warning";
    case "red":
      return "danger";
  }
}

// Single source of truth for the short Thai status word shown by both
// `RatioCard` (keyed on `RatioResult.status`, already a `Tone`) and
// `ScoreTrendChart` (which derives a `Tone` from a raw score via the
// domain's `statusFromScore`, then looks it up here). Keeping one mapping
// avoids a 3rd inline copy of "good/warning/danger -> ดี/พอใช้/ต้องระวัง"
// drifting out of sync with the other two.
const TONE_LABEL: Record<Tone, string> = {
  good: "ดี",
  warning: "พอใช้",
  danger: "ต้องระวัง",
};

/** The short Thai status word for a given `Tone` (e.g. 'good' -> 'ดี'). */
export function toneLabel(tone: Tone): string {
  return TONE_LABEL[tone];
}
