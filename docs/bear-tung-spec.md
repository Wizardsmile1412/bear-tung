# Bear-tung — Product Spec / PRD

> Requirements captured from interview, used to build the "Money Health Check" web app.
> Version: 0.2 (draft) — Date: 2026-06-24
> Note: docs are in English; the app UI is in Thai (financial jargon kept in English).

---

## 1. Overview

Bear-tung helps everyday people (no financial background needed) check their **money health**:

1. Enter **cash flow** — income, expenses, and debt.
2. The app shows **charts + key ratios**, a **health score**, and a **traffic light (green/yellow/red)** that's easy to understand.
3. It uses the **remaining cash flow** to assess **home mortgage affordability** under current Thai bank policy.
4. **Export to Excel** — both the input data and the calculated results.

Primary design goal: a financially-illiterate user should understand their money status within seconds.

---

## 2. Users & Goals

- **Users:** general Thai public who want to understand their finances, and who may be considering buying a home.
- **Financial literacy:** low to medium → the UI must explain jargon, no black boxes.
- **Outcomes the user should get:**
  - Understand where money flows in/out.
  - Know their health level (score + color) and what to improve.
  - Know what home price is affordable given their current situation, without overextending.

---

## 3. MVP Scope

Build the full flow end-to-end in the MVP:

`Enter cash flow` → `Money Health Check (charts + ratios + score)` → `Mortgage affordability` → `Excel export`

---

## 4. Key decisions (from interview)

| Topic | Decision |
|---|---|
| MVP scope | Full flow, end-to-end |
| Tech stack | Next.js + TypeScript + Tailwind CSS + Recharts |
| Data storage | Browser local storage (no login) |
| UI language | Thai (financial jargon stays in English) |
| Cash flow input | Categorized — confirmed |
| Mortgage | Default values (LTV/DSR/interest/term), all adjustable |
| Default interest | ~6.5%/yr (ref: Thai commercial bank MRR), adjustable |
| Default term | 30 years, but capped by "borrower age + term ≤ 70" |
| Projection | Fixed 5 years (60 months), monthly — debts have end dates; income/expense change by date (carry-forward) |
| Health over time | Per-month view + score trend chart over the whole range |
| Mortgage assessment month | Selectable: current or future |
| Co-borrower | Checkbox — if the sole borrower doesn't qualify, compute the co-borrower income required (co-borrower's existing debt can be entered) |
| Ratios | Savings Rate, DSR, Emergency Fund |
| Health score | 0–100 weighted + traffic light green/yellow/red |
| Score weights | Savings 35% / DSR 35% / Emergency Fund 30% |
| Primary device | iPad Air 4 (820×1180) first, then responsive |
| Design | Clean professional fintech — see `bear-tung-design.md` |
| Export | Excel (.xlsx) with both input data + calculated results |

> Note: the old `design.md` (Skylearn) is a design system for a kids' edtech app — **not used in this project**.

---

## 5. Data Model (categorized cash flow + time-series)

Stored in local storage (key: `bear-tung:profile`). **Each item is a time-series** with a start date (and an end date for debts) so a 5-year projection can be built. Money values are **per month (THB/month)** unless noted.

**Carry-forward concept:** each item has a "value starting on date X" that **applies forward until the next change** (a step function). E.g. salary 35,000 from now, changing to 45,000 from 2027-01 → the system uses 35,000 every month through 2026-12, then 45,000 from 2027-01 onward.

```
LineItem {
  id: string
  category: 'income' | 'expense' | 'debt'
  subCategory: string          // e.g. 'salary', 'food', 'carLoan'
  label: string                // user-defined, e.g. "Honda car loan"
  changes: Array<{             // value-change history (carry-forward)
    effectiveFrom: string      // 'YYYY-MM' month this value takes effect
    amount: number             // amount per month
  }>
  endMonth?: string            // 'YYYY-MM' last month still paying (debts only) — null = open-ended
}

Assets {
  savings: number              // current savings/cash on hand (cumulative)
}

Profile {
  items: LineItem[]
  assets: Assets
  startMonth: string           // projection start month (= current month)
  meta: { updatedAt: string }
}
```

