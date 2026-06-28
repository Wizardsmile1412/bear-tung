#!/usr/bin/env node
/**
 * WCAG contrast-ratio audit for the colors in `src/app/globals.css`'s
 * `@theme` block (design.md section 9 claims these "pass on white" — this
 * script verifies that claim with the actual formulas instead of trusting
 * it blindly).
 *
 * WCAG 2.x formulas:
 *   linearize(c) = c <= 0.03928 ? c/12.92 : ((c+0.055)/1.055)^2.4   // c = channel/255
 *   L = 0.2126*linearize(R) + 0.7152*linearize(G) + 0.0722*linearize(B)
 *   contrast(L1, L2) = (max(L1,L2) + 0.05) / (min(L1,L2) + 0.05)
 *
 * AA thresholds: 4.5:1 for normal text, 3:1 for large text (>=18px, or
 * >=14px bold) and for non-text UI components (icons, badge borders).
 *
 * Run with: node scripts/check-contrast.mjs
 */

/** @param {string} hex e.g. '#16A34A' */
function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function linearize(channel255) {
  const c = channel255 / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(hexA, hexB) {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// Colors from src/app/globals.css's @theme block. good/warning/danger were
// darkened from design.md's original #16A34A/#D97706/#DC2626 after this
// script's first run found those originals failed AA — see globals.css's
// comment on the @theme block for the audit history.
const COLORS = {
  good: "#15803D",
  goodSoft: "#DCFCE7",
  warning: "#A45A0A",
  warningSoft: "#FEF3C7",
  danger: "#C81E1E",
  dangerSoft: "#FEE2E2",
  ink: "#0F172A",
  inkMuted: "#475569",
  surface: "#FFFFFF",
  background: "#F7F9FC",
  primary: "#1E5EFF",
  primarySoft: "#E8EEFF",

  // Cash Flow category tints (decorative, design.md §2 exception).
  catIncome: "#047857",
  catIncomeSoft: "#ECFDF5",
  catExpense: "#B91C1C",
  catExpenseSoft: "#FEF2F2",
  catDebt: "#B45309",
  catDebtSoft: "#FFFBEB",
};

/** @typedef {{ label: string, fg: string, bg: string, threshold: number, thresholdLabel: string }} Pair */

/** @type {Pair[]} */
const PAIRS = [
  { label: "good on white", fg: COLORS.good, bg: COLORS.surface, threshold: 4.5, thresholdLabel: "4.5:1 (normal text)" },
  { label: "good on background", fg: COLORS.good, bg: COLORS.background, threshold: 4.5, thresholdLabel: "4.5:1 (normal text)" },
  { label: "warning on white", fg: COLORS.warning, bg: COLORS.surface, threshold: 4.5, thresholdLabel: "4.5:1 (normal text)" },
  { label: "warning on background", fg: COLORS.warning, bg: COLORS.background, threshold: 4.5, thresholdLabel: "4.5:1 (normal text)" },
  { label: "danger on white", fg: COLORS.danger, bg: COLORS.surface, threshold: 4.5, thresholdLabel: "4.5:1 (normal text)" },
  { label: "danger on background", fg: COLORS.danger, bg: COLORS.background, threshold: 4.5, thresholdLabel: "4.5:1 (normal text)" },

  // StatusBadge pairing: text color on its own soft background.
  { label: "good on good-soft (StatusBadge)", fg: COLORS.good, bg: COLORS.goodSoft, threshold: 4.5, thresholdLabel: "4.5:1 (normal text)" },
  { label: "warning on warning-soft (StatusBadge)", fg: COLORS.warning, bg: COLORS.warningSoft, threshold: 4.5, thresholdLabel: "4.5:1 (normal text)" },
  { label: "danger on danger-soft (StatusBadge)", fg: COLORS.danger, bg: COLORS.dangerSoft, threshold: 4.5, thresholdLabel: "4.5:1 (normal text)" },

  { label: "ink on white (primary body text)", fg: COLORS.ink, bg: COLORS.surface, threshold: 4.5, thresholdLabel: "4.5:1 (normal text)" },
  { label: "ink on background (primary body text)", fg: COLORS.ink, bg: COLORS.background, threshold: 4.5, thresholdLabel: "4.5:1 (normal text)" },
  { label: "ink-muted on white (secondary text)", fg: COLORS.inkMuted, bg: COLORS.surface, threshold: 4.5, thresholdLabel: "4.5:1 (normal text)" },

  { label: "white on primary (button text)", fg: COLORS.surface, bg: COLORS.primary, threshold: 4.5, thresholdLabel: "4.5:1 (normal text)" },

  // Cash Flow category cards: accent subtotal text on its own soft card
  // background, and white icon glyph on the filled accent chip.
  { label: "cat-income on income-soft (subtotal)", fg: COLORS.catIncome, bg: COLORS.catIncomeSoft, threshold: 4.5, thresholdLabel: "4.5:1 (normal text)" },
  { label: "cat-expense on expense-soft (subtotal)", fg: COLORS.catExpense, bg: COLORS.catExpenseSoft, threshold: 4.5, thresholdLabel: "4.5:1 (normal text)" },
  { label: "cat-debt on debt-soft (subtotal)", fg: COLORS.catDebt, bg: COLORS.catDebtSoft, threshold: 4.5, thresholdLabel: "4.5:1 (normal text)" },
  { label: "white on cat-income (icon chip)", fg: COLORS.surface, bg: COLORS.catIncome, threshold: 3, thresholdLabel: "3:1 (icon/non-text)" },
  { label: "white on cat-expense (icon chip)", fg: COLORS.surface, bg: COLORS.catExpense, threshold: 3, thresholdLabel: "3:1 (icon/non-text)" },
  { label: "white on cat-debt (icon chip)", fg: COLORS.surface, bg: COLORS.catDebt, threshold: 3, thresholdLabel: "3:1 (icon/non-text)" },
  { label: "white on primary (savings icon chip)", fg: COLORS.surface, bg: COLORS.primary, threshold: 3, thresholdLabel: "3:1 (icon/non-text)" },
];

function padRight(text, width) {
  return text.length >= width ? text : text + " ".repeat(width - text.length);
}
function padLeft(text, width) {
  return text.length >= width ? text : " ".repeat(width - text.length) + text;
}

console.log("WCAG contrast-ratio audit (Bear-tung design tokens)\n");
console.log(`${padRight("Pair", 42)} ${padLeft("Ratio", 8)} ${padRight("Threshold", 20)} Pass?`);
console.log("-".repeat(82));

let anyFailed = false;
for (const pair of PAIRS) {
  const ratio = contrastRatio(pair.fg, pair.bg);
  const passes = ratio >= pair.threshold;
  if (!passes) anyFailed = true;
  console.log(
    `${padRight(pair.label, 42)} ${padLeft(ratio.toFixed(2) + ":1", 8)} ${padRight(pair.thresholdLabel, 20)} ${passes ? "PASS" : "FAIL"}`,
  );
}

console.log("\n" + (anyFailed ? "Some pairs FAILED the AA threshold." : "All pairs pass AA."));
process.exitCode = anyFailed ? 1 : 0;
