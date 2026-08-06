# Stage 2.1 Design: Mobile Drawer + iOS Interaction Polish

> Status: design reviewed 2026-08-06 — pending owner sign-off
> Source of truth: this document + `docs/v2/DESIGN_SYSTEM.md`

## 1. Why this stage

Stage 2 shipped themes, nine-module navigation and Today view. The user
review flagged two problems on mobile and one on the global interaction
language:

1. The mobile bottom nav crammed a "more" button as the sixth item, fighting
   browser toolbars (notably Android Chrome's pull-up bar) and reading like a
   sixth primary module instead of an overflow entry.
2. Touch targets lacked iOS-style press feedback (no scale + opacity
   transition); theme switches were instant color jumps; the drawer was a
   native `<details>` element with no slide animation.
3. List items and cards had no entry animation, breaking the "action-first"
   feel that Stage 2 set out to deliver.

## 2. Goals

- Make the mobile bottom bar always show exactly five fixed modules.
- Move the four secondary modules behind a side drawer, openable from a
  hamburger in the top bar on mobile and the existing "more" entry in the
  sidebar on desktop. Same drawer, two trigger surfaces.
- Apply the iOS interaction language: spring press feedback (scale + opacity),
  spring drawer slide, eased theme transition, staggered list entry.

## 3. Information architecture (mobile)

```text
[Top bar]   [☰]  GrowPilot                              [⚙ settings]
  │
  │  tap ☰
  ▼
[Side drawer — from left, spring]
  ├ Brand block
  ├ Section: 固定模块 (5)
  │   ├ 今日 / 学习 / 健身 / 复盘 / 知识
  ├ Section: 更多模块 (4)
  │   ├ 职业 / 英语 / 徽章 / 设置
  ├ Theme switcher
  └ Data status note

[Main content]   (route outlet)

[Bottom bar]   5 fixed tabs: 今日 | 学习 | 健身 | 复盘 | 知识
```

## 4. Bottom tab selection

| Position | Module | Why |
|---|---|---|
| 1 | 今日 | Stage 2 action-first entry |
| 2 | 学习 | Highest-frequency learning surface |
| 3 | 健身 | Body data, daily relevance |
| 4 | 复盘 | Loop closure, recurring |
| 5 | 知识 | Resources / RAG access |

Secondary modules in drawer: 职业, 英语, 徽章, 设置.

## 5. Drawer contract

```ts
// apps/web/src/modules/shared/drawer/drawer.tsx
type DrawerProps = {
  open: boolean;
  onClose: () => void;
  side: "left";          // current scope; future "right" reserved
  children: ReactNode;
};
// Behavior
// - open: translateX(-100%) → translateX(0), 320ms, cubic-bezier(0.32, 0.72, 0, 1)
// - close: reverse; onClose called at end
// - backdrop: opacity 0 → 0.4, 280ms
// - Esc closes; click on backdrop closes; focus trap inside drawer
// - body scroll locked while open
```

The drawer is owned by `app-shell.tsx`. Desktop and mobile trigger the same
instance: desktop uses the existing sidebar "more" entry; mobile uses the
hamburger button in the top bar.

## 6. Interaction tokens

Append to `shared/theme/tokens.css`:

```css
--ease-ios: cubic-bezier(0.32, 0.72, 0, 1);
--ease-ios-out: cubic-bezier(0.16, 1, 0.3, 1);
--press-scale: 0.97;
--press-opacity: 0.7;
--transition-press: 120ms var(--ease-ios);
--transition-color: 240ms ease;
--transition-drawer: 320ms var(--ease-ios);
--transition-list: 280ms var(--ease-ios-out);
```

These compose with the existing `--motion-transition` (which controls
reduced-motion behavior; the two systems stay orthogonal).

## 7. Component feedback rules

- **Buttons and nav items** — `:active` applies `transform: scale(var(--press-scale))`
  + `opacity: var(--press-opacity)` for `var(--transition-press)`. Hover
  state is only enabled when `@media (hover: hover)`.
- **Cards and task rows** — same press feedback plus `background-color`
  transition at `var(--transition-color)`.
- **Theme switching** — `body`, sidebar, mobile bar, and cards add
  `transition: background-color var(--transition-color), color var(--transition-color), border-color var(--transition-color)`.
- **List entry** — CSS `@keyframes` fades and slides each item with
  `animation-delay: calc(var(--i) * 50ms)` (stagger via inline CSS variable
  on each child). No JS, no framer-motion.
- **Drawer** — `transform: translateX(...)` with the spring easing above.
- **Reduced motion** — when `data-motion="reduced"` or `prefers-reduced-motion:
  reduce`, transform-based animations are skipped; opacity transitions stay
  (they don't trigger vestibular issues).

## 8. Affected files

```text
New:
  apps/web/src/modules/shared/drawer/drawer.tsx
  apps/web/src/modules/shared/drawer/drawer.test.mjs
  apps/web/src/components/mobile-drawer-toggle.tsx

Modified:
  apps/web/src/components/app-shell.tsx         replace <details> with <Drawer>
  apps/web/src/app/globals.css                  global active + list-entry
  apps/web/src/shared/theme/tokens.css          iOS interaction tokens
```

## 9. Out of scope

- Bottom tab reordering by user (future stage).
- Right-side drawer (e.g., for notifications) — contract reserves the slot.
- Haptic feedback API — would require native shim; CSS-only feedback for now.

## 10. Acceptance

- [ ] Mobile bottom bar shows exactly five modules
- [ ] Mobile hamburger opens a left-side drawer containing all nine modules
- [ ] Desktop sidebar "more" entry opens the same drawer
- [ ] All buttons and cards show iOS-style press feedback
- [ ] Theme switch animates over ~240ms with no flash
- [ ] List items stagger in on first paint
- [ ] All existing tests stay green; new behavior is covered
- [ ] typecheck + production build pass
- [ ] reduced-motion mode disables transform-based animation