> Debt with an end date example: car loan 10,000/month, 10 months left → `changes:[{effectiveFrom:'2026-06', amount:10000}], endMonth:'2027-03'`. After that the burden disappears from cash flow.

**Derived values for month m (for every month in the projection):**
- `totalIncome(m)` = sum of income active in month m
- `totalExpense(m)` = sum of expense active in month m (excludes debt)
- `totalDebt(m)` = sum of debt active in month m (not past endMonth)
- `remainingCashFlow(m)` = totalIncome(m) − totalExpense(m) − totalDebt(m)

> Note: ratios and the health score (section 6) are computed **per month** using that month's values, producing a trend chart over the 5-year range.

---

## 6. Ratios and formulas (Money Health Check)

> Thresholds follow common personal-finance standards + Thai bank lending practice.

### 6.1 Savings Rate
```
savingsRate = remainingCashFlow / totalIncome
```
| Range | Meaning | Sub-score (0–100) |
|---|---|---|
| ≥ 20% | Excellent | 100 |
| 10–20% | OK | 60–99 (linear) |
| 0–10% | Needs work | 30–59 (linear) |
| < 0% | Negative (overspending) | 0 |

### 6.2 DSR — Debt Service Ratio
```
dsr = totalDebt / totalIncome
```
| Range | Meaning | Sub-score |
|---|---|---|
| ≤ 30% | Safe | 100 |
| 30–40% | Acceptable | 70–99 |
| 40–60% | Tight | 30–69 |
| > 60% | High risk | 0–29 |

> The ~40% threshold reflects Thai bank lending practice (monthly debt service should not exceed ~40% of income).

### 6.3 Emergency Fund
```
emergencyMonths = assets.savings / (totalExpense + totalDebt)
```
| Range | Meaning | Sub-score |
|---|---|---|
| ≥ 6 months | Excellent | 100 |
| 3–6 months | OK | 60–99 |
| 1–3 months | Low | 30–59 |
| < 1 month | At risk | 0–29 |

### 6.4 Health Score
```
healthScore = round(
  0.35 * savingsScore +
  0.35 * dsrScore +
  0.30 * emergencyScore
)
```
**Traffic light:**
- 🟢 Green: 80–100 — healthy
- 🟡 Yellow: 50–79 — OK, room to improve
- 🔴 Red: 0–49 — needs attention

> The UI must show "where the score comes from" — display each ratio's sub-score + thresholds, not a black box. Weights/thresholds should be configurable.

---

## 7. Visualizations

- **Donut / Pie:** expense breakdown by category (where the money goes).
- **Comparison Bar:** income vs expense vs debt vs remaining.
- **Gauge:** health score 0–100 with a traffic-light color band.
- **Ratio cards:** each ratio with its actual value, threshold, and colored status.
- **Line (trend):** health-score trend over the 5-year projection.
- Library: **Recharts**

### 7.1 5-year projection & time controls

- The system builds a 60-month (5-year) monthly dataset from the time-series model (carry-forward + endMonth).
- A **month selector / slider** lets the user scrub to any month in the 5-year range to view its score/ratios/breakdown.
- A **trend chart** shows the overall score across 5 years, revealing improvements/declines (e.g. the month the car loan ends, the score jumps).
- The selected month links to the mortgage assessment (assessmentMonth in 8.1).

---

## 8. Mortgage Affordability (Thai bank policy)

