# GrowPilot Learning-Today-Review MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved local-first Learning → Today → Review → Settings workflow as the only visible GrowPilot MVP.

**Architecture:** Keep Workspace V2 and the completed Today/Review domain work. Add backward-compatible task metadata plus a thin Learning MVP action layer, then project the same task objects through Today and Review. Finish the already-started Settings V2 backup work and expose only four routes in the responsive shell.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 6, localStorage repository, Node test runner, Playwright Chromium.

**Spec:** `docs/superpowers/specs/2026-08-24-learning-today-review-mvp-design.md`

## Global Constraints

- Primary routes are exactly Today, Learning, Review, and Settings.
- No account, cloud database, cloud sync, RAG, DeepSeek, harness, timer, Android packaging, cache manager, or new dependency.
- Preserve valid Workspace V2, V1 migration compatibility, appearance settings, migration records, and backup records.
- Existing uncommitted Task 7B files are owned by Task 1; do not discard or rewrite them from scratch.
- Use one RED and one focused GREEN command per task; run the full unit/build/E2E gate only in Task 4.
- Do not delete dormant module code. Remove it only from visible navigation and the acceptance path.
- Use the existing isolated worktree `coverage/.codex-worktrees/stage3-recovery` and branch `codex/v4-stage3-recovery`.

---

### Task 1: Close Workspace V2 backup and restore

**Files:**
- Modify: `apps/web/src/core/migrations.ts`
- Modify: `apps/web/src/core/migrations.test.mjs`
- Modify: `apps/web/src/core/persistence.test.mjs`
- Create: `apps/web/src/modules/settings/data.ts`
- Modify: `apps/web/src/modules/settings/index.tsx`
- Modify: `apps/web/src/modules/modules.test.mjs`
- Modify: `apps/web/e2e/v3-stability.spec.ts`

**Interfaces:**
- Consumes: `migrateDailyLoopPayloadToWorkspaceV2(value, now)`, `WorkspaceRepository.loadWorkspace()`, `WorkspaceRepository.saveWorkspace(state)`.
- Produces:
  - `buildWorkspaceExport(workspace, appearance, exportedAt): WorkspaceExportV2`
  - `parseWorkspaceImport(value, now): ParsedWorkspaceImport | null`
  - `ParsedWorkspaceImport.summary: { spaces: number; tasks: number; reviews: number }`

- [ ] **Step 1: Extend the existing failing specification with import preview**

Add this assertion to the Settings data unit test after parsing a valid V2 export:

```js
assert.deepEqual(parsed.summary, {
  spaces: parsed.workspace.learningSpaces.length,
  tasks: parsed.workspace.tasks.length,
  reviews: parsed.workspace.reviews.length,
});
```

Update the Playwright flow so selecting a valid file first expects:

```ts
await expect(page.getByText(/准备导入：.*学习空间.*任务.*复盘/)).toBeVisible();
await page.getByRole("button", { name: "确认导入" }).click();
```

Replace the invalid literal migration-log fixture `"migration-records"` with the valid raw value already created by migration:

```ts
const migrationBefore = window.localStorage.getItem("growpilot.migrations.v1");
```

The clear assertion must compare the post-clear migration value to `migrationBefore`, because malformed migration-log text is intentionally normalized by the repository read boundary.

- [ ] **Step 2: Run the focused RED tests**

Run:

```powershell
node --experimental-strip-types --test apps/web/src/core/migrations.test.mjs apps/web/src/core/persistence.test.mjs apps/web/src/modules/modules.test.mjs
```

Expected: Settings import summary assertion fails because `summary` is absent.

Run:

```powershell
$env:CI=$null
npx.cmd playwright test apps/web/e2e/v3-stability.spec.ts --project=chromium --grep "workspace data"
```

Expected: failure because the preview and `确认导入` action do not exist.

- [ ] **Step 3: Complete the pure import result**

