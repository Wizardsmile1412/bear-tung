"use client";

import { useLayoutEffect, useRef, useState } from "react";

interface NumericFieldProps<T extends number | undefined> {
  id: string;
  value: T;
  onChange(value: T): void;
  inputMode?: "numeric" | "decimal";
  allowDecimal?: boolean;
  /**
   * When true, clearing the field reports `undefined` ("not provided")
   * instead of `0`. A `clearValue={undefined}` prop can't express this —
   * React/JS treats an explicit `undefined` prop the same as an omitted
   * one, so a default would silently win over it.
   */
  optional?: boolean;
  /** Displays the integer part grouped with comma separators (e.g. "1,000,000") — for money fields. */
  thousandsSeparator?: boolean;
  className: string;
  placeholder?: string;
  required?: boolean;
}

function insertThousandsSeparators(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Groups the integer part of a comma-free numeric string for display; the decimal part (if any) is left untouched. */
function formatGrouped(rawValue: string): string {
  const dotIndex = rawValue.indexOf(".");
  if (dotIndex === -1) return insertThousandsSeparators(rawValue);
  return `${insertThousandsSeparators(rawValue.slice(0, dotIndex))}${rawValue.slice(dotIndex)}`;
}

/**
 * Caret offset in `formatted` landing right after its `count`-th non-comma
 * character — used to keep the caret put when comma insertion shifts
 * offsets out from under an in-progress keystroke.
 */
function caretAfterNonCommaCount(formatted: string, count: number): number {
  if (count <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] !== ",") {
      seen++;
      if (seen === count) return i + 1;
    }
  }
  return formatted.length;
}

/**
 * Plain numeric text input — no spinner arrows. A `type="number"` input
 * bound to `0` can leave the cursor in front of the "0" on some mobile
 * browsers, so typing "65" silently becomes "065"; this shows an empty
 * field instead for `0`/`undefined` and keeps its own text buffer so an
 * in-progress decimal point isn't dropped before the next digit lands.
 * Disallowed keystrokes (anything but digits, and a single "." when
 * `allowDecimal`) are ignored outright rather than let through and
 * clamped, so the displayed text never disagrees with the last value
 * reported to `onChange`. `thousandsSeparator` additionally groups the
 * displayed text with commas, restoring caret position afterward since
 * comma insertion/removal shifts character offsets out from under the
 * browser's own caret placement.
 *
 * If `value` changes to something other than what this field itself last
 * reported via `onChange` (e.g. another field's handler clamps this one's
 * value, like loanTermYears being capped by a borrowerAge change), the
 * displayed text resyncs to match — otherwise the buffer would keep
 * showing stale text the external change just overrode.
 */
export function NumericField<T extends number | undefined = number>({
  id,
  value,
  onChange,
  inputMode = "decimal",
  allowDecimal = false,
  optional = false,
  thousandsSeparator = false,
  className,
  placeholder,
  required,
}: NumericFieldProps<T>) {
  function formatDisplay(v: T): string {
    const raw = v === undefined || v === 0 ? "" : String(v);
    return thousandsSeparator ? formatGrouped(raw) : raw;
  }

  const [text, setText] = useState(() => formatDisplay(value));
  const [lastReportedValue, setLastReportedValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const pattern = allowDecimal ? /^\d*\.?\d*$/ : /^\d*$/;
  const clearValue = (optional ? undefined : 0) as T;

  // Adjusting state during render (react.dev/learn/you-might-not-need-an-effect)
  // rather than a ref, since refs may not be read/written during render.
  if (value !== lastReportedValue) {
    setLastReportedValue(value);
    const resynced = formatDisplay(value);
    if (resynced !== text) setText(resynced);
  }

  useLayoutEffect(() => {
    if (pendingCaretRef.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(pendingCaretRef.current, pendingCaretRef.current);
      pendingCaretRef.current = null;
    }
  }, [text]);

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode={inputMode}
      value={text}
      onChange={(event) => {
        const rawInput = event.target.value;
        const stripped = thousandsSeparator ? rawInput.replace(/,/g, "") : rawInput;
        if (!pattern.test(stripped)) return;

        if (thousandsSeparator) {
          const caretPos = event.target.selectionStart ?? rawInput.length;
          const countBeforeCaret = rawInput.slice(0, caretPos).replace(/,/g, "").length;
          const formatted = formatGrouped(stripped);
          pendingCaretRef.current = caretAfterNonCommaCount(formatted, countBeforeCaret);
          setText(formatted);
        } else {
          setText(rawInput);
        }

        if (stripped === "" || stripped === ".") {
          setLastReportedValue(clearValue);
          onChange(clearValue);
          return;
        }
        const parsed = Number(stripped);
        if (Number.isFinite(parsed)) {
          setLastReportedValue(parsed as T);
          onChange(parsed as T);
        }
      }}
      placeholder={placeholder}
      required={required}
      className={className}
    />
  );
}
