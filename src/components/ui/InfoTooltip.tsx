"use client";

import { useEffect, useRef, useState } from "react";

interface InfoTooltipProps {
  /**
   * The Thai explanation text revealed when the (?) icon is toggled open.
   * `\n` line breaks are preserved (rendered via `whitespace-pre-line`), so
   * multi-line/bulleted explanations are supported.
   */
  label: string;
}

/**
 * Design.md's "Tooltip / Explain Popover" component: a small `(?)` icon
 * button that reveals a short Thai explanation when clicked — the same
 * accessible-toggle pattern as `RatioCard`'s "ดูวิธีคิด" (`useState` +
 * `aria-expanded`), not a hover-only tooltip, since hover doesn't work on
 * touch/iPad, this app's primary target device.
 */
export function InfoTooltip({ label }: InfoTooltipProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  // Dismiss on any outside click, matching MonthPicker's popover behavior.
  useEffect(() => {
    if (!isExpanded) return;

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isExpanded]);

  return (
    <span ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-label="ดูคำอธิบาย"
        onClick={() => setIsExpanded((current) => !current)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-pill border border-outline text-xs font-semibold text-ink-muted hover:bg-surface-sunken transition-colors"
      >
        ?
      </button>

      {isExpanded && (
        <span className="absolute left-0 top-full z-10 mt-2 w-64 whitespace-pre-line rounded-card border border-outline bg-surface p-3 text-sm text-ink-muted shadow-card-hover">
          {label}
        </span>
      )}
    </span>
  );
}
