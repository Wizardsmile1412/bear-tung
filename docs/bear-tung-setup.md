# Bear-tung — Phase 0 Setup Guide

> Step-by-step to scaffold the project yourself, then hand off to Claude for Phase 1+.
> Run all commands inside the repo root (the `Bear-tung/` folder that contains `docs/` and `CLAUDE.md`).

---

## 1. Scaffold Next.js

The folder is named `Bear-tung` (capital B), but npm package names can't contain capital letters, so `create-next-app .` fails. Scaffold into a temp folder, move the files up, then set the name:

```bash
# inside the Bear-tung/ folder
# 1) scaffold into a temp folder with a valid (lowercase) name
npx create-next-app@latest tmp-app \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-npm --no-git

# 2) keep OUR README, drop the generated one
rm tmp-app/README.md

# 3) move everything (including dotfiles like .gitignore, .next) up
#    bash:
shopt -s dotglob && mv tmp-app/* . && shopt -u dotglob && rmdir tmp-app
#    zsh (macOS default — `shopt` does NOT exist here):
mv tmp-app/*(D) . && rmdir tmp-app

# 4) set a valid package name
sed -i '' 's/"name": "tmp-app"/"name": "bear-tung"/' package.json
```

> `docs/`, `CLAUDE.md`, and our `README.md` are preserved by this approach. (`sed -i ''` is the macOS form; on Linux use `sed -i`.)
>
> **`shopt` is a bash builtin and errors with `command not found` in zsh** (the macOS default shell). Without it, the `*` glob skips hidden files (`.git`, `.gitignore`, `.next`), leaving them behind so `rmdir` fails with "Directory not empty." Use the zsh line above (`(D)` = include dotfiles), or just move the leftovers explicitly: `mv tmp-app/.git tmp-app/.gitignore tmp-app/.next .`

---

## 2. Install runtime + dev libraries

```bash
# runtime
npm install recharts xlsx dayjs

# dev / testing
npm install -D vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event @vitest/coverage-v8
```

---

## 3. Add scripts to `package.json`

```jsonc
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 4. `vitest.config.ts` (repo root)

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['src/domain/**', 'src/components/**'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
```

## 5. `vitest.setup.ts` (repo root)

```ts
import '@testing-library/jest-dom/vitest';
```

---

## 6. Tailwind theme tokens (Tailwind v4 — CSS-first)

> Next.js 16 ships **Tailwind v4**, which has **no `tailwind.config.ts`**. Configure the theme in `src/app/globals.css` inside an `@theme { }` block — each `--color-*` token generates utilities (e.g. `--color-primary` → `bg-primary`, `text-primary`). Already applied; for reference:

```css
@import "tailwindcss";

@theme {
  --color-primary: #1e5eff;
  --color-primary-hover: #1a52e0;
  --color-primary-pressed: #1645c2;
  --color-primary-soft: #e8eeff;
  --color-good: #16a34a;  --color-good-soft: #dcfce7;
  --color-warning: #d97706; --color-warning-soft: #fef3c7;
  --color-danger: #dc2626;  --color-danger-soft: #fee2e2;
  --color-ink: #0f172a; --color-ink-muted: #475569;
  --color-ink-subtle: #94a3b8; --color-ink-faint: #cbd5e1;
  --color-background: #f7f9fc; --color-surface: #ffffff;
  --color-surface-sunken: #f1f5f9;
  --color-outline: #e2e8f0; --color-outline-strong: #94a3b8;
  --font-sans: var(--font-thai), sans-serif;
  --radius-card: 16px; --radius-modal: 24px;
}

body {
  background-color: var(--color-background);
  color: var(--color-ink);
  font-family: var(--font-sans);
  font-variant-numeric: tabular-nums;
}
```

---

## 7. Thai font — `src/app/layout.tsx` (already applied)

```tsx
import { IBM_Plex_Sans_Thai } from "next/font/google";

const thai = IBM_Plex_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${thai.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-ink">{children}</body>
    </html>
  );
}
```

> The font's `--font-thai` variable is referenced by `--font-sans` in the `@theme` block, so `font-sans` (the default body font) resolves to IBM Plex Sans Thai.

---

## 8. Verify

```bash
npm run dev          # open http://localhost:3000
npm run lint
npm run test -- run  # (no tests yet — should pass cleanly)
```

---

## 9. Git + Vercel

```bash
git init && git add -A && git commit -m "chore: scaffold next.js project + tooling"
# create a GitHub repo, then:
git remote add origin <your-repo-url>
git push -u origin main
```

Then on [vercel.com](https://vercel.com): **Add New → Project** → import the repo → **Deploy** (no env vars needed).

---

## 10. Hand off to Claude

Once the dev server runs and the repo is on GitHub/Vercel, tell Claude to start **Phase 1** (data model + storage) and **Phase 2** (domain logic + tests), following `bear-tung-workflow.md`.
