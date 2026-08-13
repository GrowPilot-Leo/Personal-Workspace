# GrowPilot Stage 3 Local-First Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the real local loop from Learning task creation through Today execution, Review/rollover, Workspace V2 backup controls, bounded application caching, and release evidence.

**Architecture:** GrowPilot remains a single-user, local-first application. `WorkspaceStateV2` in browser `localStorage` is the only growth-data root; modules expose pure transformations and UI components persist returned state through `WorkspaceRepository`. Service-worker `CacheStorage` is disposable application cache and must stay isolated from growth data.

**Tech Stack:** Next.js 16, React 19, TypeScript 6, browser `localStorage`, Service Worker Cache API, Node built-in test runner, Playwright, axe-core.

## Global Constraints

- Start only from branch `codex/v4-stage3-closure`, commit `5ca5369` or a direct descendant.
- Work only in `C:\Users\lilei\Documents\个人工作台\coverage\.codex-worktrees\stage3-configurable-learning`; do not edit or clean the main checkout.
- Do not merge or rebase `main` into this branch unless the owner explicitly requests it.
- No cloud database, cloud sync, server persistence, OAuth, account system, or application login.
- Device access control is delegated to the operating-system account and device lock.
- No RAG, DeepSeek/provider API integration, Harness, Career, English, Fitness, or Stage 4 implementation.
- Add no dependency and do not change the lockfile.
- Reuse `WorkspaceStateV2`, `loadWorkspace()`, `saveWorkspace()`, `summarizeTasksForToday()`, and `aggregateTodayItems()`.
- Never call `localStorage.clear()` and never delete appearance keys, migration logs, V1 backups, or corrupt-data backups from the cache-cleaning action.
- “清理应用缓存” and “清空成长数据” are separate actions with separate copy and behavior.
- Cache cleanup may delete only Cache Storage names beginning with `growpilot-`; it must not unregister the service worker.
- Keep existing accessibility, keyboard focus, polite announcements, and reduced-motion behavior.
- Use TDD for every non-trivial behavior: focused RED, minimal GREEN, focused verification, then review.
- Do not run the full suite after every edit. Run focused tests inside a cycle, one phase gate after Task 6, one after Task 7, and one final release gate in Task 8.
- Do not report a test or review as passed without fresh command output from the current commit.
- Keep commits scoped and stop after any failed gate; diagnose the root cause before further implementation.

---

## Task 6: Connect source-tagged Learning tasks to Today

### Cycle A — Pure Workspace V2 projection and actions

**Files:**

- Modify: `apps/web/src/modules/today/ui/today-actions.test.mjs`
- Modify: `apps/web/src/modules/today/ui/today-actions.ts`
- Modify: `apps/web/src/modules/today/public.ts`
- Modify: `apps/web/src/modules/modules.test.mjs`

**Interfaces:**

```ts
export type TodayItem = {
  id: EntityId;
  sourceModule: string;
  sourceEntityId: EntityId;
  sourceLabel: string;
  title: string;
  durationMinutes: number;
  dueAt?: string;
  status: "planned" | "active" | "done";
};

export type TodayViewState = {
  date: string;
  items: TodayItem[];
  planned: number;
  completed: number;
  totalMinutes: number;
  capacityMinutes: number | null;
  reviewDue: boolean;
};

export function buildTodayViewState(
  workspace: WorkspaceStateV2,
  dateKey: string,
): TodayViewState;

export function startWorkspaceTask(
  workspace: WorkspaceStateV2,
  taskId: EntityId,
  now: IsoDateTime,
): WorkspaceStateV2;

export function toggleWorkspaceTaskCompletion(
  workspace: WorkspaceStateV2,
  taskId: EntityId,
  now: IsoDateTime,
): WorkspaceStateV2;
```

Projection rules:

- Include only tasks whose `scheduledDate === dateKey` and whose owning Learning space is not archived.
- Obtain source-tagged items through `summarizeTasksForToday()` and combine them through `aggregateTodayItems()`; Today must not inspect or copy Learning plan internals.
- Timed items sort before untimed items through the existing aggregator.
- `planned`, `completed`, and `totalMinutes` derive only from projected tasks.
- `capacityMinutes` is the sum of non-null capacity values from active daily plan versions for `dateKey` owned by non-archived spaces; if no such value exists, return `null` and show no percentage.
- Starting changes only the addressed non-done task from `planned` to `active` and updates `updatedAt`.
- Completing changes only the addressed task to `done`, sets `completedAt`, and appends one `learning.task.completed` event.
- Undo changes the addressed done task to `planned`, clears `completedAt`, and appends no event.
- Re-completing a task must not add a second completion event when an event with the same task `entityId` already exists.
- All functions are pure and leave the input workspace and plan arrays unmodified.