### 8.1 Input
- `homePrice` — target home price (user input)
- `homeOrder` — 1st / 2nd / 3rd+ home (affects LTV)
- `borrowerAge` — borrower age (caps the term)
- `interestRate` — annual rate (**default 6.5%**, ref Thai commercial bank MRR, adjustable)
- `loanTermYears` — term (default 30y) → **effective = min(loanTermYears, 70 − borrowerAge)**
- `downPaymentAvailable` — available down payment (default = assets.savings)
- `assessmentMonth` — month used for assessment (current or future within the projection)
- `monthlyIncome` / `existingDebt` — pulled from cash flow **of `assessmentMonth`**
- `dsrLimit` — DSR cap (default 40%, adjustable)
- `coBorrower` (optional) — `{ enabled, monthlyIncome, existingDebt }` see 8.5

> Term note: most banks require "borrower age + term ≤ 70" (some 65). E.g. age 40 → max 30y, age 50 → max 20y.

### 8.2 LTV rules — date-based rule set

**Temporary relaxation (1 May 2025 – 30 Jun 2026):** LTV 100% in all cases, all price tiers, all home orders.

**Normal rules (after 30 Jun 2026):**
| Case | LTV cap | Min down payment |
|---|---|---|
| 1st home, price < 10M | 100% (+10% furnishing) | 0% |
| 1st home, price ≥ 10M | 90% | 10% |
| 2nd home (1st paid ≥ 2 yrs) | 90% | 10% |
| 2nd home (1st paid < 2 yrs) | 80% | 20% |
| 3rd+ home | 70% | 30% |

> ⚠️ Implement LTV as config with `effectiveFrom` / `effectiveTo` because the temporary relaxation ends 30 Jun 2026 — the app should auto-pick the rule set by current date and tell the user which set is active.

### 8.3 Calculation logic

**A. Max loan from LTV**
```
maxLoanByLTV = homePrice * ltvPercent
requiredDownPayment = homePrice - maxLoanByLTV
```

**B. Affordable monthly payment (from DSR)**
```
affordableMonthlyPayment = dsrLimit * monthlyIncome - existingDebt
```

**C. Convert affordable payment → max loan (inverse amortization)**
```
r = interestRate / 12 / 100          // monthly rate
n = loanTermYears * 12               // number of payments
maxLoanByDSR = affordableMonthlyPayment * (1 - (1 + r)^(-n)) / r
```

**D. Result**
```
maxLoan = min(maxLoanByLTV, maxLoanByDSR)
affordableHomePrice = maxLoan + downPaymentAvailable
canAffordTarget = affordableHomePrice >= homePrice
                  AND downPaymentAvailable >= requiredDownPayment
```

**Monthly payment formula (shown to user):**
```
monthlyPayment = loanAmount * r * (1+r)^n / ((1+r)^n - 1)
```

### 8.4 Output
- Whether the target home is affordable (green/red)
- Maximum affordable home price
- Estimated monthly payment + % of income (DSR after the loan)
- Required down payment vs actual available
- Binding constraint: LTV or DSR
- Warnings/advice (e.g. "reduce debt by X/month to borrow more")

> Disclaimer: a preliminary educational estimate, not a loan approval from a bank.

### 8.5 Co-borrower feature

A "co-borrower" checkbox on the mortgage page. When the sole borrower **can't afford the target home** (DSR-limited), compute the **minimum co-borrower income** needed to qualify for the stated price (co-borrower's existing debt can be entered).

Logic: banks combine both borrowers' income and debt, then apply DSR to the combined totals.
```
loanNeeded             = homePrice - downPaymentAvailable
monthlyPayment         = payment(loanNeeded, r, n)          // amortization
requiredCombinedIncome = (monthlyPayment + userDebt + coDebt) / dsrLimit
requiredCoIncome       = max(0, requiredCombinedIncome - userIncome)
```
- If the user entered the co-borrower's actual income → check whether `userIncome + coIncome` is enough and show the combined result.
- If not entered → show "co-borrower needs at least X THB/month".

> An LTV constraint cannot be fixed by a co-borrower: if `loanNeeded > maxLoanByLTV` (insufficient down payment), the co-borrower doesn't help → show a separate message.
> MVP assumption: term is capped by the primary borrower's age (borrowerAge); a younger co-borrower potentially extending the term is deferred.

