import type { ReactNode, SVGProps } from "react";

import { LineItemCategory } from "@/domain/model/LineItem";

/**
 * Decorative visual theme per Cash Flow category (income / expense / debt).
 * Tints are scoped to the input form and intentionally differ from the
 * traffic-light status colors — see design.md §2 (color-rule exception) and
 * the `--color-cat-*` tokens in globals.css.
 */
export interface CategoryTheme {
  /** Soft tinted card background. */
  cardBg: string;
  /** 4px accent left border. */
  accentBorder: string;
  /** Filled icon-chip background (white glyph on top). */
  chipBg: string;
  /** Accent text for the subtotal figure. */
  accentText: string;
  /** Line icon for the category header. */
  icon: ReactNode;
}

function lineIcon(props: SVGProps<SVGSVGElement>) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: "h-5 w-5",
    "aria-hidden": true,
    ...props,
  } as const;
}

const IncomeIcon = (
  // trending-up: money flowing in
  <svg {...lineIcon({})}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

const ExpenseIcon = (
  // trending-down: money flowing out
  <svg {...lineIcon({})}>
    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
    <polyline points="16 17 22 17 22 11" />
  </svg>
);

const DebtIcon = (
  // credit card: liabilities
  <svg {...lineIcon({})}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

export const CATEGORY_THEME: Record<LineItemCategory, CategoryTheme> = {
  income: {
    cardBg: "bg-cat-income-soft",
    accentBorder: "border-l-cat-income",
    chipBg: "bg-cat-income",
    accentText: "text-cat-income",
    icon: IncomeIcon,
  },
  expense: {
    cardBg: "bg-cat-expense-soft",
    accentBorder: "border-l-cat-expense",
    chipBg: "bg-cat-expense",
    accentText: "text-cat-expense",
    icon: ExpenseIcon,
  },
  debt: {
    cardBg: "bg-cat-debt-soft",
    accentBorder: "border-l-cat-debt",
    chipBg: "bg-cat-debt",
    accentText: "text-cat-debt",
    icon: DebtIcon,
  },
};