Return the validated normalized workspace, valid optional appearance values, and counts from `parseWorkspaceImport`:

```ts
export type ParsedWorkspaceImport = {
  workspace: WorkspaceStateV2;
  appearance: { theme: Theme | null; motion: Motion | null };
  summary: { spaces: number; tasks: number; reviews: number };
};
```

The V2 root remains invalid unless version is 2 and all five collections are arrays. V1 input continues through `migrateDailyLoopPayloadToWorkspaceV2`.

- [ ] **Step 4: Implement preview-before-overwrite in Settings**

Store a pending parsed import in state. File selection validates and displays its three counts without saving. Provide `确认导入` and `取消` buttons. Only `确认导入` calls `saveWorkspace`, applies valid appearance values, refreshes counts, clears pending state, and announces `导入成功，当前成长数据已恢复。`.

Invalid input announces `导入失败：请选择 GrowPilot 导出的有效 JSON 文件。` and leaves workspace, appearance, and pending state unchanged. Clear still requires confirmation and saves `createEmptyWorkspaceStateV2(now)`.

- [ ] **Step 5: Run one focused GREEN**

Run the unit command from Step 2, then the one Playwright grep from Step 2.

Expected: all focused unit tests pass and the single browser test passes.

Run `npm.cmd run typecheck` in `apps/web`. Expected: exit 0.

Restore only generated `apps/web/next-env.d.ts` if it differs solely because the dev server changed its generated routes path. Remove only the verified worktree-local `test-results` directory after confirming its resolved path starts with the recovery worktree root.

- [ ] **Step 6: Commit Task 1**

Stage only the seven listed source/test files plus `apps/web/src/modules/settings/data.ts`.

```powershell
git commit -m "feat(settings): close local workspace backup loop"
```

---

### Task 2: Add the default Learning task model

**Files:**
- Modify: `apps/web/src/core/tasks.ts`
- Modify: `apps/web/src/core/contracts.test.mjs`
- Modify: `apps/web/src/core/workspace-state.ts`
- Modify: `apps/web/src/core/workspace-state.test.mjs`
- Create: `apps/web/src/modules/learning/mvp-actions.ts`
- Create: `apps/web/src/modules/learning/mvp-actions.test.mjs`
- Modify: `apps/web/src/modules/learning/index.tsx`

**Interfaces:**
- Produces:

```ts
export type TaskPriority = "high" | "medium" | "low";
export type TaskSubtask = { id: EntityId; title: string; completed: boolean };

export type LearningTaskDraft = {
  title: string;
  description?: string;
  scheduledDate: DateKey;
  durationMinutes?: number;
  priority?: TaskPriority;
  tags?: string[];
  subtasks?: Array<{ id?: EntityId; title: string; completed?: boolean }>;
};

export function ensureDefaultLearningWorkspace(
  workspace: WorkspaceStateV2,
  now: IsoDateTime,
): { workspace: WorkspaceStateV2; space: LearningSpace };

export function createLearningWorkspaceTask(
  workspace: WorkspaceStateV2,
  draft: LearningTaskDraft,
  now: IsoDateTime,
): WorkspaceStateV2;

export function updateLearningWorkspaceTask(
  workspace: WorkspaceStateV2,
  taskId: EntityId,
  draft: LearningTaskDraft,
  now: IsoDateTime,
): WorkspaceStateV2;

export function removeUnfinishedLearningTask(
  workspace: WorkspaceStateV2,
  taskId: EntityId,
  now: IsoDateTime,
): WorkspaceStateV2;
```

- [ ] **Step 1: Write failing task-schema tests**

Specify:

```js
const task = createTask({
  id: "task-1",
  ownerModuleId: "learning",
  ownerEntityId: "space-1",
  title: "复习语法",
  scheduledDate: "2026-08-24",
  priority: "high",
  tags: ["英语", "英语", " 语法 "],
  subtasks: [{ id: "sub-1", title: "整理例句" }],
  now,
});
assert.equal(task.priority, "high");
assert.deepEqual(task.tags, ["英语", "语法"]);
assert.deepEqual(task.subtasks, [
  { id: "sub-1", title: "整理例句", completed: false },
]);
```

