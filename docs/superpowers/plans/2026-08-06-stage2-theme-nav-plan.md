# Stage 2 Theme Navigation Today Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the V2 visual foundation — token-based theme system (Day/Night/Dusk), responsive nine-module navigation, and an action-first Today page — without breaking the V1 daily loop.

**Architecture:** Semantic CSS tokens with theme overrides selected via `data-theme` on `<html>`; a small React `ThemeProvider` persists preference through the existing `settings` module public API and sets DOM attributes (inline bootstrap script in layout avoids FOUC). Navigation composes the existing `v2-registry` manifests; Today composes the real V1 daily-loop state through the existing `today` module public API.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind 4 (utility usage only, tokens stay in CSS custom properties), lucide-react icons, node test runner for rule tests.

## Global Constraints

- Node >= 22; TypeScript strict; no new runtime dependencies.
- Business modules must not hard-code theme colors — only semantic tokens.
- Do not remove V1 routes or V1 localStorage data; V2 routes are additive.
- Tests run via `node --experimental-strip-types --test`; `.mjs` test files must be plain JS (no TS type annotations).
- Runtime value imports across module boundaries use relative paths with `.ts` extension; type-only imports may use `@/` aliases.
- Existing 19 tests stay green; typecheck and production build must pass.
- No client-side secrets, no fabricated progress values, truthful empty states.

---

### Task 1: Theme rule module (pure functions, no React)

**Files:**
- Create: `apps/web/src/shared/theme/theme.ts`
- Test: `apps/web/src/shared/theme/theme.test.mjs`

**Interfaces:**
- Consumes: nothing (self-contained types + guards)
- Produces:
  - `export type Theme = "day" | "night" | "dusk"`
  - `export type Motion = "full" | "reduced" | "off" | "system"`
  - `export const DEFAULT_THEME: Theme = "day"`
  - `export const DEFAULT_MOTION: Motion = "system"`
  - `export function isTheme(value: unknown): value is Theme`
  - `export function isMotion(value: unknown): value is Motion`
  - `export function normalizeTheme(value: unknown, fallback?: Theme): Theme`
  - `export function normalizeMotion(value: unknown, fallback?: Motion): Motion`
  - `export const THEME_STORAGE_KEY = "growpilot.theme.v1"`
  - `export const MOTION_STORAGE_KEY = "growpilot.motion.v1"`

- [ ] **Step 1: Write the failing test**

```js
// apps/web/src/shared/theme/theme.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_MOTION, DEFAULT_THEME, isMotion, isTheme,
  normalizeMotion, normalizeTheme,
} from "./theme.ts";

test("defaults are day theme and system motion", () => {
  assert.equal(DEFAULT_THEME, "day");
  assert.equal(DEFAULT_MOTION, "system");
});

test("isTheme and isMotion accept only valid values", () => {
  assert.equal(isTheme("day"), true);
  assert.equal(isTheme("night"), true);
  assert.equal(isTheme("dusk"), true);
  assert.equal(isTheme("dark"), false);
  assert.equal(isTheme(null), false);
  assert.equal(isMotion("full"), true);
  assert.equal(isMotion("reduced"), true);
  assert.equal(isMotion("off"), true);
  assert.equal(isMotion("system"), true);
  assert.equal(isMotion("high"), false);
});

test("normalizeTheme falls back for invalid input", () => {
  assert.equal(normalizeTheme("night"), "night");
  assert.equal(normalizeTheme("dark"), "day");
  assert.equal(normalizeTheme(undefined), "day");
  assert.equal(normalizeTheme(null, "dusk"), "dusk");
});

test("normalizeMotion falls back for invalid input", () => {
  assert.equal(normalizeMotion("reduced"), "reduced");
  assert.equal(normalizeMotion("high"), "system");
  assert.equal(normalizeMotion(undefined), "system");
  assert.equal(normalizeMotion(null, "off"), "off");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test apps/web/src/shared/theme/theme.test.mjs`
Expected: FAIL with `Cannot find module './theme.ts'` (file does not exist yet)

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/web/src/shared/theme/theme.ts
export type Theme = "day" | "night" | "dusk";
export type Motion = "full" | "reduced" | "off" | "system";

