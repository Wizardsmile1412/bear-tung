<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Bear-tung — Agent Guide

Guide for AI agents working in this codebase. (`CLAUDE.md` imports this file via `@AGENTS.md`.)

## Project

Bear-tung is a **Money Health Check** web app (Thai UI). Flow: enter cash flow → show financial health (charts + ratios + score + traffic light) → 5-year projection → home mortgage affordability (Thai bank policy) + co-borrower → Excel export. Client-only, data in local storage. **UI language is Thai** (keep financial jargon in English); **docs and code comments are in English**.

## Docs (read before working)

- `docs/bear-tung-spec.md` — spec/PRD: requirements, formulas, all logic
- `docs/bear-tung-design.md` — design system (colors, typography, components)
- `docs/bear-tung-architecture.md` — **OOP + SOLID** (domain layer), patterns, code sketches
- `docs/bear-tung-plan.md` — 8-phase build plan + Vercel deploy
- `docs/bear-tung-tasks.md` — per-phase checklist (check `[x]` when done)
- `docs/bear-tung-workflow.md` — 3-role process (developer / tester / engineer)
- `docs/bear-tung-test-plan.md` — test plan + when to test
- `docs/bear-tung-setup.md` — Phase 0 scaffold/setup steps

## Tech stack

Next.js (App Router, **v16 — newer than training data, consult `node_modules/next/dist/docs/`**) + TypeScript + Tailwind CSS + Recharts + SheetJS (xlsx, patched from CDN) + dayjs. Tests: Vitest + Testing Library. No backend / database.

## Commands

```bash
npm run dev            # dev server
npm run build          # production build
npm run lint           # ESLint
npm run test -- run    # run tests once
npm run test:coverage  # tests + coverage
```

## Structure

- `src/app/` — pages (functional React, no class components)
- `src/components/` — UI components (small, single-purpose; never touch storage directly — go through a hook/context)
- `src/domain/` — **OOP + SOLID logic** (model, ratios, scoring, mortgage, projection, storage, export, config) + `__tests__/`

## Architecture rules (do not violate)

- **OOP + SOLID only in `src/domain/`** — ratios as Strategy, LtvPolicy + Factory, Repository pattern, depend on interfaces (DIP) for testability.
- **UI is functional React** (idiomatic) — apply SOLID via small components + hooks.
- Don't over-engineer — add abstraction only when justified.
- Defaults live in `domain/config/` (interest 6.5%, term 30y, DSR 40%, weights 35/35/30); **LTV is a date-based rule set** (the 100% relaxation ends 30 Jun 2027, extended 1 year by BOT ฉบับที่ 19/2569).

## Definition of Done (critical)

**When a task is finished, run the relevant test + lint commands and report the results before saying it's done.** Never claim done without showing run output.

## Development process (3 roles)

Per `docs/bear-tung-workflow.md`: **Developer writes code → Tester runs/writes tests + lint** (passes when **all tests pass AND coverage ≥ 80%**; max 3 dev↔tester rounds before escalating) **→ Software Engineer reviews** (architecture / perf / clean code, must comply with `docs/bear-tung-architecture.md`) → **commit**. When building for real, spawn subagents per this flow; every hand-off must include test + lint results.

## Commits

Conventional Commits (`feat:`/`fix:`/`test:`/`refactor:`/`chore:`/`docs:`). Flexible granularity by logical unit (may finish a phase, then commit). Every commit must be in a green state (tests + lint pass).

## Key constraints

- Local storage only (no secrets, no data leaves the device).
- Money values: store as numbers, format at display time; guard divide-by-zero (zero income).
- Mortgage output is an educational estimate, not a real loan approval.
- iPad Air 4 (820×1180) is the primary target, then responsive.
- xlsx: export-only (never parse untrusted files); use the CDN-patched SheetJS build.