Also specify that omitted fields normalize to `medium`, `[]`, and `[]`; tags are capped at three; blank subtasks are removed; old persisted tasks without the new fields remain valid and receive defaults.

- [ ] **Step 2: Run schema RED**

Run:

```powershell
node --experimental-strip-types --test apps/web/src/core/contracts.test.mjs apps/web/src/core/workspace-state.test.mjs
```

Expected: new priority, tags, and subtasks assertions fail.

- [ ] **Step 3: Implement backward-compatible task metadata**

Extend `Task` and `TaskInput` with the exact interfaces above. Normalize title and subtask titles by trimming. Deduplicate trimmed tags, drop blanks, and keep the first three. Existing tasks missing these properties normalize to `priority: "medium"`, `tags: []`, and `subtasks: []`; malformed supplied arrays do not invalidate otherwise valid historical tasks.

- [ ] **Step 4: Write failing default-space action tests**

Specify these cases in `mvp-actions.test.mjs`:

- Empty workspace creates one active blank-template space named `我的学习`.
- An existing active non-archived space is reused without renaming.
- If no space is active, the first non-archived space is activated and reused.
- Creating a task writes one Learning-owned task and one deduplicated `learning.task.scheduled` event.
- Create rejects blank titles and dates outside the DateKey contract.
- Update preserves ID, ownership, status, createdAt, and completion state.
- Delete removes only unfinished Learning tasks; done, non-Learning, and archived-space tasks are unchanged.
- Every rejected path returns the original workspace reference.

- [ ] **Step 5: Run action RED**

Run:

```powershell
node --experimental-strip-types --test apps/web/src/modules/learning/mvp-actions.test.mjs
```

Expected: module not found.

- [ ] **Step 6: Implement the Learning MVP action layer**

Create the exact interfaces above. The default-space selection order is:

1. non-archived space named `我的学习`;
2. first active non-archived space;
3. first non-archived space, promoted to active;
4. new active blank-template `我的学习` space.

Task creation writes directly to Workspace V2 under the selected space; no monthly/weekly/daily plan UI or synthetic plan is required. Task update and delete accept only Learning-owned tasks in the selected non-archived space. Deleting an unfinished task also removes its ID from any active plan data that references it without changing unrelated plans.

- [ ] **Step 7: Replace the Learning setup UI with direct task management**

Keep `LearningModule` as the route export but remove the visible space/template wizard. On load, call `ensureDefaultLearningWorkspace` once and persist only if it returns a changed workspace.

Render:

- a compact create/edit form for title, note, date, duration, priority, up to three tags, and add/remove subtask rows;
- active unfinished tasks first;
- completed tasks in a collapsed section;
- edit and delete actions only for unfinished tasks;
- visible validation and persistence failure messages.

Every successful mutation calls the existing Workspace repository once.

- [ ] **Step 8: Run one focused GREEN and commit**

Run:

```powershell
node --experimental-strip-types --test apps/web/src/core/contracts.test.mjs apps/web/src/core/workspace-state.test.mjs apps/web/src/modules/learning/mvp-actions.test.mjs apps/web/src/modules/learning/public.test.mjs
npm.cmd run typecheck
```

Expected: all pass.

Commit:

```powershell
git commit -m "feat(learning): create focused local tasks"
```

---

### Task 3: Execute enriched tasks and close the two-prompt review

