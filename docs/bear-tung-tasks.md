# Bear-tung — Tasks Checklist

> Tasks grouped by phase — check `[x]` when done (passing DoD: tests + lint pass, results reported).
> See the workflow in `bear-tung-workflow.md`, details in `bear-tung-plan.md`.
> Legend: `[ ]` not done · `[x]` done · ⭐ important

---

## Phase 0 — Setup & Deploy skeleton
- [ ] `npx create-next-app@latest` (TypeScript, Tailwind, ESLint, App Router, src/)
- [ ] Install libs: recharts, xlsx, dayjs
- [ ] Install dev libs: vitest, @testing-library/react, @testing-library/jest-dom, coverage provider
- [ ] Add package.json scripts: `dev`, `build`, `lint`, `test`, `test:coverage`
- [ ] Add colors/fonts from design.md into `tailwind.config.ts` + import Thai font
- [ ] Write `README.md`
- [ ] Place `CLAUDE.md` at repo root
- [ ] Set up `.gitignore`, `.prettierrc`, `.nvmrc`
- [ ] Push to GitHub
- [ ] Connect Vercel → get a working URL
- [ ] ✅ commit: `chore: scaffold next.js project + tooling`

## Phase 1 — Data model + Storage + Cash Flow form
- [ ] `domain/model/`: Money, MonthKey, LineItem, CashFlowProfile
- [ ] `domain/storage/`: ProfileRepository (interface) + LocalStorageProfileRepository
- [ ] `useProfile()` hook + React Context (repository injected)
- [ ] `/cashflow` page: categorized form (income/expense/debt/savings)
- [ ] line item editor: value-change date (carry-forward) + debt end date (endMonth)
- [ ] save/load from local storage works
- [ ] tests: model + storage + carry-forward

## Phase 2 — Finance core (domain, OOP + SOLID) ⭐
- [ ] `domain/ratios/`: Ratio (interface) + SavingsRateRatio, DsrRatio, EmergencyFundRatio
- [ ] `domain/scoring/HealthScoreService` (weights 35/35/30 + traffic light)
- [ ] `domain/mortgage/`: LtvPolicy (interface), TemporaryLtvPolicy, NormalLtvPolicy, LtvPolicyFactory
- [ ] `domain/mortgage/AmortizationCalculator`
- [ ] `domain/mortgage/MortgageService` (LTV + DSR + term cap by age 70)
- [ ] `domain/mortgage/CoBorrowerService`
- [ ] `domain/projection/ProjectionService` (60-month series)
- [ ] `domain/config/defaults.ts` (6.5%, 30y, DSR 40%, weights, date-based LTV rules)
- [ ] ⭐ full unit tests + edge cases (zero income, zero interest, debt ending mid-way, age-capped term) → coverage ≥ 80%

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
