# Bear-tung — Architecture (OOP + SOLID)

> How the code is organized to follow OOP and SOLID.
> Read alongside `bear-tung-spec.md` and `bear-tung-plan.md`.
> Version 0.2 — English. Code comments are in English; UI copy is Thai.

---

## 1. Philosophy

Two clearly separated layers:

- **Domain layer (`src/domain/`)** → full **OOP + SOLID**: classes, interfaces, dependency injection — because there are many rules/strategies to extend and test.
- **UI layer (`src/app/`, `src/components/`)** → **functional React** (idiomatic, no class components), still following SOLID via composition + hooks (small single-purpose components that receive props/abstractions).

> Rationale: forcing OOP onto React UI fights the idiom and adds friction; the financial domain logic is where OOP + SOLID actually pays off.

---

## 2. SOLID — summary and how it's applied here

| Principle | Short meaning | Where in the app |
|---|---|---|
| **S** — Single Responsibility | one class = one reason to change | each ratio is one class, `MortgageCalculator` only computes loans, `LocalStorageRepository` only handles storage |
| **O** — Open/Closed | add new things without editing old | add a new ratio = new class implementing `Ratio`, without touching `HealthScoreService` |
| **L** — Liskov Substitution | subtypes replace the base without breaking | every `Ratio` is interchangeable in the scorer; every `LtvPolicy` in mortgage |
| **I** — Interface Segregation | small, focused interfaces | separate `Ratio`, `LtvPolicy`, `Exporter`, `ProfileRepository` — not one fat interface |
| **D** — Dependency Inversion | depend on abstractions, not concretes | services receive interfaces (injected), never `new` concretes themselves → easy to test/swap |

---

## 3. Domain layer structure

```
src/domain/
├─ model/
│  ├─ Money.ts                 # value object (amount + formatting)
│  ├─ MonthKey.ts              # value object 'YYYY-MM' + shift/compare
│  ├─ LineItem.ts              # entity: income/expense/debt + carry-forward + endMonth
│  └─ CashFlowProfile.ts       # aggregate: line items + assets
├─ ratios/
│  ├─ Ratio.ts                 # interface (abstraction)
│  ├─ SavingsRateRatio.ts      # implements Ratio
│  ├─ DsrRatio.ts              # implements Ratio
│  └─ EmergencyFundRatio.ts    # implements Ratio
├─ scoring/
│  └─ HealthScoreService.ts    # takes Ratio[] + weights → score + traffic light
├─ mortgage/
│  ├─ LtvPolicy.ts             # interface
│  ├─ TemporaryLtvPolicy.ts    # 100% (until 30 Jun 2027)
│  ├─ NormalLtvPolicy.ts       # normal rules
│  ├─ LtvPolicyFactory.ts      # selects policy by date
│  ├─ AmortizationCalculator.ts# payment/loan formula
│  ├─ MortgageService.ts       # combines LTV + DSR + amortization + term cap
│  ├─ CoBorrowerService.ts     # required co-borrower income
│  ├─ requiredDownPayment.ts   # min down payment the LTV rule needs
│  └─ suggestedDownPayment.ts  # form default: required, or 5% of price when LTV needs none
├─ projection/
│  └─ ProjectionService.ts     # builds 60-month series (uses HealthScoreService per month)
├─ storage/
│  ├─ ProfileRepository.ts     # interface
│  ├─ LocalStorageProfileRepository.ts  # implements
│  ├─ MortgageFormRepository.ts         # interface + MortgageFormState (persisted mortgage form; seeded by import, cleared on reset)
│  └─ LocalStorageMortgageFormRepository.ts  # implements
├─ export/
│  ├─ Exporter.ts              # interface
│  └─ ExcelExporter.ts         # implements (SheetJS)
├─ import/
│  ├─ ImportResult.ts          # types (CategoryMapping, ParsedMortgageInputs, ImportResult)
│  ├─ ExcelImporter.ts         # parses workbook → profile (+ mortgage inputs); detects lost carry-forward
│  └─ createExcelImporter.ts   # composition root (injects ProjectionService)
└─ config/
   └─ defaults.ts              # 6.5%, 30y, DSR 40%, weights
```

---

## 4. Code sketches (TypeScript)

### 4.1 Small interfaces (ISP) + Strategy for ratios (OCP, LSP)

```ts
// domain/ratios/Ratio.ts
export interface MonthFinancials {
  income: number;
  expense: number;   // excludes debt
  debt: number;      // monthly debt service
  savings: number;   // cumulative savings
}

export interface RatioResult {
  key: string;          // 'savingsRate' | 'dsr' | 'emergencyFund'
  label: string;
  value: number;        // actual value (e.g. 0.18 or 6.2 months)
  score: number;        // 0–100
  status: 'good' | 'warning' | 'danger';
}

export interface Ratio {
  calculate(m: MonthFinancials): RatioResult;
}
```

```ts
// domain/ratios/DsrRatio.ts
import { Ratio, RatioResult, MonthFinancials } from './Ratio';

export class DsrRatio implements Ratio {
  calculate(m: MonthFinancials): RatioResult {
    const value = m.income > 0 ? m.debt / m.income : 1;
    const score = this.toScore(value);
    return {
      key: 'dsr',
      label: 'DSR (หนี้ต่อรายได้)',
      value,
      score,
      status: score >= 80 ? 'good' : score >= 50 ? 'warning' : 'danger',
    };
  }
  private toScore(v: number): number {
    if (v <= 0.30) return 100;
    if (v <= 0.40) return 70 + (0.40 - v) / 0.10 * 30;
    if (v <= 0.60) return 30 + (0.60 - v) / 0.20 * 40;
    return Math.max(0, 30 * (1 - (v - 0.60) / 0.40));
  }
}
```