**Files:**
- Modify: `apps/web/src/modules/learning/public.ts`
- Modify: `apps/web/src/modules/learning/public.test.mjs`
- Modify: `apps/web/src/modules/today/public.ts`
- Modify: `apps/web/src/modules/today/ui/today-actions.ts`
- Modify: `apps/web/src/modules/today/ui/today-actions.test.mjs`
- Modify: `apps/web/src/modules/today/ui/today-view.tsx`
- Modify: `apps/web/src/modules/review/public.ts`
- Modify: `apps/web/src/modules/modules.test.mjs`
- Modify: `apps/web/src/modules/review/index.tsx`

**Interfaces:**
- `LearningTaskSummary` and `TodayItem` add `priority`, `tags`, `subtasks`, and `createdAt`.
- Produces:

```ts
export function toggleWorkspaceSubtaskCompletion(
  workspace: WorkspaceStateV2,
  taskId: EntityId,
  subtaskId: EntityId,
  now: IsoDateTime,
): WorkspaceStateV2;

export function hasIncompleteSubtasks(
  workspace: WorkspaceStateV2,
  taskId: EntityId,
): boolean;
```

- [ ] **Step 1: Write Today RED tests**

Specify:

- Today projection carries priority, tags, subtasks, and createdAt without reading plan internals.
- Planned items order high, medium, low, then createdAt; the active item remains the focus item.
- Starting a Learning task returns every other eligible active Learning task to planned and updates timestamps.
- Starting done, archived-space, or non-Learning tasks is still a no-op.
- Subtask toggle changes only the requested subtask and never completes the parent.
- Completing with unfinished subtasks is blocked by the pure action unless `allowIncompleteSubtasks: true`.
- Confirmed completion and undo preserve the existing deduplicated event contract.

- [ ] **Step 2: Run Today RED**

Run:

```powershell
node --experimental-strip-types --test apps/web/src/modules/learning/public.test.mjs apps/web/src/modules/today/ui/today-actions.test.mjs apps/web/src/modules/modules.test.mjs
```

Expected: metadata, single-active, and subtask assertions fail.

- [ ] **Step 3: Implement Today projection and actions**

Extend the public summaries with copies of tags and subtasks. Sort planned items with `high=0`, `medium=1`, `low=2`, then `createdAt.localeCompare`. Starting a task deactivates other eligible active Learning tasks. Add subtask toggle and incomplete-subtask guard while keeping every function immutable.

Update Today cards to show priority, tags, duration, and expandable subtasks. If completion is blocked, ask once with `window.confirm`; confirmed completion retries with `allowIncompleteSubtasks: true`. Today retains no create/edit form and no timer.

- [ ] **Step 4: Write Review RED tests**

Extend `DailyReviewSummary` with:

```ts
completedItems: Array<{
  id: EntityId;
  title: string;
  subtasks: TaskSubtask[];
}>;
```

Assert completed items only come from eligible Learning tasks on the requested date. Existing accurate counts, completed expected minutes, one-review-per-day, ownership, and idempotent rollover tests remain.

- [ ] **Step 5: Run Review RED**

Run:

```powershell
node --experimental-strip-types --test apps/web/src/modules/modules.test.mjs
```

Expected: completed item detail assertion fails.

- [ ] **Step 6: Implement the two-prompt review**

Populate `completedItems` from done eligible Learning tasks. In the UI retain only:

- `今天完成了什么、学到了什么？` mapped to `wins`;
- `明天需要调整什么？` mapped to `adjustment`.

Preserve any historical `blockers` value when updating an existing review; use an empty string for a new review. Display total/completed/unfinished counts, completed expected minutes, completed task details, and subtask checkmarks. Rename rollover to `将未完成任务顺延到明天`; keep it explicit and enabled only after the day's review exists.

- [ ] **Step 7: Run one focused GREEN and commit**

Run:

```powershell
node --experimental-strip-types --test apps/web/src/modules/learning/public.test.mjs apps/web/src/modules/today/ui/today-actions.test.mjs apps/web/src/modules/modules.test.mjs
npm.cmd run typecheck
```

Expected: all pass.

Commit:

```powershell
git commit -m "feat(mvp): execute and review learning tasks"
```

---

### Task 4: Expose only the MVP and verify the complete story

**Files:**
- Modify: `apps/web/src/lib/module-registry.ts`
- Modify: `apps/web/src/lib/module-registry.test.mjs`
- Modify: `apps/web/src/components/layout/sidebar.tsx`
- Modify: `apps/web/src/components/layout/mobile-nav.tsx`
- Modify: `apps/web/src/components/layout/app-shell.tsx`
- Modify: `apps/web/src/components/layout/topbar.tsx`
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/dashboard/page.tsx`
- Create: `apps/web/e2e/mvp-closure.spec.ts`
- Modify: `apps/web/e2e/v3-stability.spec.ts`
- Modify: `README.md`
- Create: `docs/v2/MVP_ACCEPTANCE.md`

**Interfaces:**
- Produces `mvpModuleRegistry`, containing module keys in order: `today`, `learning`, `review`, `settings`.
- Keeps the full nine-module `moduleRegistry` for dormant route metadata and existing domain contracts.

- [ ] **Step 1: Write navigation RED tests**

Assert:

```js
assert.deepEqual(
  mvpModuleRegistry.map((module) => module.key),
  ["today", "learning", "review", "settings"],
);
assert.equal(moduleRegistry.length, 9);
```

Update browser expectations so desktop sidebar and 390 px bottom navigation expose exactly the four MVP destinations. The drawer trigger and dormant module labels must be absent from the primary shell.

- [ ] **Step 2: Run navigation RED**

Run:

```powershell
node --experimental-strip-types --test apps/web/src/lib/module-registry.test.mjs
```

Expected: `mvpModuleRegistry` is missing.

- [ ] **Step 3: Implement the four-route shell**

Export `mvpModuleRegistry` as a filtered ordered view of the existing registry. Sidebar and MobileNav consume it. MobileNav replaces Knowledge with Settings. Remove the drawer trigger and drawer rendering from the active AppShell; leave dormant drawer and module files on disk. Redirect both `/` and `/dashboard` to `/today`.

- [ ] **Step 4: Write the desktop and mobile acceptance tests**

Create one serial acceptance flow that:

1. clears all GrowPilot keys;
2. opens Learning and sees `我的学习`;
3. creates one high-priority tagged task with two subtasks plus one unfinished task;
4. executes the first task in Today, checks subtasks, completes, undoes, and completes again;
5. verifies only one completion event exists;
6. saves both Review prompts and rolls the unfinished task to tomorrow;
7. reloads and verifies persistence;
8. exports, previews, clears, imports, and recovers task/review counts.

Run the same navigation/viewport assertions at 1280x800 and 390x844. Assert no horizontal overflow and collect browser console/page errors.

Update conflicting legacy navigation assertions in `v3-stability.spec.ts`; do not delete unrelated stability coverage.

- [ ] **Step 5: Run focused E2E GREEN**

Run only:

```powershell
$env:CI=$null
npx.cmd playwright test apps/web/e2e/mvp-closure.spec.ts --project=chromium
```

Expected: desktop and mobile acceptance pass.

- [ ] **Step 6: Run the final gate once**

Ensure no foreign dev server is reused. Run:

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
$env:CI="1"
npm.cmd run test:e2e
```

Expected: every command exits 0. If a failure occurs, debug that failure and rerun only the failed command; rerun the full gate once after all individual failures are resolved.

- [ ] **Step 7: Record acceptance and commit**

Write `docs/v2/MVP_ACCEPTANCE.md` with branch, commit under test, commands/results, desktop/mobile matrix, local-data boundary, known dormant modules, and rollback commit. Update README so the product scope and local backup warning match the MVP.

Restore generated-only files and remove only verified test artifacts. Confirm `git status --short` contains only intended documentation/source changes.

Commit:

```powershell
git commit -m "feat: ship learning daily-loop mvp"
```
