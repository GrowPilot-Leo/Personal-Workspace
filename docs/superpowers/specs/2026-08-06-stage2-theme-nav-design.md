# Stage 2 Design: Themes, Navigation and Today Layout

> Status: approved by repository owner (2026-08-06)
> Source of truth: `docs/v2/DESIGN_SYSTEM.md`, `docs/v2/DEMO_IMPLEMENTATION_BRIEF.md` §3-4,7

## 1. Goal

Give GrowPilot a V2 visual foundation: a token-based theme system with three
default themes (Day, Night, Dusk), responsive desktop/mobile navigation exposing
the nine fixed modules, and an action-first Today layout. No business rules are
introduced in this stage; UI consumes only the V1 daily loop and V2 module
manifests that already exist.

## 2. Scope

**In scope:**

- Token layers: foundation → semantic → component tokens with theme overrides
- Three themes: Day / Night / Dusk (readable on desktop and mobile)
- Theme preference persistence (`growpilot.theme.v1`) and switching UI
- Motion preference (full / reduced / off / system) with reduced-motion CSS
- Responsive navigation: desktop sidebar + mobile bottom bar, all nine modules
- Action-first Today layout using real V1 daily-loop state
- Button feedback: hover, pressed, focus, disabled states

**Out of scope (later stages):**

- Wallpapers (static/seasonal/upload) — Stage 8
- Charts and chart palettes — Stage 2 requires theme-safe chart *examples*
  only if a chart exists; none exists yet, so skip
- Configurable learning spaces — Stage 3
- Knowledge / badges / career / english / fitness business UI — Stage 3-6

## 3. Design decisions

### 3.1 Token architecture

Follow DESIGN_SYSTEM §2 layering:

```text
foundation tokens (spacing, radius, typography scale — theme-independent)
-> semantic tokens (--color-bg-canvas, --color-text-primary, ...)
-> component tokens (--sidebar-bg, --nav-active-bg, ...)
-> theme override (html[data-theme="night"] { ... })
```

Business modules use only semantic tokens. Component tokens live in
`shared/theme` and are consumed by the shell components.

### 3.2 Theme definitions

- **Day**: warm light canvas (#f7f4ee), white surfaces, dark green-gray text,
  green primary action (#2f8f5b), blue info, amber review reminder
- **Night**: dark blue-black canvas (#0e1418), dark gray surfaces (#182027),
  soft light text (#e8edf1), teal primary (#2aa198), purple AI accent
- **Dusk**: deep purple-brown canvas (#1a1620), warm gray-purple surfaces
  (#241f2b), amber primary (#d9a441), coral emphasis (#e07a5f)

Avoid pure black with pure white on long reading surfaces.

### 3.3 Theme switching

- HTML `data-theme` attribute on `<html>`, set in a small inline script in
  `layout.tsx` head to avoid flash of wrong theme (FOUC)
- Preference persisted to `growpilot.theme.v1` via `settings` module public API
  (already exists: `readStoredTheme` / `writeStoredTheme`)
- Default: Day. Hydration-safe: script reads storage before React mounts.

### 3.4 Motion modes

- `data-motion` attribute on `<html>`: full | reduced | off | system
- CSS: `@media (prefers-reduced-motion: reduce)` + `[data-motion="reduced"]`
  disable decorative transitions
- Persisted to `growpilot.motion.v1`

### 3.5 Navigation structure

Nine fixed modules from `v2-registry.ts` manifest metadata:

| id | label | href |
|---|---|---|
| today | 今日 | /today |
| learning | 学习 | /learning |
| career | 职业 | /career |
| english | 英语 | /english |
| fitness | 健身 | /fitness |
| review | 复盘 | /review |
| knowledge | 知识 | /knowledge |
| badge | 徽章 | /badge |
| settings | 设置 | /settings |

Desktop: 268px sidebar with brand + nav list + sidebar note.
Mobile: bottom bar with 5 primary items (today, learning, career, english,
fitness) + a "more" entry to a drawer with the remaining items. Keep the
existing V1 routes working; add V2 routes as lightweight placeholders that
compose `ModulePage` until their owning stage.

### 3.6 Today layout (action-first)

Today page aggregates real V1 daily-loop state:

- Header: date, current goal, action-first CTA ("开始今日行动")
- Task list: planned vs completed with real durations and completion states
- Next-action suggestion from `buildNextDaySuggestion` (V1 rule, real data)
- Review reminder card when a daily review is due (via review module's
  `isReviewDue`)
- Module source chip on each task (single source: daily-loop for V1)

No invented progress values. Empty states are truthful.

### 3.7 File structure

```text
apps/web/src/
├── shared/
│   └── theme/
│       ├── tokens.css          foundation + semantic tokens
│       ├── themes.css          three theme overrides
│       ├── motion.css          reduced-motion handling
│       └── theme-provider.tsx  React provider: reads/writes storage,
│                               sets data-theme/data-motion
├── components/
│   ├── app-shell.tsx           (modified) responsive shell, nine modules
│   └── theme-switcher.tsx      dropdown/segmented control
├── app/
│   ├── layout.tsx              (modified) inline theme bootstrap script
│   └── today/page.tsx          V2 Today route
└── modules/
    └── today/
        ├── ui/today-view.tsx   Today page UI composing daily-loop + summaries
        └── ui/…                 small presentational components
```

## 4. Interface contracts

```ts
// shared/theme/theme-provider.tsx
type Theme = "day" | "night" | "dusk";
type Motion = "full" | "reduced" | "off" | "system";
function ThemeProvider({ children }: { children: ReactNode }): JSX.Element;
function useTheme(): { theme: Theme; setTheme(t: Theme): void; motion: Motion; setMotion(m: Motion): void };
```

`setTheme`/`setMotion` persist via the settings module public API and update
`document.documentElement` attributes. All other UI components read theme only
through CSS tokens — no component hard-codes colors.

## 5. Testing strategy

- Rule tests (node --experimental-strip-types, pure functions):
  - `theme.ts`: default theme, valid-value guards (reuse settings module
    guards), storage round-trip
  - `today aggregation`: real daily-loop state → TodayTask summaries,
    due-review flag (reuse existing core/module rule tests where possible)
- Component-level: typecheck + production build + manual verification in
  browser at three themes and desktop/mobile widths (verification checklist
  in the plan)

## 6. Acceptance criteria (from DEMO brief §8)

- [x] theme persistence round-trips
- [ ] three themes readable on desktop and mobile
- [ ] reduced-motion behavior honored
- [ ] mobile navigation reachable
- [ ] existing V1 tests stay green
- [ ] typecheck + production build pass
- [ ] no client-side secrets, no fabricated progress values