export const DEFAULT_THEME: Theme = "day";
export const DEFAULT_MOTION: Motion = "system";
export const THEME_STORAGE_KEY = "growpilot.theme.v1";
export const MOTION_STORAGE_KEY = "growpilot.motion.v1";

export function isTheme(value: unknown): value is Theme {
  return value === "day" || value === "night" || value === "dusk";
}

export function isMotion(value: unknown): value is Motion {
  return value === "full" || value === "reduced" || value === "off" || value === "system";
}

export function normalizeTheme(value: unknown, fallback: Theme = DEFAULT_THEME): Theme {
  return isTheme(value) ? value : fallback;
}

export function normalizeMotion(value: unknown, fallback: Motion = DEFAULT_MOTION): Motion {
  return isMotion(value) ? value : fallback;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test apps/web/src/shared/theme/theme.test.mjs`
Expected: 4/4 PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/shared/theme/theme.ts apps/web/src/shared/theme/theme.test.mjs
git commit -m "feat(theme): add pure theme and motion rule module"
```

---

### Task 2: Theme persistence (storage round-trip)

**Files:**
- Create: `apps/web/src/shared/theme/theme-storage.ts`
- Test: `apps/web/src/shared/theme/theme-storage.test.mjs`

**Interfaces:**
- Consumes: `isTheme`, `isMotion`, `THEME_STORAGE_KEY`, `MOTION_STORAGE_KEY` from `./theme.ts`
- Produces:
  - `export type StorageLike = Pick<Storage, "getItem" | "setItem">`
  - `export function loadTheme(storage: StorageLike): Theme`
  - `export function saveTheme(storage: StorageLike, theme: Theme): void`
  - `export function loadMotion(storage: StorageLike): Motion`
  - `export function saveMotion(storage: StorageLike, motion: Motion): void`

- [ ] **Step 1: Write the failing test**

```js
// apps/web/src/shared/theme/theme-storage.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { loadMotion, loadTheme, saveMotion, saveTheme } from "./theme-storage.ts";

function memoryStorage(seed = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem(key) { return data.get(key) ?? null; },
    setItem(key, value) { data.set(key, value); },
  };
}

test("loadTheme returns default when storage is empty", () => {
  assert.equal(loadTheme(memoryStorage()), "day");
});

test("saveTheme then loadTheme round-trips", () => {
  const storage = memoryStorage();
  saveTheme(storage, "dusk");
  assert.equal(loadTheme(storage), "dusk");
});

test("loadTheme ignores invalid stored values", () => {
  const storage = memoryStorage({ "growpilot.theme.v1": "dark" });
  assert.equal(loadTheme(storage), "day");
});

test("motion persistence round-trips and guards invalid values", () => {
  const storage = memoryStorage();
  assert.equal(loadMotion(storage), "system");
  saveMotion(storage, "reduced");
  assert.equal(loadMotion(storage), "reduced");
  const bad = memoryStorage({ "growpilot.motion.v1": "high" });
  assert.equal(loadMotion(bad), "system");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test apps/web/src/shared/theme/theme-storage.test.mjs`
Expected: FAIL with `Cannot find module './theme-storage.ts'`

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/web/src/shared/theme/theme-storage.ts
import {
  isMotion, isTheme, MOTION_STORAGE_KEY,
  THEME_STORAGE_KEY, type Motion, type Theme,
} from "./theme";

export type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function loadTheme(storage: StorageLike): Theme {
  const raw = storage.getItem(THEME_STORAGE_KEY);
  return isTheme(raw) ? raw : "day";
}

export function saveTheme(storage: StorageLike, theme: Theme): void {
  storage.setItem(THEME_STORAGE_KEY, theme);
}

export function loadMotion(storage: StorageLike): Motion {
  const raw = storage.getItem(MOTION_STORAGE_KEY);
  return isMotion(raw) ? raw : "system";
}

export function saveMotion(storage: StorageLike, motion: Motion): void {
  storage.setItem(MOTION_STORAGE_KEY, motion);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test apps/web/src/shared/theme/theme-storage.test.mjs`
Expected: 4/4 PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/shared/theme/theme-storage.ts apps/web/src/shared/theme/theme-storage.test.mjs
git commit -m "feat(theme): add theme and motion persistence helpers"
```

---

### Task 3: Theme CSS tokens and three theme overrides

**Files:**
- Create: `apps/web/src/shared/theme/tokens.css`
- Create: `apps/web/src/shared/theme/themes.css`
- Create: `apps/web/src/shared/theme/motion.css`
- Modify: `apps/web/src/app/globals.css` (replace hard-coded palette with token references in shell classes)

**Interfaces:**
- Consumes: nothing (pure CSS)
- Produces: CSS custom properties consumed by all shell components:
  - `--color-bg-canvas`, `--color-bg-surface`, `--color-text-primary`,
    `--color-text-muted`, `--color-action-primary`, `--color-ai-accent`,
    `--color-success`, `--color-warning`, `--color-danger`
  - Component tokens: `--sidebar-bg`, `--nav-active-bg`, `--nav-active-text`,
    `--nav-hover-bg`, `--card-bg`, `--card-border`, `--brand-bg`, `--brand-text`
  - `--motion-transition` (duration string, disabled in reduced/off)

- [ ] **Step 1: Write the failing test**

This task is pure CSS. No rule test is possible; the failing "test" is the
production build rejecting invalid CSS. Create the CSS files first, then in
Step 4 verify with `npm run typecheck` and a production build smoke check.

```css
/* apps/web/src/shared/theme/tokens.css — day theme (default) */
:root {
  --color-bg-canvas: #f7f4ee;
  --color-bg-surface: #ffffff;
  --color-text-primary: #23332c;
  --color-text-muted: #69736f;
  --color-action-primary: #2f8f5b;
  --color-ai-accent: #6147d7;
  --color-success: #2b8a63;
  --color-warning: #b7791f;
  --color-danger: #c2453a;

  --sidebar-bg: rgba(255, 255, 255, 0.92);
  --nav-active-bg: #eef3ee;
  --nav-active-text: #23543a;
  --nav-hover-bg: #f0f1ee;
  --card-bg: #ffffff;
  --card-border: #e4e9e6;
  --brand-bg: #2f8f5b;
  --brand-text: #ffffff;

  --motion-transition: 180ms ease;
}
```

```css
/* apps/web/src/shared/theme/themes.css */
html[data-theme="night"] {
  --color-bg-canvas: #0e1418;
  --color-bg-surface: #182027;
  --color-text-primary: #e8edf1;
  --color-text-muted: #9aa7b0;
  --color-action-primary: #2aa198;
  --color-ai-accent: #a98fd7;
  --color-success: #5dc9a4;
  --color-warning: #d9a441;
  --color-danger: #e2626b;

  --sidebar-bg: rgba(24, 32, 39, 0.92);
  --nav-active-bg: #1f3a36;
  --nav-active-text: #9fe1cb;
  --nav-hover-bg: #202a31;
  --card-bg: #182027;
  --card-border: #2a3540;
  --brand-bg: #2aa198;
  --brand-text: #04261f;
}

html[data-theme="dusk"] {
  --color-bg-canvas: #1a1620;
  --color-bg-surface: #241f2b;
  --color-text-primary: #efe9ec;
  --color-text-muted: #b3a9b4;
  --color-action-primary: #d9a441;
  --color-ai-accent: #b39ddb;
  --color-success: #7fbf8e;
  --color-warning: #e0a95c;
  --color-danger: #e07a5f;

  --sidebar-bg: rgba(36, 31, 43, 0.92);
  --nav-active-bg: #3a3043;
  --nav-active-text: #f0d9a8;
  --nav-hover-bg: #2c2633;
  --card-bg: #241f2b;
  --card-border: #3a3344;
  --brand-bg: #d9a441;
  --brand-text: #2a2113;
}
```

```css
/* apps/web/src/shared/theme/motion.css */
@media (prefers-reduced-motion: reduce) {
  html[data-motion="system"] { --motion-transition: 0ms; }
}
html[data-motion="reduced"] { --motion-transition: 0ms; }
html[data-motion="off"] { --motion-transition: 0ms; }
```

- [ ] **Step 2: Import the CSS files into the app**

Modify `apps/web/src/app/globals.css` — add imports at the top and replace
hard-coded colors in `.sidebar`, `.nav-item`, `.nav-item.active`, `.card`-like
surfaces with `var(--sidebar-bg)` etc. Do NOT change layout structure.

```css
@import "tailwindcss";
@import "@/shared/theme/tokens.css";
@import "@/shared/theme/themes.css";
@import "@/shared/theme/motion.css";
```

- [ ] **Step 3: Replace hard-coded palette with tokens**

In `globals.css`, update these selectors to use the new tokens (exact
replacement list; keep all layout properties untouched):

```css
:root { /* remove legacy --ink/--muted/--line/--surface/--canvas/--brand */
}
body { color: var(--color-text-primary); background: var(--color-bg-canvas); }
.sidebar { background: var(--sidebar-bg); border-right-color: var(--card-border); }
.brand-mark { background: var(--brand-bg); color: var(--brand-text); }
.nav-item { color: var(--color-text-muted); }
.nav-item:hover { background: var(--nav-hover-bg); color: var(--color-text-primary); }
.nav-item.active { background: var(--nav-active-bg); color: var(--nav-active-text); }
.card { background: var(--card-bg); border-color: var(--card-border); }
.status-dot { background: var(--color-success); box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-success) 20%, transparent); }
```

- [ ] **Step 4: Verify build and typecheck**

Run: `npm run typecheck` then `npm run build` (clear `.next` first with
PowerShell if the sandbox delete guard trips).
Expected: typecheck clean, build compiles, static pages generate.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/shared/theme/tokens.css apps/web/src/shared/theme/themes.css apps/web/src/shared/theme/motion.css apps/web/src/app/globals.css
git commit -m "feat(theme): add semantic tokens and day night dusk overrides"
```

---

### Task 4: ThemeProvider (React context + DOM attribute sync)

**Files:**
- Create: `apps/web/src/shared/theme/theme-provider.tsx`
- Modify: `apps/web/src/app/layout.tsx` (wrap children with ThemeProvider + inline bootstrap script in head)
- Modify: `apps/web/src/app/layout.tsx` (add `suppressHydrationWarning` to html)

**Interfaces:**
- Consumes: `loadTheme/loadMotion/saveTheme/saveMotion` from `./theme-storage.ts`, types from `./theme.ts`
- Produces:
  - `export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element`
  - `export function useTheme(): { theme: Theme; motion: Motion; setTheme(t: Theme): void; setMotion(m: Motion): void }`
  - `export function applyThemeToDocument(theme: Theme): void` (sets `data-theme`; exported for the bootstrap script)
  - `export function applyMotionToDocument(motion: Motion): void` (sets `data-motion`)

- [ ] **Step 1: Write the failing test**

Rule-level test for the pure document helpers (context behavior verified in
build + manual checklist):

```js
// apps/web/src/shared/theme/theme-provider.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { applyMotionToDocument, applyThemeToDocument } from "./theme-provider.tsx";

test("applyThemeToDocument sets the data-theme attribute", () => {
  const fake = { setAttribute: (name, value) => { fake.attr = { name, value }; } };
  applyThemeToDocument("night");
  assert.equal(document.documentElement.getAttribute("data-theme"), "night");
});

test("applyMotionToDocument sets the data-motion attribute", () => {
  applyMotionToDocument("reduced");
  assert.equal(document.documentElement.getAttribute("data-motion"), "reduced");
});
```

Note: `applyThemeToDocument`/`applyMotionToDocument` must read
`document.documentElement` at call time (guard for undefined document), so the
test can run under node with a minimal `document` stub set in a global
`before` hook. If node test runner lacks DOM globals, guard the helpers with
`typeof document === "undefined"` and assert the no-op path instead:

```js
test("document helpers no-op safely without a DOM", () => {
  applyThemeToDocument("night");
  applyMotionToDocument("reduced");
  assert.ok(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test apps/web/src/shared/theme/theme-provider.test.mjs`
Expected: FAIL with `Cannot find module './theme-provider.tsx'`

- [ ] **Step 3: Write minimal implementation**

```tsx
// apps/web/src/shared/theme/theme-provider.tsx
"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { loadMotion, loadTheme, saveMotion, saveTheme, type StorageLike } from "./theme-storage";
import type { Motion, Theme } from "./theme";

export function applyThemeToDocument(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

export function applyMotionToDocument(motion: Motion): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-motion", motion);
}

type ThemeContextValue = {
  theme: Theme;
  motion: Motion;
  setTheme: (t: Theme) => void;
  setMotion: (m: Motion) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => loadTheme(window.localStorage));
  const [motion, setMotionState] = useState<Motion>(() => loadMotion(window.localStorage));

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    applyThemeToDocument(t);
    saveTheme(window.localStorage, t);
  }, []);

  const setMotion = useCallback((m: Motion) => {
    setMotionState(m);
    applyMotionToDocument(m);
    saveMotion(window.localStorage, m);
  }, []);

  const value = useMemo(
    () => ({ theme, motion, setTheme, setMotion }),
    [theme, motion, setTheme, setMotion],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export const themeStorageKeys = { THEME_STORAGE_KEY: "growpilot.theme.v1", MOTION_STORAGE_KEY: "growpilot.motion.v1" };
```

- [ ] **Step 4: Wire into layout with FOUC-prevention bootstrap**

In `apps/web/src/app/layout.tsx`:

```tsx
import { ThemeProvider } from "@/shared/theme/theme-provider";

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("growpilot.theme.v1");var m=localStorage.getItem("growpilot.motion.v1");var d=document.documentElement;if(t==="night"||t==="dusk")d.setAttribute("data-theme",t);else d.setAttribute("data-theme","day");if(m==="full"||m==="reduced"||m==="off")d.setAttribute("data-motion",m);else d.setAttribute("data-motion","system");}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <PwaRegister />
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Run tests, typecheck, then commit**

Run: `npm test` (all suites green), `npm run typecheck`
Expected: all green
Commit:
```bash
git add apps/web/src/shared/theme/theme-provider.tsx apps/web/src/shared/theme/theme-provider.test.mjs apps/web/src/app/layout.tsx
git commit -m "feat(theme): add ThemeProvider with FOUC-safe bootstrap"
```

---

### Task 5: Theme switcher UI

**Files:**
- Create: `apps/web/src/components/theme-switcher.tsx`
- Modify: `apps/web/src/components/app-shell.tsx` (render switcher in sidebar footer area)

**Interfaces:**
- Consumes: `useTheme` from `@/shared/theme/theme-provider`
- Produces: `export function ThemeSwitcher(): JSX.Element` — segmented control with three options (日间/夜间/暮色), sets `aria-pressed` on active option, persists via `useTheme().setTheme`

- [ ] **Step 1: Write the failing test**

Component behavior is verified via typecheck + build + manual checklist
(React component tests would require jsdom, which is not in the dependency
set; adding it is out of scope). Instead, test the data contract the UI relies
on — the theme type union and persistence — which is already covered in Tasks
1-2. For this task, the failing check is typecheck failing when
`theme-switcher.tsx` is imported but missing:

- [ ] **Step 2: Create the component**

```tsx
// apps/web/src/components/theme-switcher.tsx
"use client";

import { useTheme } from "@/shared/theme/theme-provider";
import type { Theme } from "@/shared/theme/theme";

const options: { value: Theme; label: string }[] = [
  { value: "day", label: "日间" },
  { value: "night", label: "夜间" },
  { value: "dusk", label: "暮色" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="theme-switcher" role="group" aria-label="主题切换">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={theme === option.value ? "theme-option active" : "theme-option"}
          aria-pressed={theme === option.value}
          onClick={() => setTheme(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Add CSS classes for the switcher**

Append to `apps/web/src/shared/theme/tokens.css` (component-level, theme-agnostic layout) — or add to `globals.css` if preferred for consistency:

```css
.theme-switcher {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;
  padding: 4px; border: 1px solid var(--card-border); border-radius: 12px;
  background: var(--color-bg-canvas);
}
.theme-option {
  padding: 7px 8px; font-size: 12px; color: var(--color-text-muted);
  background: transparent; border: 0; border-radius: 8px; cursor: pointer;
  transition: background var(--motion-transition), color var(--motion-transition);
}
.theme-option:hover { background: var(--nav-hover-bg); color: var(--color-text-primary); }
.theme-option:focus-visible { outline: 2px solid var(--color-action-primary); outline-offset: 1px; }
.theme-option.active { background: var(--nav-active-bg); color: var(--nav-active-text); font-weight: 500; }
```

- [ ] **Step 4: Wire into app shell**

In `apps/web/src/components/app-shell.tsx`, replace the `sidebar-note` block with:

```tsx
<div className="sidebar-footer">
  <ThemeSwitcher />
  <div className="sidebar-note">
    <span className="status-dot" />
    <span>V2 演示 · 本地数据</span>
  </div>
</div>
```

Import `ThemeSwitcher` at the top.

- [ ] **Step 5: Verify and commit**

Run: `npm run typecheck`, `npm test`
Commit:
```bash
git add apps/web/src/components/theme-switcher.tsx apps/web/src/components/app-shell.tsx apps/web/src/shared/theme/tokens.css
git commit -m "feat(theme): add theme switcher to sidebar"
```

---

### Task 6: Responsive nine-module navigation

**Files:**
- Modify: `apps/web/src/lib/module-registry.ts` (expand to nine V2 modules)
- Modify: `apps/web/src/components/app-shell.tsx` (render from expanded registry; mobile bottom bar shows primary five + more drawer)
- Create: `apps/web/src/app/today/page.tsx`, `career/page.tsx`, `review/page.tsx`, `badge/page.tsx` (lightweight placeholder routes composing `ModulePage` until their owning stage)
- Modify: `apps/web/src/app/llm-providers/page.tsx` (keep, folded under settings later)

**Interfaces:**
- Consumes: `v2ModuleManifests` from `@/modules/v2-registry` (metadata: id, kind); `moduleRegistry` shape stays for backward compat
- Produces: navigation exposing: today, learning, career, english, fitness, review, knowledge, badge, settings

- [ ] **Step 1: Write the failing test**

```js
// apps/web/src/lib/module-registry.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { moduleRegistry } from "./module-registry.ts";

test("registry exposes nine modules with unique keys and hrefs", () => {
  const keys = moduleRegistry.map((m) => m.key);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(keys.length, 9);
  const hrefs = moduleRegistry.map((m) => m.href);
  assert.equal(new Set(hrefs).size, hrefs.length);
});

test("registry includes today career review badge settings", () => {
  const keys = moduleRegistry.map((m) => m.key).sort();
  assert.deepEqual(keys, [
    "badge", "career", "english", "fitness", "knowledge",
    "learning", "review", "settings", "today",
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test apps/web/src/lib/module-registry.test.mjs`
Expected: FAIL (registry currently has 6 entries)

- [ ] **Step 3: Expand the registry to nine modules**

```ts
// apps/web/src/lib/module-registry.ts
export type ModuleKey =
  | "today" | "learning" | "career" | "english" | "fitness"
  | "review" | "knowledge" | "badge" | "settings";

export const moduleRegistry: ModuleDefinition[] = [
  { key: "today", label: "今日", shortLabel: "今日", href: "/today", description: "今日行动与复盘" },
  { key: "learning", label: "学习中心", shortLabel: "学习", href: "/learning", description: "可配置学习空间" },
  { key: "career", label: "职业成长", shortLabel: "职业", href: "/career", description: "目标、技能与证据" },
  { key: "english", label: "英语进阶", shortLabel: "英语", href: "/english", description: "听说读写综合提升" },
  { key: "fitness", label: "健身训练", shortLabel: "健身", href: "/fitness", description: "身体档案与训练" },
  { key: "review", label: "复盘中心", shortLabel: "复盘", href: "/review", description: "日周月复盘" },
  { key: "knowledge", label: "知识库", shortLabel: "知识", href: "/knowledge", description: "资料、检索与引用" },
  { key: "badge", label: "徽章", shortLabel: "徽章", href: "/badge", description: "可追溯的成长证据" },
  { key: "settings", label: "设置", shortLabel: "设置", href: "/settings", description: "外观、模型与数据" },
];
```

- [ ] **Step 4: Update app-shell for nine modules**

- Desktop sidebar: render all nine from registry (icons map extended).
- Mobile bottom bar: primary five (`today, learning, career, english, fitness`)
  + a sixth "更多" button opening a drawer with `review, knowledge, badge, settings`.
- `isActive` must handle `/` → today.

Icons map (lucide): today `Sun`, learning `BookOpen`, career `Target`,
english `Languages`, fitness `Dumbbell`, review `RotateCcw`, knowledge
`Database`, badge `Award`, settings `Settings`.

- [ ] **Step 5: Add placeholder V2 routes**

Each new route composes the shared `ModulePage` with truthful empty states:

```tsx
// apps/web/src/app/today/page.tsx
import { TodayModule } from "@/modules/today/ui/today-view";
export default function TodayPage() { return <TodayModule />; }
```

For career/review/badge (no UI yet): compose `ModulePage` with the module's
manifest description as placeholder. These get real UI in Stages 3-6.

- [ ] **Step 6: Verify and commit**

Run: `npm test` (all suites incl. new registry test), `npm run typecheck`
Commit:
```bash
git add apps/web/src/lib/module-registry.ts apps/web/src/lib/module-registry.test.mjs apps/web/src/components/app-shell.tsx apps/web/src/app/today/page.tsx apps/web/src/app/career/page.tsx apps/web/src/app/review/page.tsx apps/web/src/app/badge/page.tsx
git commit -m "feat(nav): expand registry to nine modules with responsive shell"
```

---

### Task 7: Today action-first view

**Files:**
- Create: `apps/web/src/modules/today/ui/today-view.tsx`
- Create: `apps/web/src/modules/today/ui/today-actions.ts` (pure selectors over daily-loop state + summaries)
- Test: `apps/web/src/modules/today/ui/today-actions.test.mjs`
- Modify: `apps/web/src/app/today/page.tsx`

**Interfaces:**
- Consumes: `loadDailyLoop` from `@/core/daily-loop`; `aggregateTodayItems` from `@/modules/today/public`; `isReviewDue` from `@/modules/review/public`; `buildNextDaySuggestion` from `@/core/daily-loop`
- Produces:
  - `export type TodayViewState = { date: string; goal: string; planned: number; completed: number; totalMinutes: number; suggestion: string; reviewDue: boolean }`
  - `export function buildTodayViewState(state: DailyLoopState, reviewDue: boolean): TodayViewState`
  - `export function TodayModule(): JSX.Element`

- [ ] **Step 1: Write the failing test**

```js
// apps/web/src/modules/today/ui/today-actions.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { buildTodayViewState } from "./today-actions.ts";

const loop = {
  activeDate: "2026-08-06",
  goal: "掌握 RAG",
  availableMinutes: 90,
  tasks: [
    { id: "a", title: "读论文", durationMinutes: 30, completedAt: "2026-08-06T01:00:00Z", createdAt: "x" },
    { id: "b", title: "画流程图", durationMinutes: 45, completedAt: null, createdAt: "x" },
  ],
  review: null,
  history: [],
};

test("buildTodayViewState summarizes real task state", () => {
  const view = buildTodayViewState(loop, false);
  assert.equal(view.date, "2026-08-06");
  assert.equal(view.goal, "掌握 RAG");
  assert.equal(view.planned, 2);
  assert.equal(view.completed, 1);
  assert.equal(view.totalMinutes, 75);
  assert.ok(view.suggestion.length > 0);
  assert.equal(view.reviewDue, false);
});

test("reviewDue flag is passed through", () => {
  const view = buildTodayViewState(loop, true);
  assert.equal(view.reviewDue, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test apps/web/src/modules/today/ui/today-actions.test.mjs`
Expected: FAIL with `Cannot find module './today-actions.ts'`

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/web/src/modules/today/ui/today-actions.ts
import type { DailyLoopState } from "@/core/daily-loop";
import { buildNextDaySuggestion, completedTaskCount, plannedMinutes } from "@/core/daily-loop";

export type TodayViewState = {
  date: string;
  goal: string;
  planned: number;
  completed: number;
  totalMinutes: number;
  suggestion: string;
  reviewDue: boolean;
};

export function buildTodayViewState(
  state: DailyLoopState,
  reviewDue: boolean,
): TodayViewState {
  return {
    date: state.activeDate,
    goal: state.goal,
    planned: state.tasks.length,
    completed: completedTaskCount(state),
    totalMinutes: plannedMinutes(state),
    suggestion: buildNextDaySuggestion(state),
    reviewDue,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test apps/web/src/modules/today/ui/today-actions.test.mjs`
Expected: 2/2 PASS

- [ ] **Step 5: Implement TodayModule UI**

```tsx
// apps/web/src/modules/today/ui/today-view.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Circle, Clock3, Target } from "lucide-react";
import { createEmptyDailyLoopState, loadDailyLoop, type DailyLoopState } from "@/core/daily-loop";
import { buildTodayViewState } from "./today-actions";

export function TodayModule() {
  const [state, setState] = useState<DailyLoopState>(() => createEmptyDailyLoopState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadDailyLoop(window.localStorage));
    setHydrated(true);
  }, []);

  const view = useMemo(() => buildTodayViewState(state, false), [state]);

  if (!hydrated) {
    return <section className="page-stack"><p className="text-muted">加载今日行动…</p></section>;
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">TODAY</span>
          <h1>今日行动</h1>
          <p>{view.date} · {view.goal || "先设定一个阶段目标"}</p>
        </div>
        <button className="primary-button" type="button">
          开始今日行动<ArrowRight size={16} />
        </button>
      </header>

      <div className="stat-row" role="list" aria-label="今日概览">
        <div className="stat-card"><Clock3 size={16} /><strong>{view.totalMinutes}</strong><span>计划分钟</span></div>
        <div className="stat-card"><CheckCircle2 size={16} /><strong>{view.completed}/{view.planned}</strong><span>任务完成</span></div>
        <div className="stat-card"><Target size={16} /><strong>{view.goal ? "进行中" : "未设定"}</strong><span>当前目标</span></div>
      </div>

      <div className="card">
        <h2 className="card-title">今日任务</h2>
        {state.tasks.length === 0 ? (
          <p className="empty-state">今天还没有任务。围绕目标创建 1～3 个可完成的行动。</p>
        ) : (
          <ul className="task-list">
            {state.tasks.map((task) => (
              <li key={task.id} className={task.completedAt ? "task-item done" : "task-item"}>
                {task.completedAt ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                <span className="task-title">{task.title}</span>
                <span className="task-chip">{task.durationMinutes} 分钟</span>
                <span className="task-chip source">每日循环</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card suggestion-card">
        <h2 className="card-title">明日建议</h2>
        <p>{view.suggestion}</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Add supporting CSS classes**

Append to `globals.css`: `.stat-row`, `.stat-card`, `.card`, `.card-title`,
`.task-list`, `.task-item`, `.task-chip`, `.empty-state`, `.suggestion-card`,
`.text-muted` — all using semantic tokens only.

- [ ] **Step 7: Verify and commit**

Run: `npm test`, `npm run typecheck`
Commit:
```bash
git add apps/web/src/modules/today/ui/today-view.tsx apps/web/src/modules/today/ui/today-actions.ts apps/web/src/modules/today/ui/today-actions.test.mjs apps/web/src/app/today/page.tsx apps/web/src/app/globals.css
git commit -m "feat(today): add action-first Today view with real V1 state"
```

---

### Task 8: Verification and delivery

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: all suites pass (19 existing + new theme/registry/today tests)

- [ ] **Step 2: Typecheck and production build**

Run: `npm run typecheck`; `npm run build` (clear `.next` first if sandbox
delete guard trips; verify BUILD_ID and static output present even if the
final cleanup step errors).

- [ ] **Step 3: Boundary and discipline audit**

Run: grep for cross-module internal imports (should be none):
`grep -rn "from \"@/modules/[a-z-]*/\(domain\|application\|infrastructure\|ui\|migrations\)" apps/web/src`
Expected: no matches. Confirm no component hard-codes theme colors
(`grep -rniE "#[0-9a-f]{6}|rgba?\\(" apps/web/src/components apps/web/src/modules/today/ui` → only tokens).

- [ ] **Step 4: Commit remaining docs and finalize**

```bash
git add docs/superpowers/plans/2026-08-06-stage2-theme-nav-plan.md
git commit -m "docs(superpowers): add Stage 2 implementation plan"
```

- [ ] **Step 5: Push and merge note**

Push `v2/stage-2-theme-nav` to origin; open PR description listing: affected
modules (theme/today/nav), contract changes (registry expansion,
theme-provider API), migration (none — additive routes, V1 data untouched),
verification (tests/typecheck/build), rollback (feature flag `v2Navigation`).
Do not merge into main without owner approval.
