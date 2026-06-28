"use client";

import { useState } from "react";

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
  className: string;
  placeholder?: string;
  required?: boolean;
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
 * reported to `onChange`.
 */
export function NumericField<T extends number | undefined = number>({
  id,
  value,
  onChange,
  inputMode = "decimal",
  allowDecimal = false,
  optional = false,
  className,
  placeholder,
  required,
}: NumericFieldProps<T>) {
  const [text, setText] = useState(value === undefined || value === 0 ? "" : String(value));
  const pattern = allowDecimal ? /^\d*\.?\d*$/ : /^\d*$/;
  const clearValue = (optional ? undefined : 0) as T;

  return (
    <input
      id={id}
      type="text"
      inputMode={inputMode}
      value={text}
      onChange={(event) => {
        const raw = event.target.value;
        if (!pattern.test(raw)) return;
        setText(raw);

        if (raw === "" || raw === ".") {
          onChange(clearValue);
          return;
        }
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) onChange(parsed as T);
      }}
      placeholder={placeholder}
      required={required}
      className={className}
    />
  );
}
