# Bear-tung — Development Workflow (3-Agent Process)

> A development process modeling 3 roles: Software Developer → Tester → Software Engineer.
> Used when Claude builds this project (both as a documented process and via real subagents).
> Read with `bear-tung-tasks.md`, `bear-tung-test-plan.md`, `bear-tung-architecture.md`.
> Version 0.2 — English.

---

## 1. Roles

### 👨‍💻 Software Developer
- Takes one task at a time from `bear-tung-tasks.md` and writes working code to spec.
- Writes/updates basic tests for their own code.
- Focus: "make it work".

### 🧪 Tester (QA)
- Reviews the developer's code: runs existing tests + **writes missing tests** (normal + edge cases).
- Runs lint.
- If issues are found → writes a report back to the developer to fix.
- **Pass criterion (Definition of Done for this gate): all tests pass AND coverage ≥ 80%** (domain layer should approach 100%).

### 🏛️ Software Engineer (Tech Lead)
- Steps in after the tester gate passes.
- Reviews **architecture / performance / clean code / design patterns** as best practice, and **must comply with `bear-tung-architecture.md`** (OOP+SOLID in domain, functional UI).
- Refactors if needed (must re-run tests to green).
- Decides the **commit** (choosing a sensible unit), then moves to the next task.

---

## 2. Flow

```
   ┌─────────────────────────────────────────────┐
   │  Pick next task from bear-tung-tasks.md       │
   └───────────────────────┬─────────────────────┘
                           ▼
                ┌──────────────────────┐
                │ Software Developer    │  write code + basic tests
                └──────────┬───────────┘
                           ▼
                ┌──────────────────────┐
                │ Tester                │  run tests+lint, add missing tests
                └──────────┬───────────┘
                  Pass? (all tests pass + coverage ≥80%)
                  │ No → report back to developer (loop)
                  │ (cap 3 rounds → escalate to engineer)
                  ▼ Yes
                ┌──────────────────────┐
                │ Software Engineer     │  review architecture/perf/clean code
                │                       │  + comply architecture.md → refactor
                └──────────┬───────────┘
                           ▼
                ┌──────────────────────┐
                │ Commit (logical unit) │  Conventional Commits
                └──────────┬───────────┘
                           ▼
                  Check [x] in tasks.md → next task
```

---

## 3. Rules

1. **Definition of Done per task:** when a task is finished, **run the relevant test + lint commands and report the results before declaring it done** (never declare done without run output).
2. **Hand-off-to-engineer criterion:** all tests pass **and** coverage ≥ 80%.
3. **dev↔tester loop cap: 3 rounds** — if still failing, escalate to the software engineer to decide (may adjust the design).
4. **Engineer review checklist** (section 4).
5. **Flexible commits:** the engineer picks a sensible commit unit (logical unit) — may finish a phase then commit, or commit a fully-completed sub-task; never commit half-done work.
6. **Every commit must be in a green state** (tests pass + lint pass).

---

## 4. Engineer Review Checklist

- [ ] Complies with `bear-tung-architecture.md` (OOP+SOLID in domain, functional UI)
- [ ] SRP: each class/function has one responsibility
- [ ] OCP/Strategy: new things can be added without editing old code
- [ ] DIP: depends on interfaces, not concretes (injectable)
- [ ] No dead code / magic numbers (use config)
- [ ] Performance: no unnecessary recomputation (memoize projection when appropriate)
- [ ] Clear naming, readable, fully typed
- [ ] Tests cover edge cases + coverage ≥ 80%

---

## 5. Conventional Commits

Format: `<type>: <short summary>`, e.g.

- `feat: add DSR ratio calculation`
- `fix: handle zero-income edge case in scoring`
- `test: add mortgage amortization edge cases`
- `refactor: extract LtvPolicy strategy`
- `chore: setup tailwind theme tokens`
- `docs: update architecture notes`

---

## 6. Implementation with subagents (when building for real)

During the build, Claude will **spawn subagents** following this flow (alongside the process in CLAUDE.md):

| Role | subagent | Responsibility |
|---|---|---|
| Software Developer | general-purpose | write task code |
| Tester | general-purpose | run/write tests + lint, report |
| Software Engineer | Plan / general-purpose | review architecture + decide commit |

> Note: splitting into subagents happens only when the user asks to start building (per the flow above), and every hand-off between roles must attach "test + lint run results".
