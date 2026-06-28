import { Tone } from "./trafficLight";

interface StatusBadgeProps {
  tone: Tone;
  label: string;
}

const TONE_STYLES: Record<Tone, { bg: string; text: string; icon: string }> = {
  good: { bg: "bg-good-soft", text: "text-good", icon: "✓" },
  warning: { bg: "bg-warning-soft", text: "text-warning", icon: "!" },
  danger: { bg: "bg-danger-soft", text: "text-danger", icon: "✕" },
};

/**
 * Traffic-light pill (design.md "Traffic Light Badge"): colored background +
 * colored icon + text. Color is never the sole signal — the icon and label
 * text both carry the same meaning independently of color.
 */
export function StatusBadge({ tone, label }: StatusBadgeProps) {
  const styles = TONE_STYLES[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-sm font-medium ${styles.bg} ${styles.text}`}
    >
      <span aria-hidden="true">{styles.icon}</span>
      <span>{label}</span>
    </span>
  );
}
