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