- [ ] Add focused tests covering every projection/action rule above.
- [ ] Run the focused tests before production edits and record the expected failure.

```powershell
node --experimental-strip-types --test apps/web/src/modules/today/ui/today-actions.test.mjs apps/web/src/modules/modules.test.mjs
```

- [ ] Implement only the minimum production changes needed for GREEN.
- [ ] Run the same focused command and require all selected tests to pass.
- [ ] Review the diff for plan copying, duplicate events, input mutation, and unrelated refactors.
- [ ] Commit the test contract and implementation in scoped commits.

```powershell
git add apps/web/src/modules/today/ui/today-actions.test.mjs apps/web/src/modules/modules.test.mjs
git commit -m "test(today): specify workspace task projection"
git add apps/web/src/modules/today/ui/today-actions.ts apps/web/src/modules/today/public.ts
git commit -m "feat(today): execute source-tagged learning tasks"
```

### Cycle B — Today UI and cross-page round trip

**Files:**

- Modify: `apps/web/src/modules/today/ui/today-view.tsx`
- Modify: `apps/web/e2e/v3-stability.spec.ts`

UI rules:

- Load once with `createBrowserWorkspaceRepository().loadWorkspace()` and save returned V2 state with `saveWorkspace()`.
- Display each item’s Learning-space name as its source label.
- Preserve start-next, direct completion/undo, workload summary, focus scroll, polite announcement, and reduced-motion behavior.
- When `capacityMinutes === null`, show planned minutes without a fabricated percentage or progress denominator.
- When no task exists for the date, show a clear link to `/learning`; do not render fake timeline entries.
- Learning and Today must display the same task record, not synchronized copies.

- [ ] Add a Playwright test named with `source-tagged learning task` that creates a Learning space and today task, opens Today, verifies task and source, starts and completes it, returns to Learning, and verifies the same task is complete.
- [ ] Run it first and record RED.
- [ ] Implement the minimal UI wiring and run it again to GREEN.

```powershell
npx.cmd playwright test apps/web/e2e/v3-stability.spec.ts --grep "source-tagged learning task"
```

- [ ] Run the Task 6 phase gate once.

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

- [ ] Review Task 6 for data integrity, module boundaries, accessibility, and needless code.
- [ ] Commit the cross-page evidence.

```powershell
git add apps/web/src/modules/today/ui/today-view.tsx apps/web/e2e/v3-stability.spec.ts
git commit -m "test(e2e): verify learning task round trip"
```

**Task 6 acceptance:** Learning-created tasks appear in Today with source labels; start/complete/undo persist to the same V2 task; one completion event is emitted; empty and no-capacity states are honest; focused E2E, unit, typecheck, and build pass.

---

## Task 7: Close Review, rollover, local backup, and cache hygiene

### Cycle A — Review V2 and idempotent rollover

**Files:**

- Modify: `apps/web/src/modules/review/public.ts`
- Modify: `apps/web/src/modules/review/index.tsx`
- Modify: `apps/web/src/modules/modules.test.mjs`
- Modify: `apps/web/e2e/v3-stability.spec.ts`

**Interfaces:**

```ts
export type DailyReviewSummary = {
  date: string;
  planned: number;
  completed: number;
  plannedMinutes: number;
  completedMinutes: number;
};

export function buildDailyReviewSummary(
  workspace: WorkspaceStateV2,
  dateKey: string,
): DailyReviewSummary;

export function saveWorkspaceReview(
  workspace: WorkspaceStateV2,
  input: { dateKey: string; wins: string; blockers: string; adjustment: string },
  now: IsoDateTime,
): WorkspaceStateV2;

export function rollWorkspaceForward(
  workspace: WorkspaceStateV2,
  fromDate: string,
  toDate: string,
  now: IsoDateTime,
): WorkspaceStateV2;
```

Behavior rules:

- Daily summaries derive from actual tasks scheduled on the requested date.
- A workspace daily review uses `ownerModuleId: "workspace"`, `ownerEntityId: null`, `horizon: "daily"`, and `periodKey: dateKey`.
- Re-saving the same daily review updates it instead of appending a duplicate.
- Rollover reschedules the same unfinished task record; it does not clone it.
- Only tasks owned by active or planned Learning spaces roll from `fromDate` to `toDate`.
- Completed tasks stay on their original date; paused, archived, completed, and draft spaces do not roll.
- Repeating the same rollover is idempotent.
- Review never creates or edits Learning plans.

- [ ] Add focused RED tests for all rules.
- [ ] Implement pure helpers to GREEN.
- [ ] Move Review UI from legacy `DailyLoopState` to Workspace V2 while preserving current wording and the rule that a review must be saved before rollover.
- [ ] Add focused E2E for save review, active-space rollover, and paused-space non-rollover.

