# Bear-tung — Design System (Clean Professional Fintech)

> Design system for the Money Health Check web app.
> Style: clean, professional, financially trustworthy (not childish, not cartoonish).
> Primary device: iPad Air 4 (820×1180 portrait), then responsive.
> Version 0.3 — formalized token tables (radius/shadow/motion), button-size matrix, and
> badge-variant table, with structure adapted from the NovaSpark design system. Bear-tung's
> own values, Thai typography, and WCAG-audited status colors are preserved (NovaSpark's
> Inter font, brighter status palette, and dark mode were intentionally **not** adopted).
> Supersedes v0.2 / the "Skylearn" design system for this project.
> Note: this doc is in English; the app UI is in Thai (sample UI copy below is shown in Thai).

---

## 1. Overview

Bear-tung should make a financially-illiterate user feel **confident and informed** about their money. The tone is professional, trustworthy fintech, yet **warm and approachable** — never intimidating. Principles:

- **Clarity before beauty** — key numbers must be prominent and readable.
- **Color carries meaning** — green/yellow/red signal money health; don't overuse.
- **Generous whitespace** — reduces anxiety when looking at money.
- **Accessible** — color is never the sole signal; always pair with icon + text.

---

## 2. Colors

### Brand / Primary
- **Primary** (#1E5EFF): primary color — primary CTA buttons, links, active state (confident fintech blue)
- **Primary Hover** (#1A52E0)
- **Primary Pressed** (#1645C2)
- **Primary Soft** (#E8EEFF): soft background for active items, highlights

### Money-health status (Traffic Light) — meaning only
- **Good / Green** (#15803D) + soft (#DCFCE7): score 80–100
- **Warning / Yellow** (#A45A0A) + soft (#FEF3C7): score 50–79 (use a deep amber so contrast passes; not bright yellow)
- **Danger / Red** (#C81E1E) + soft (#FEE2E2): score 0–49

> Phase 7 contrast audit (`scripts/check-contrast.mjs`, WCAG relative-luminance formula): the
> originally-specified shades (#16A34A / #D97706 / #DC2626) all **failed** the 4.5:1 AA text
> threshold against white, the page background, and — the actual `StatusBadge` pairing — their
> own soft background (ratios 2.86–4.83:1). Darkened to the values above (same hue family,
> lightness reduced) so every pairing now passes at 4.52–5.74:1. See `globals.css`'s `@theme`
> block for the full audit comment.

### Neutrals (Ink & Surface)
- **Ink** (#0F172A): primary text (near-black navy, easy on the eyes)
- **Ink Muted** (#475569): secondary text, descriptions
- **Ink Subtle** (#94A3B8): metadata, units, small labels
- **Ink Faint** (#CBD5E1): disabled, placeholder
- **Background** (#F7F9FC): page background (very light blue-gray, clean)
- **Surface** (#FFFFFF): cards, panels
- **Surface Sunken** (#F1F5F9): inset areas, wells
- **Outline** (#E2E8F0): card edges, dividers
- **Outline Strong** (#94A3B8): focus ring, prominent dividers

### Accent (charts / expense categories) — donut/bar palette
Cool/neutral tones for a professional, non-garish look:
`#1E5EFF` `#0EA5E9` `#14B8A6` `#8B5CF6` `#F59E0B` `#64748B`

> Note: the traffic-light colors (green/yellow/red) are **reserved for money-health status only**. Don't use them as chart category colors, to avoid confusing the meaning.

---

## 3. Typography

Supports Thai + English (numbers/jargon) — pick a font that renders Thai well and has tabular numbers.

- **Display / Heading:** `IBM Plex Sans Thai` (fallback: `Noto Sans Thai`, `Sarabun`, sans-serif)
- **Body / UI:** `IBM Plex Sans Thai` (weights 400/500) — same family for cleanliness
- **Numbers / Mono:** `IBM Plex Mono`, or use `font-variant-numeric: tabular-nums` on money/percent figures so digits align

**Type scale (px / line-height):**
| Token | Size/LH | Weight | Use |
|---|---|---|---|
| Display | 40/48 | 700 | big score, page titles |
| Score Number | 56/56 | 700 tabular | the health score number |
| H1 | 32/40 | 700 | main headings |
| H2 | 24/32 | 600 | section headings |
| H3 | 20/28 | 600 | card titles |
| Body Large | 18/28 | 400 | important text/descriptions |
| Body | 16/24 | 400 | general text |
| Label | 14/20 | 500 | form labels |
| Caption | 13/18 | 400 | units, metadata |

Minimum text size 13px; always use tabular-nums for money figures.

---

## 4. Spacing & Layout

- **Base unit:** 4px — scale: 4, 8, 12, 16, 24, 32, 48, 64
- **Min tap target:** 44px (touch on iPad)
- **Container (iPad portrait 820px):** 24px edge padding, content max-width ~772px
- **Card padding:** 24px
- **Card grid gap:** 16px (mobile) / 24px (iPad+)
- **Section spacing:** 32–48px between major sections

**Layout iPad Air 4 (820×1180 portrait) — primary:**
- Dashboard: score + traffic light prominent at top → ratio cards in 2 columns → charts below
- Form: category groups (income/expense/debt) as vertically stacked cards, easy to fill by finger
- Responsive: ≤640px → 1 column; ≥1024px → expand max-width 1080px, allow 3 columns

---

## 5. Elevation & Radius

Formalized as tokens in `globals.css`'s `@theme` block (Tailwind v4 generates the
matching utilities). Token-table structure adapted from the NovaSpark design system;
the **values are Bear-tung's own** (kept from earlier ad-hoc usage, not NovaSpark's).

**Radius** — role-based names; `--radius-*` → `rounded-*` utilities:
| Token | Utility | Value | Use |
|---|---|---|---|
| `--radius-sm` | `rounded-sm` | 4px | checkbox, small controls |
| `--radius-input` | `rounded-input` | 8px | inputs, chips, selects |
| `--radius-button` | `rounded-button` | 12px | buttons |
| `--radius-card` | `rounded-card` | 16px | cards, panels |
| `--radius-modal` | `rounded-modal` | 24px | modals, large panels |
| `--radius-pill` | `rounded-pill` | 999px | pills, status badges |

**Shadow** — `--shadow-*` → `shadow-*` utilities:
| Token | Utility | Value | Use |
|---|---|---|---|
| `--shadow-card` | `shadow-card` | `0 1px 3px rgba(15,23,42,0.06)` | default card lift |
| `--shadow-card-hover` | `shadow-card-hover` | `0 6px 20px rgba(15,23,42,0.08)` | interactive card hover, popover |
| `--shadow-modal` | `shadow-modal` | `0 24px 48px rgba(15,23,42,0.12)` | modal (+ light backdrop blur) |

- **Card:** 1px border (#E2E8F0) + `shadow-card`.
- **Card hover (if interactive):** `shadow-card-hover` + slight `translateY(-2px)`.

---

## 6. Components

- **Score Gauge:** circular/semi-circular 0–100 score, big 56px number centered, ring colored by traffic light + status label (icon + text, e.g. "🟢 สุขภาพการเงินดี").
- **Ratio Card:** one card per ratio — name (Thai + EN jargon), actual value (prominent), threshold comparison, colored status bar/badge, a "ดูวิธีคิด" (how it's calculated) link.
- **Stat / Summary Card:** total income / expense / debt / remaining — tabular number + category icon.
- **Input Field:** 1px border, radius 8px, padding 12×16, body 16px, suffix "บาท" or "/เดือน"; focus = primary border + 3px primary-soft ring; auto comma-formatting.
- **Category Group (form):** card grouping multiple inputs in one category, with a subtotal at the bottom.
- **Primary Button:** 48px tall, `rounded-button`, primary fill, white text 16px/600; hover deepens (`primary-hover`); active scale 0.98.
- **Secondary Button:** surface background, outline border, ink text.
- **Button sizes** (matrix adapted from NovaSpark; heights honor the 44px min tap target on touch):
  | Size | Height | Padding (x) | Font | Use |
  |---|---|---|---|---|
  | SM | 36px | 16px | 14px/600 | dense rows, inline actions (mouse/secondary contexts) |
  | MD | 44px | 20px | 16px/600 | default; meets min tap target |
  | LG | 48px | 32px | 16px/600 | primary CTAs (Cash Flow start, submit) |

  All sizes: `rounded-button`, `transition-colors`, `active:scale-[0.98]`; disabled = 40% opacity; focus = primary border + 3px `primary-soft` ring.
- **Chart Card (Recharts):** donut (expense breakdown), bar (comparison), clear legend, tooltip with value + %.
- **Traffic Light Badge:** `rounded-pill` — green/yellow/red + icon (✓ / ! / ✕) + text; never color-only.
- **Badge / Tag variants** (table adapted from NovaSpark; uses Bear-tung's *audited* status colors, never NovaSpark's brighter shades which failed AA — see §2):
  | Variant | Background | Text | Use |
  |---|---|---|---|
  | Neutral | `surface-sunken` (#F1F5F9) | `ink-muted` (#475569) | tags, metadata |
  | Primary | `primary-soft` (#E8EEFF) | `primary` (#1E5EFF) | active rule set, info |
  | Good | `good-soft` (#DCFCE7) | `good` (#15803D) | healthy status (score 80–100) |
  | Warning | `warning-soft` (#FEF3C7) | `warning` (#A45A0A) | caution (score 50–79) |
  | Danger | `danger-soft` (#FEE2E2) | `danger` (#C81E1E) | at-risk status (score 0–49) |
- **Mortgage Result Card:** affordable/not (color + icon), max home price, monthly payment, DSR after loan, required down payment.
- **Assumption Panel:** fields to adjust interest/term/DSR/LTV with defaults and a badge showing which rule set is active (temporary/normal).
- **Export Button:** secondary button + table icon, label "Export Excel".
- **Tooltip / Explain Popover:** explains a financial term when the (?) icon is tapped — important for non-financial users.
- **Empty State:** "ยังไม่มีข้อมูล — เริ่มกรอก Cash Flow ของคุณ" + start button.

---

## 7. Motion

Smooth, professional, not flashy (no confetti):

- Standard transition: 200ms `cubic-bezier(0.4, 0, 0.2, 1)` — exposed as `--ease-standard` (→ `ease-standard`); this also matches Tailwind's default transition easing, so bare `transition-colors` already conforms.
- Gauge / progress fill: 600ms ease-out (count-up allowed)
- Bar/donut entrance: 400ms ease-out
- Respect `prefers-reduced-motion`: disable count-up/fill animations, snap to final value

---

## 8. Iconography

Line icons, 2px rounded — professional tone:
wallet, house, car, credit card, plate (food), light bulb (utilities), shopping bag, chart, shield (savings/safe), and ✓ ! ✕ for status.
Default size 20–24px in ink-muted; active = primary; status = traffic-light color by context.

---

## 9. Accessibility

- Contrast: body ≥ 4.5:1, large text ≥ 3:1 (green/yellow/red shades chosen to pass on white — hence deep amber #A45A0A instead of bright yellow).
- **Color is never the sole signal**: traffic light always pairs with icon + text.
- Tap target ≥ 44px.
- Clear focus ring on every interactive element.
- Money figures: tabular-nums + thousands separators + unit "บาท".
- Support reduced-motion.

---

## 10. Voice & Tone (Thai UI copy)

- Clear, direct, encouraging, non-judgmental: "หนี้ของคุณค่อนข้างสูง ลองดูวิธีปรับด้านล่าง" not "คุณมีหนี้เยอะเกินไป!"
- Always explain jargon: "DSR (สัดส่วนภาระหนี้ต่อรายได้) คือ..."
- Numbers with meaning: not just "45%" but "DSR 45% — เริ่มตึง ควรลดหนี้".
- Honest mortgage disclaimer: "เป็นการประมาณการเพื่อการศึกษา ไม่ใช่การอนุมัติจากธนาคาร".

---

## 11. Do's & Don'ts

- ✅ Use tabular numbers for all money/percent figures
- ✅ Pair status color with icon + text
- ✅ Reserve green/yellow/red for money-health status only
- ✅ Explain financial jargon via tooltip/popover
- ✅ Design at iPad Air 4 size first, then make responsive
- ❌ Don't use bright yellow that's unreadable on white
- ❌ Don't make it look cartoonish/childish (no confetti, no stickers)
- ❌ Don't show the score as a black box — always reveal its source
- ❌ Don't rely on color as the only signal
