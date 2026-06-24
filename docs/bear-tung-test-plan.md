# Bear-tung — Test Plan

> Testing strategy + "when to test".
> Read with `bear-tung-workflow.md` (DoD + pass criteria) and `bear-tung-architecture.md`.
> Version 0.2 — English.

---

## 1. Goal

The correctness of the **financial calculations** is the heart of the app — it cannot be wrong — so the focus is unit tests on the domain layer.

**Coverage target: ≥ 80% overall · the domain layer should approach 100%.**

---

## 2. Tools

- **Vitest** — test runner
- **@testing-library/react** + **@testing-library/jest-dom** — component tests
- **coverage** — v8 provider (`vitest run --coverage`)

---

## 3. When to test

| When | What to do |
|---|---|
| **After each task** | Run the **relevant test + lint** and **report results before declaring done** (DoD — mandatory) |
| **Before handing to engineer** | Run full test suite + coverage → must be **all tests pass + coverage ≥ 80%** |
| **Before commit** | Run full suite + lint, must pass (never commit a red state) |
| **End of phase** | Full suite + manual QA with real numbers |

---

## 4. Test types

### 4.1 Unit tests — domain layer (highest priority)
Test every calculation class/function in isolation (DIP/mocking allowed).

### 4.2 Component tests — key UI
Input forms, score/traffic-light rendering, month selection.

### 4.3 Manual QA
Verify end-to-end against the sample numbers (section 6).

---

## 5. Test cases per module (domain)

### ratios/
- SavingsRate: ≥20% → 100, middle range → linear, negative → 0
- DSR: ≤30%→100, 40%, 60%, >60%→near 0
- EmergencyFund: ≥6 mo→100, 3–6, <1 mo→at risk
- Edge cases: **income = 0** (no divide-by-zero), negative values

### scoring/
- Weighting 35/35/30 is correct
- Traffic-light bands: 80 → green, 79/50 → yellow, 49 → red

### mortgage/
- Amortization: loan 3,000,000 @6.5% 30y → ~18,962/month (round-trips back)
- **interest = 0** (special formula: payment = P/n)
- LtvPolicyFactory: date ≤ 30 Jun 2026 → Temporary(100%), after → Normal
- NormalLtvPolicy: home order 1/2/3 + price <10M / ≥10M gives correct %
- term cap: age 40→30y, 50→20y, 55→15y (age + term ≤ 70)
- MortgageService: maxLoan = min(LTV, DSR), canAfford correct, distinguishes LTV- vs DSR-bound

### coborrower/
- required co-income = max(0, (payment+userDebt+coDebt)/dsr − userIncome)
- example: home 4M, down 1M, user 35k/debt 5k, coDebt 3k → co-borrower ~32,405/month
- case: sole borrower already qualifies → required = 0
- case: LTV-bound (insufficient down payment) → co-borrower can't help, separate message

### projection/
- carry-forward: salary 35k → changes to 45k 2027-01 → before uses 35k, after uses 45k
- debt with endMonth: disappears from cash flow after that month
- series is exactly 60 months long
- per-month score is correct

### storage/
- save then load returns the same data
- no data → returns null safely

---

## 6. Sample numbers for Manual QA

| Variable | Value |
|---|---|
| Income/month | 50,000 |
| Existing debt/month | 5,000 |
| DSR limit | 40% |
| Interest | 6.5%/yr |
| Term | 30 years |
| Expected: affordable payment/month | 15,000 |
| Expected: max loan (DSR) | ~2,373,162 (corrected — see note below) |

> Note: an earlier draft of this table listed ~2,501,874 for max loan (DSR). Recomputing the formula in spec.md section 8.3 precisely (`payment * (1 - (1+r)^-n) / r` with payment=15,000, r=6.5%/12/100, n=360) gives **2,373,162.29**, confirmed independently against the live app during Phase 7's end-to-end QA — the old figure was a hand-calculation error from before any code existed, not a discrepancy in the implementation.

---

## 7. Commands

```bash
npm run test           # run all tests (watch)
npm run test -- run    # run once (CI)
npm run test:coverage  # run + coverage report
npm run lint           # ESLint
```

> Whenever a task is declared done, always attach the output of the relevant commands (per DoD).