```powershell
node --experimental-strip-types --test apps/web/src/modules/modules.test.mjs
npx.cmd playwright test apps/web/e2e/v3-stability.spec.ts --grep "review|rollover"
```

- [ ] Commit after focused tests and review pass.

```powershell
git add apps/web/src/modules/review/public.ts apps/web/src/modules/review/index.tsx apps/web/src/modules/modules.test.mjs apps/web/e2e/v3-stability.spec.ts
git commit -m "feat(review): close workspace review and rollover loop"
```

### Cycle B — Workspace V2 export, import, and growth-data clearing

**Files:**

- Modify: `apps/web/src/core/migrations.ts`
- Modify: `apps/web/src/core/migrations.test.mjs`
- Create: `apps/web/src/modules/settings/data.ts`
- Modify: `apps/web/src/modules/settings/index.tsx`
- Modify: `apps/web/src/core/persistence.test.mjs`
- Modify: `apps/web/src/modules/modules.test.mjs`
- Modify: `apps/web/e2e/v3-stability.spec.ts`

**Interfaces:**

```ts
export function migrateDailyLoopPayloadToWorkspaceV2(
  value: unknown,
  now: IsoDateTime,
): WorkspaceStateV2 | null;

export function buildWorkspaceExport(
  workspace: WorkspaceStateV2,
  appearance: { theme: Theme; motion: Motion },
  exportedAt: IsoDateTime,
): WorkspaceExportV2;

export function parseWorkspaceImport(
  value: unknown,
  now: IsoDateTime,
): { workspace: WorkspaceStateV2; appearance: Partial<{ theme: Theme; motion: Motion }> } | null;
```

`migrateDailyLoopPayloadToWorkspaceV2()` must expose the existing private V1 parser/converter as one pure reusable boundary; it must not introduce a second migration algorithm or write storage.

Export format:

```ts
{
  schema: "growpilot.workspace.export",
  version: 2,
  exportedAt: string,
  appearance: { theme: Theme, motion: Motion },
  workspace: WorkspaceStateV2
}
```

Behavior rules:

- Export contains the complete normalized Workspace V2 root and appearance preferences.
- Import accepts that V2 envelope and the previously exported V1 envelope; V1 is migrated through existing migration code.
- A V2 envelope is structurally valid only when `workspace.version === 2` and all five collections are arrays; a missing or malformed root must fail instead of normalizing into an empty workspace.
- Normalize the candidate before the overwrite confirmation, but do not save until the user confirms replacement.
- Invalid or malformed imports visibly fail and leave current data and appearance unchanged.
- “清空成长数据” writes `createEmptyWorkspaceStateV2(now)` through `saveWorkspace()` only after confirmation.
- Growth-data clearing preserves appearance preferences, migration records, `growpilot.daily-loop.v1.backup`, and corrupt-data backups.
- Summary cards show Learning spaces, scheduled tasks, and reviews.

- [ ] Add focused migration, export/import, and repository tests and prove RED.
- [ ] Implement Settings V2 behavior to GREEN.
- [ ] Add Playwright download/import/clear assertions.

```powershell
node --experimental-strip-types --test apps/web/src/core/migrations.test.mjs apps/web/src/core/persistence.test.mjs apps/web/src/modules/modules.test.mjs
npx.cmd playwright test apps/web/e2e/v3-stability.spec.ts --grep "workspace data"
```

- [ ] Commit only after invalid-import preservation and confirmed-clear behavior pass.

```powershell
git add apps/web/src/core/migrations.ts apps/web/src/core/migrations.test.mjs apps/web/src/modules/settings/data.ts apps/web/src/modules/settings/index.tsx apps/web/src/core/persistence.test.mjs apps/web/src/modules/modules.test.mjs apps/web/e2e/v3-stability.spec.ts
git commit -m "feat(settings): manage local workspace backups"
```

### Cycle C — Bounded application cache and manual cleanup

**Files:**

- Create: `apps/web/src/modules/settings/cache.ts`
- Modify: `apps/web/src/modules/modules.test.mjs`
- Modify: `apps/web/src/modules/settings/index.tsx`
- Modify: `apps/web/public/sw.js`
- Modify: `apps/web/e2e/v3-stability.spec.ts`

**Interface:**

```ts
export const GROWPILOT_CACHE_PREFIX = "growpilot-";

export async function clearGrowPilotCaches(
  cacheStorage: Pick<CacheStorage, "keys" | "delete">,
): Promise<number>;
```

Behavior rules:

