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
- [ ] `ScoreGauge` (0–100 + traffic light + icon/text)
- [ ] `RatioCard` (actual value + threshold + status + jargon tooltip)
- [ ] expense donut by category
- [ ] comparison bar: income/expense/debt/remaining
- [ ] `/dashboard` page assembled
- [ ] tests for key components

## Phase 4 — 5-year Projection
- [ ] `MonthSlider` / month selector
- [ ] 5-year score trend line
- [ ] dashboard updates by selected month
- [ ] tests: projection series + month selection

## Phase 5 — Mortgage + Co-borrower
- [ ] `/mortgage` page: inputs (price/age/month) + AssumptionPanel (interest/term/DSR/LTV)
- [ ] MortgageResultCard (affordable/not, max price, payment, DSR after loan, down payment)
- [ ] co-borrower checkbox + co-borrower income/debt inputs → required minimum income
- [ ] badge showing the active LTV rule set (temporary/normal) by date
- [ ] tests: service wired to UI

## Phase 6 — Excel Export
- [ ] `domain/export/`: Exporter (interface) + ExcelExporter (SheetJS)
- [ ] 4 sheets: Cash Flow, Health Check, Mortgage, 5-year Projection
- [ ] Export button on dashboard + mortgage page
- [ ] tests: data structure before export

## Phase 7 — Polish & Accessibility
- [ ] responsive: iPad-first → mobile / desktop
- [ ] all financial-jargon tooltips
- [ ] support prefers-reduced-motion
- [ ] contrast check (green/yellow/red pass WCAG)
- [ ] empty states + mortgage disclaimer (not a real approval)
- [ ] end-to-end QA with real numbers
- [ ] final deploy