---

## 9. Excel Export (.xlsx)

The user clicks "Export Excel" to download a file containing:

- **Sheet 1 — Cash Flow (current):** income/expense/debt table by category with totals
- **Sheet 2 — Health Check:** each ratio, threshold, sub-score, total score, traffic-light status
- **Sheet 3 — Mortgage:** inputs used + results (max loan, payment, affordable price, down payment) + co-borrower result (required co-borrower income if enabled)
- **Sheet 4 — Projection 5y:** monthly table, 60 rows (income/expense/debt/remaining/score per month)

Technical proposal: use **SheetJS (xlsx)** or **ExcelJS** on the client (data is already in local storage). Format numbers as currency and percentages correctly.

---

## 10. Screens / Flow (UX)

1. **Home / Onboarding** — short explanation of what the app does, a start button.
2. **Cash Flow entry** — categorized form (income / expense / debt / savings); each item can set a start/change date, and debts can set an end date (for projection).
3. **Health Dashboard** — score + traffic light + charts + ratio cards + **month selector/slider** + **5-year trend chart**.
4. **Mortgage** — enter target home + age + adjust assumptions + pick assessment month → affordability result; **co-borrower checkbox** shows required co-borrower income.
5. **Export Excel button** — accessible from the dashboard and the mortgage page.

---

## 11. Non-functional

- **Primary device:** iPad Air 4 (820×1180 portrait) — design at this size first, then responsive down to mobile / up to desktop.
- **Storage:** local storage only (privacy-friendly, no data leaves the device).
- **Language:** Thai UI + financial jargon in English.
- **Accessibility:** color is never the sole signal — traffic light must pair with icon/text.
- **Correctness:** financial calculations must have unit tests (edge cases: zero income, negative debt, zero interest).

---

## 12. Out of scope (Future)

- Login + database (cross-month history, trends)
- Multi-language (English toggle)
- Bank API integration / real data
- Historical trend charts (needs DB persistence)

---

## 13. Decisions & remaining questions

**Confirmed:**
1. ✅ Categorized cash flow input
2. ✅ Default interest ~6.5%/yr (ref commercial bank MRR), default term 30 years
3. ✅ Cap term by "borrower age + term ≤ 70"
4. ✅ 5-year monthly projection (carry-forward + debts with end dates), per-month view + trend chart
5. ✅ Co-borrower feature (co-borrower debt enterable), selectable mortgage assessment month
6. ✅ Use a **fixed 6.5% rate for the full term** in calculations (conservative) — adjustable in UI

**Small remaining questions (non-blocking):**
- Age cap uses 70 (middle value) — make it adjustable to 65? (suggest config default 70)
- For co-borrowers, if the co-borrower is younger, should the term extend? (MVP: use primary borrower's age)

---

## Policy sources

- [BOT — temporary LTV relaxation (1 May 2025 – 30 Jun 2026)](https://www.bot.or.th/th/news-and-media/news/news-20250320.html)
- [Krungsri — LTV measures 2026](https://www.krungsri.com/th/krungsri-the-coach/loan/mortgages/ltv-home-loan)
- [DDproperty — LTV update 2026](https://www.ddproperty.com/คู่มือซื้อขาย/อัปเดตมาตรการ-ltv-ช่วยคนกู้ซื้อบ้านเพื่ออยู่อาศัยจริง-22232)
- [DDproperty — home loan / MRR rates May 2026 (MRR ~6.5–7.3%)](https://www.ddproperty.com/คู่มือซื้อขาย/อัปเดตอัตราดอกเบี้ยเงินให้สินเชื่อ-mrr-mlr-mor-6217)
- [BOT — daily commercial bank interest rates](https://www.bot.or.th/th/statistics/interest-rate.html)
- [KBank — home loan (age + term ≤ 70)](https://www.kasikornbank.com/th/personal/loan/homeloan/pages/home.aspx)