- `clearGrowPilotCaches()` deletes only cache names beginning with `growpilot-` and returns the number successfully deleted.
- It never accesses localStorage and never unregisters the service worker.
- Add a secondary “清理应用缓存” button, visually and semantically separate from the destructive “清空成长数据” button.
- On success announce exactly: `应用缓存已清理，成长数据未受影响。`
- If offline, do not clear; announce that a network connection is required so the cache can be rebuilt safely.
- If Cache Storage is unavailable or deletion rejects, show a visible failure and leave growth data unchanged.
- Keep `growpilot-shell-v2` and the current network-first strategy, but cap the runtime-written entries at 80. Never evict the four `APP_SHELL` entries while trimming; no new cache library or abstraction.

- [ ] Add RED unit tests using a tiny fake CacheStorage for prefix filtering, return count, and rejection propagation.
- [ ] Implement `cache.ts` and wire the Settings button to GREEN.
- [ ] Add a service-worker source/behavior assertion that the runtime cap is 80 and `APP_SHELL` entries are protected.
- [ ] Add an E2E test that seeds one `growpilot-*` cache and one unrelated cache, clicks cleanup, verifies only the GrowPilot cache is deleted, and verifies `growpilot.workspace.v2` is byte-for-byte unchanged.

```powershell
node --experimental-strip-types --test apps/web/src/modules/modules.test.mjs apps/web/src/v3-gate.test.mjs
npx.cmd playwright test apps/web/e2e/v3-stability.spec.ts --grep "application cache"
```

- [ ] Run the Task 7 phase gate once.

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

- [ ] Review Task 7 for data loss, rollover idempotence, cache isolation, accessible naming, and needless abstractions.
- [ ] Commit cache work separately.

```powershell
git add apps/web/src/modules/settings/cache.ts apps/web/src/modules/modules.test.mjs apps/web/src/modules/settings/index.tsx apps/web/public/sw.js apps/web/e2e/v3-stability.spec.ts
git commit -m "feat(settings): bound and clear application cache"
```

**Task 7 acceptance:** Review and rollover use V2; backup/import/clear preserve intended data boundaries; application cache is manually clearable and bounded; no growth data, appearance, or backups are removed by cache cleanup.

---

## Task 8: Release regression and acceptance evidence

**Files:**

- Modify: `apps/web/e2e/v3-stability.spec.ts`
- Modify: `README.md`
- Modify: `docs/v2/DELIVERY_PLAN.md`
- Create: `docs/v2/STAGE3_ACCEPTANCE.md`

- [ ] Add only missing lifecycle coverage: reload persistence, pause/resume, archive read-only history, exact-name delete isolation, idempotent V1 migration, 390 px overflow, reduced motion, and axe critical/serious violations.
- [ ] Do not replace behavior assertions with screenshots.
- [ ] Run the final local gate once; do not run `npm install` because the lockfile must not change.

```powershell
npm.cmd audit --audit-level=high
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test:e2e
git status --short
```

- [ ] Verify at 1280×800 and 390×844: Learning empty/list/active/paused/archived states, dialogs, Today source labels and completion, Review rollover, Settings backup/cache actions, themes, keyboard focus, and reduced motion.
- [ ] Record branch, tested SHA, exact command results, CI URL, preview URL, desktop/mobile matrix, migration outcomes, axe result, audit result, rollback steps, and later-stage limitations in `docs/v2/STAGE3_ACCEPTANCE.md`.
- [ ] Update README and delivery status without claiming cloud sync, login, RAG, or completed Career/English/Fitness.
- [ ] Request strict review. Resolve correctness, data-loss, accessibility, and module-boundary findings, then rerun only the gates affected by changes plus the final full gate once.
- [ ] Commit release evidence.

```powershell
git add apps/web/e2e/v3-stability.spec.ts README.md docs/v2/DELIVERY_PLAN.md docs/v2/STAGE3_ACCEPTANCE.md
git commit -m "docs(stage3): record local-first acceptance"
```

- [ ] Push `codex/v4-stage3-closure` and open a Draft PR to `main`; do not merge and do not mark ready until CI, preview, and owner acceptance are green.

## Stop Conditions

Stop and report evidence instead of guessing when:

- the starting branch or ancestry does not include `5ca5369`;
- the worktree contains unrelated user changes;
- a change requires a new dependency, cloud service, login, data-model expansion, or modification outside Task 6–8;
- migration, import, clear-data, cache isolation, or rollover tests expose possible data loss;
- a focused RED test passes before implementation for an unexplained reason;
- a phase gate fails three times with the same unresolved cause.

## Final Definition of Done

Stage 3 is complete only when Tasks 6–8 are accepted, all matrix behaviors have recorded evidence, the final local gate passes on the tested commit, CI and preview are green, no secrets/personal exports are tracked, no Stage 4 work is mixed into the branch, and the owner approves the preview.
