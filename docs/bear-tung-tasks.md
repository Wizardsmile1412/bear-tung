# Bear-tung — Tasks Checklist

> Tasks grouped by phase — check `[x]` when done (passing DoD: tests + lint pass, results reported).
> See the workflow in `bear-tung-workflow.md`, details in `bear-tung-plan.md`.
> Legend: `[ ]` not done · `[x]` done · ⭐ important

---

## Phase 0 — Setup & Deploy skeleton
- [x] `npx create-next-app@latest` (TypeScript, Tailwind, ESLint, App Router, src/)
- [x] Install libs: recharts, xlsx, dayjs
- [x] Install dev libs: vitest, @testing-library/react, @testing-library/jest-dom, coverage provider
- [x] Add package.json scripts: `dev`, `build`, `lint`, `test`, `test:coverage`
- [x] Add colors/fonts from design.md into `@theme` tokens (Tailwind v4 is CSS-first — no `tailwind.config.ts`) + import Thai font
- [x] Write `README.md`
- [x] Place `CLAUDE.md` at repo root
- [x] Set up `.gitignore` (`.prettierrc`/`.nvmrc` skipped — optional per plan.md)
- [x] Push to GitHub
- [ ] Connect Vercel → get a working URL
- [x] ✅ commit: `chore: set up tooling, docs, and design theme (Phase 0)`

## Phase 1 — Data model + Storage + Cash Flow form
- [x] `domain/model/`: Money, MonthKey, LineItem, CashFlowProfile
- [x] `domain/storage/`: ProfileRepository (interface) + LocalStorageProfileRepository
- [x] `useProfile()` hook + React Context (repository injected)
- [x] `/cashflow` page: categorized form (income/expense/debt/savings)
- [x] line item editor: value-change date (carry-forward) + debt end date (endMonth)
- [x] save/load from local storage works
- [x] tests: model + storage + carry-forward
- [x] ✅ commit: `feat: add cash flow data model, local storage, and entry form (Phase 1)`

## Phase 2 — Finance core (domain, OOP + SOLID) ⭐
- [x] `domain/ratios/`: Ratio (interface) + SavingsRateRatio, DsrRatio, EmergencyFundRatio
- [x] `domain/scoring/HealthScoreService` (weights 35/35/30 + traffic light)
- [x] `domain/mortgage/`: LtvPolicy (interface), TemporaryLtvPolicy, NormalLtvPolicy, LtvPolicyFactory
- [x] `domain/mortgage/AmortizationCalculator`
- [x] `domain/mortgage/MortgageService` (LTV + DSR + term cap by age 70)
- [x] `domain/mortgage/CoBorrowerService`
- [x] `domain/projection/ProjectionService` (60-month series)
- [x] `domain/config/defaults.ts` (6.5%, 30y, DSR 40%, weights, date-based LTV rules)
- [x] ⭐ full unit tests + edge cases (zero income, zero interest, debt ending mid-way, age-capped term) → coverage ≥ 80%

## Phase 3 — Health Dashboard
- [x] `ScoreGauge` (0–100 + traffic light + icon/text)
- [x] `RatioCard` (actual value + threshold + status + jargon tooltip)
- [x] expense donut by category
- [x] comparison bar: income/expense/debt/remaining
- [x] `/dashboard` page assembled
- [x] tests for key components

## Phase 4 — 5-year Projection
- [x] `MonthSlider` / month selector
- [x] 5-year score trend line
- [x] dashboard updates by selected month
- [x] tests: projection series + month selection

## Phase 5 — Mortgage + Co-borrower
- [x] `/mortgage` page: inputs (price/age/month) + AssumptionPanel (interest/term/DSR/LTV)
- [x] MortgageResultCard (affordable/not, max price, payment, DSR after loan, down payment)
- [x] co-borrower checkbox + co-borrower income/debt inputs → required minimum income
- [x] badge showing the active LTV rule set (temporary/normal) by date
- [x] tests: service wired to UI

## Phase 6 — Excel Export
- [x] `domain/export/`: Exporter (interface) + ExcelExporter (SheetJS)
- [x] 4 sheets: Cash Flow, Health Check, Mortgage, 5-year Projection
- [x] Export button on dashboard + mortgage page
- [x] tests: data structure before export

## Phase 7 — Polish & Accessibility
- [x] responsive: iPad-first → mobile / desktop
- [x] all financial-jargon tooltips
- [x] support prefers-reduced-motion
- [x] contrast check (green/yellow/red pass WCAG)
- [x] empty states + mortgage disclaimer (not a real approval)
- [x] end-to-end QA with real numbers
- [ ] final deploy
