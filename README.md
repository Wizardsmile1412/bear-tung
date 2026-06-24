# Bear-tung — Money Health Check

A web app that helps anyone (no financial background needed) check their **money health**: enter your cash flow, see your financial health as charts, key ratios, a 0–100 score, and a traffic-light status — then check whether you can afford a home mortgage under current Thai bank policy, with a 5-year projection and Excel export.

> UI is in Thai. Docs and code are in English. Data is stored locally in the browser — nothing leaves your device.

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS · Recharts · SheetJS (xlsx) · dayjs · Vitest

## Documentation

See [`docs/`](./docs):

- [`bear-tung-spec.md`](./docs/bear-tung-spec.md) — product spec / requirements / formulas
- [`bear-tung-design.md`](./docs/bear-tung-design.md) — design system
- [`bear-tung-architecture.md`](./docs/bear-tung-architecture.md) — OOP + SOLID architecture
- [`bear-tung-plan.md`](./docs/bear-tung-plan.md) — build plan + deploy
- [`bear-tung-tasks.md`](./docs/bear-tung-tasks.md) — phased task checklist
- [`bear-tung-workflow.md`](./docs/bear-tung-workflow.md) — 3-role dev process
- [`bear-tung-test-plan.md`](./docs/bear-tung-test-plan.md) — test plan

## Getting started

```bash
# 1. install dependencies
npm install

# 2. run the dev server
npm run dev          # http://localhost:3000

# 3. other commands
npm run build        # production build
npm run lint         # ESLint
npm run test -- run  # run tests once
npm run test:coverage
```

## Deploy (Vercel)

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com), **Add New → Project**, import the repo.
3. Vercel auto-detects Next.js — no environment variables needed (client-only).
4. **Deploy**. Every push to `main` redeploys automatically; PRs get preview URLs.

## Project structure

```
src/
├─ app/          # pages (functional React)
├─ components/   # UI components
└─ domain/       # OOP + SOLID business logic (+ __tests__)
```

## Status

Docs complete. Implementation follows the phases in [`docs/bear-tung-tasks.md`](./docs/bear-tung-tasks.md).