> Adding a future ratio (e.g. Debt-to-Asset) = a new class implementing `Ratio` **without changing** `HealthScoreService` → **OCP**.

### 4.2 Service depends on abstraction (DIP) + SRP

```ts
// domain/scoring/HealthScoreService.ts
import { Ratio, MonthFinancials } from '../ratios/Ratio';

export interface WeightedRatio { ratio: Ratio; weight: number; }

export class HealthScoreService {
  constructor(private readonly items: WeightedRatio[]) {}  // inject ratios + weights

  evaluate(m: MonthFinancials) {
    const results = this.items.map(({ ratio }) => ratio.calculate(m));
    const total = this.items.reduce(
      (sum, { ratio, weight }) => sum + ratio.calculate(m).score * weight, 0,
    );
    const score = Math.round(total);
    const light = score >= 80 ? 'green' : score >= 50 ? 'yellow' : 'red';
    return { score, light, results };
  }
}
```

```ts
// composition root (assemble in one place)
const healthService = new HealthScoreService([
  { ratio: new SavingsRateRatio(),   weight: 0.35 },
  { ratio: new DsrRatio(),           weight: 0.35 },
  { ratio: new EmergencyFundRatio(), weight: 0.30 },
]);
```

### 4.3 Strategy + Factory for the LTV policy (OCP, LSP)

```ts
// domain/mortgage/LtvPolicy.ts
export interface LtvContext { homePrice: number; homeOrder: 1 | 2 | 3; }
export interface LtvPolicy { maxLtv(ctx: LtvContext): number; } // returns 0–1

// domain/mortgage/LtvPolicyFactory.ts
export class LtvPolicyFactory {
  static forDate(date: Date): LtvPolicy {
    const relaxEnd = new Date('2027-06-30');
    return date <= relaxEnd ? new TemporaryLtvPolicy() : new NormalLtvPolicy();
  }
}
```

> When the relaxation expires, swap the policy without the service knowing the details → **DIP + OCP**.

### 4.4 Repository pattern (DIP) — swap local storage for a DB later

```ts
// domain/storage/ProfileRepository.ts
import { CashFlowProfile } from '../model/CashFlowProfile';
export interface ProfileRepository {
  load(): CashFlowProfile | null;
  save(profile: CashFlowProfile): void;
}
// LocalStorageProfileRepository implements ProfileRepository
// Later add ApiProfileRepository without changing the UI
```

---

## 5. How the UI layer follows SOLID (functional)

- **SRP:** small single-purpose components (`ScoreGauge`, `RatioCard`, `MonthSlider`) — don't cram everything into one file.
- **DIP:** components **never call local storage or `new` a class directly** — they go through a custom hook (e.g. `useProfile()`) or services injected via React Context.
- **OCP:** add a new ratio card by mapping over the `RatioResult[]` the domain returns — no edits to existing components.
- **ISP:** component props are small and specific — don't pass oversized objects.

```ts
// example: UI depends on a hook, not on storage directly
function useHealth(month: MonthKey) {
  const profile = useProfile();                       // from Context (repository injected)
  return useMemo(() => projectionService.at(profile, month), [profile, month]);
}
```

---

## 6. Patterns used (summary)

| Pattern | Used for | Benefit |
|---|---|---|
| Strategy | Ratio, LtvPolicy | swap/add rules without editing old code (OCP) |
| Factory | LtvPolicyFactory | select policy by date |
| Repository | ProfileRepository, MortgageInputsRepository | separate storage from logic (DIP) |
| Facade/Service | MortgageService, HealthScoreService | UI calls one place, complexity hidden |
| Value Object | Money, MonthKey | fewer bugs around units/formatting |

### Excel import (mirror of export)

`ExcelImporter` is the inverse of `ExcelExporter`: a pure `parse(workbook, options)` (the testable part) that rebuilds a `CashFlowProfileData` (+ optional mortgage inputs) from the 4 sheets. Two SOLID points:

- **DIP for loss detection** — the export collapses each line item to a single amount, so re-imported items lose their carry-forward history. `ExcelImporter` takes an injected projection builder (the real `ProjectionService`, via `createExcelImporter`), re-runs it on the reconstructed profile, and compares against the file's Projection sheet — warning **only** when totals actually diverge. The injection keeps it unit-testable with a fake builder.
- **Layering preserved** — like `buildExportData`, the importer never imports from `src/components/**`. The UI's `useImport` hook supplies the Thai→key reverse lookups (`CategoryMapping`, `parseMonthLabel`) so `src/domain/**` stays free of presentation concerns.

---

## 7. Impact on testing

OOP + DIP make **mocking easy**: test `HealthScoreService` with a fake `Ratio`, test `MortgageService` with a fake `LtvPolicy`, without the real implementations → fast, precise unit tests (matches Phase 2 in the plan).

---

## 8. Caution (don't over-engineer)

- Use classes only where they add value (the domain) — don't wrap everything in classes until it's unreadable.
- Start simple, add abstraction when there's a reason (the value of an interface becomes clear once there's a 2nd/3rd ratio).
- If a value object / Money feels excessive early on, use `number` + utils first, refactor later.
