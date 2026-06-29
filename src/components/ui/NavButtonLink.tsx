import Link from "next/link";

type NavButtonVariant = "primary" | "secondary";
type ArrowDirection = "left" | "right";

interface NavButtonLinkProps {
  href: string;
  /** Primary = filled CTA (forward step); secondary = outline (back/neutral). */
  variant: NavButtonVariant;
  /** Arrow placement: "left" renders before the label, "right" after. */
  arrow?: ArrowDirection;
  children: React.ReactNode;
}

// Shared button sizing per design.md (MD: 44px tall, 20px x-padding, 16px/600),
// with the common `rounded-button` / `transition-colors` / active + focus states.
const BASE_CLASSES =
  "inline-flex h-11 items-center gap-2 rounded-button px-5 text-base font-semibold transition-colors active:scale-[0.98] focus:outline-none focus:ring-3 focus:ring-primary-soft";

const VARIANT_CLASSES: Record<NavButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "border-2 border-purple-800 bg-transparent text-purple-800 hover:bg-purple-100 focus:border-purple-800",
};

/**
 * A Next.js `Link` styled as a design-system button (kept an anchor so
 * navigation and accessibility are preserved). Used for the inter-page
 * "next / back" navigation across the cash flow → dashboard → mortgage flow.
 */
export function NavButtonLink({ href, variant, arrow, children }: NavButtonLinkProps) {
  return (
    <Link href={href} className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]}`}>
      {arrow === "left" && <ArrowIcon direction="left" />}
      {children}
      {arrow === "right" && <ArrowIcon direction="right" />}
    </Link>
  );
}

function ArrowIcon({ direction }: { direction: ArrowDirection }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={direction === "left" ? "M12 4l-6 6 6 6" : "M8 4l6 6-6 6"} />
    </svg>
  );
}
