# Stage 3 Configurable Learning Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan.

**Goal:** Close GrowPilot Stage 3 by replacing the single hard-coded learning loop with configurable learning spaces that safely migrate existing V1 data and complete a real Learning → Today → Review loop.

**Architecture:** Reuse the existing core contracts, generic plan-version model, module public APIs, synchronous event contract, and browser repository boundary. Add only the Stage 3 fields needed by the local V2 workspace root. Learning owns spaces and plans; Today projects and updates scheduled tasks; Review aggregates actual task records and performs rollover; Settings owns whole-workspace backup and restore.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 6, localStorage adapter, Node test runner with type stripping, Playwright, axe-core, Tailwind CSS 4, Radix Dialog, GitHub Actions, Vercel preview.

**Approved design:** [docs/superpowers/specs/2026-08-10-v4-project-framework-design.md](../specs/2026-08-10-v4-project-framework-design.md)

## Global Constraints

- Do not start Stage 3 implementation on `codex/v3-calm-timeline`.
- PR #6 must pass the integration gate and be explicitly approved for merge first.
- Create `codex/v4-stage3-closure` from the updated `main`; use one Draft PR for Stage 3.
- Reuse `core/plans.ts`; do not create a second `Plan` or `PlanVersion` model.
- Preserve existing V1 raw data and the existing intermediate V2 snapshot. Migration must be repeatable without duplicate entities.
- Pages and components must use `WorkspaceRepository`; no direct `localStorage` access.
- Today owns execution only. Learning owns space and plan edits. Review owns reflection and rollover.
- Stage 4 resource, citation, proposal, badge, and evidence collections are not implemented in this PR. They will extend the same versioned root in the Stage 4 migration.
- No provider SDK, RAG, database, authentication, cloud sync, or new infrastructure in Stage 3.
- Use real user-entered data only. Do not seed curriculum claims, progress scores, or completion evidence.
- Archived spaces are read-only. Paused or archived spaces cannot generate or roll new tasks forward.
- Deletion requires an accessible confirmation flow and a visible export option.
- Keep reduced-motion behavior, 390 px layout, keyboard access, and current visual restraint.
- Every non-trivial behavior starts with a failing test.
- Every task ends with focused verification and a buildable commit.

## Concept-to-Code Mapping

The approved design uses conceptual names. The implementation keeps existing tested names:

| Design contract | Existing implementation contract |
|---|---|
| `ownerModule` | `ownerModuleId` |
| separate logical `PlanVersion[]` | `Plan<T>.versions` nested in the local prototype |
| `cadence` | `Plan.horizon` |
| `activeVersionId` | numeric `Plan.activeVersion` |
| learning plan goal and task IDs | `LearningPlanData` inside `Plan<LearningPlanData>` |

This is a storage-shape reuse decision, not a change to module ownership or version semantics. A later database adapter may normalize plans and versions into separate tables.

---

## Task 0: Pass the Integration Gate and Create the Stage 3 Branch

**Files:** none

### Step 1: Verify the current PR branch locally

Run from the repository root:

~~~powershell
git switch codex/v3-calm-timeline
git pull --ff-only
npm install
npm audit --audit-level=high
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
~~~

Expected:

- dependency audit has no high-severity finding
- all core tests pass
- all 11 current browser tests pass
- typecheck and production build exit 0

### Step 2: Verify hosted acceptance

Open the PR #6 Vercel preview and smoke-test:

- `/today`
- `/learning`
- `/review`
- `/settings`
- desktop at 1280 px
- mobile at 390 px
- Day, Night, and Dusk themes
- reduced motion
- Learning task handoff to Today
- task completion and review save

Record the deployment URL and CI run in the PR description.

### Step 3: Stop for explicit merge approval

Do not merge based only on green automation. Present the verification evidence and obtain explicit user approval for PR #6.

### Step 4: Merge and branch from updated main

After approval:

~~~powershell
git switch main
git pull --ff-only
git switch -c codex/v4-stage3-closure
git push -u origin codex/v4-stage3-closure
~~~

Expected: the Stage 3 branch head equals the merged `main` head before the first Stage 3 code commit.

---

## Task 1: Extend Existing Core Contracts with Ownership and Scheduling

**Files:**

- Modify: `apps/web/src/core/tasks.ts`
- Modify: `apps/web/src/core/plans.ts`
- Modify: `apps/web/src/core/reviews.ts`
- Modify: `apps/web/src/core/events.ts`
- Modify: `apps/web/src/core/migrations.ts`
- Modify: `apps/web/src/core/migrations.test.mjs`
- Modify: `apps/web/src/core/contracts.test.mjs`
- Modify: `apps/web/src/modules/modules.test.mjs`

### Step 1: Write failing contract tests

Add tests proving:

1. `createTask` records `ownerModuleId`, `ownerEntityId`, and `scheduledDate`.
2. `completeTask` preserves ownership and sets `status: "done"`.
3. `createPlan` records `ownerEntityId`.
4. `revisePlan` appends one immutable version and advances `activeVersion`.
5. `createReview` supports `ownerEntityId: null` for workspace review.
6. the event type union accepts `learning.space.created`, `learning.space.updated`, `learning.space.paused`, and `learning.task.scheduled`.

Use fixed IDs and timestamps in every assertion.

Run:

~~~powershell
node --experimental-strip-types --test apps/web/src/core/contracts.test.mjs
~~~

Expected: FAIL because the new fields and `revisePlan` do not exist.

### Step 2: Implement the minimum contract changes

In `tasks.ts`, extend the existing contract rather than replacing it:

~~~ts
export type TaskOwnerModule = "learning" | "career" | "english" | "fitness";

export type Task = {
  id: EntityId;
  ownerModuleId: TaskOwnerModule;
  ownerEntityId: EntityId;
  title: string;
  description: string;
  durationMinutes: number;
  scheduledDate: DateKey;
  status: TaskStatus;
  dueAt: IsoDateTime | null;
  completedAt: IsoDateTime | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};
~~~

Make `ownerModuleId`, `ownerEntityId`, and `scheduledDate` required in `TaskInput`. Do not infer ownership in `createTask`.

In `plans.ts`:

- add `ownerEntityId: EntityId` to `Plan<T>`
- require it in `createPlan`
- add `revisePlan<T>(plan, data, reason, now)`
- append a new `PlanVersion<T>` without mutating prior versions

In `reviews.ts`, add `ownerEntityId: EntityId | null` and require the caller to supply it.

Extend only the Stage 3 domain-event literals. Do not add a new event bus.

### Step 3: Update all existing constructors and fixtures

Update every existing `Task`, `Plan`, and `Review` construction in `contracts.test.mjs`, `modules.test.mjs`, `migrations.ts`, and `migrations.test.mjs` with explicit ownership and date fields. The compatibility migration must use `learning-space-v1-daily-loop` as owner and the V1 active date as `scheduledDate`. Do not add permissive defaults just to keep old tests green.

### Step 4: Verify

~~~powershell
node --experimental-strip-types --test apps/web/src/core/contracts.test.mjs
npm run typecheck
~~~

Expected: PASS.

### Step 5: Commit

~~~powershell
git add apps/web/src/core/tasks.ts apps/web/src/core/plans.ts apps/web/src/core/reviews.ts apps/web/src/core/events.ts apps/web/src/core/migrations.ts apps/web/src/core/migrations.test.mjs apps/web/src/core/contracts.test.mjs apps/web/src/modules/modules.test.mjs
git commit -m "feat(core): add owned scheduled task contracts"
~~~

---

## Task 2: Implement the Configurable Learning Domain

**Files:**

- Create: `apps/web/src/core/learning.ts`
- Modify: `apps/web/src/modules/learning/public.ts`
- Create: `apps/web/src/modules/learning/public.test.mjs`
- Modify: `package.json`

### Step 1: Register the focused test file

Add `apps/web/src/modules/learning/public.test.mjs` to the root `test` script. Keep the existing test files and order intact.

### Step 2: Write failing learning-domain tests

Cover these rules:

- blank creation accepts any trimmed user subject name without a route or source change
- the structural template creates monthly, weekly, and daily plan containers but no invented curriculum
- name is limited to 80 characters; goal is limited to 500 characters
- an active space may schedule a daily task
- a paused space cannot schedule a new task
- an archived space cannot be edited or scheduled
- archive preserves plans and tasks
- removing one confirmed learning bundle preserves every unrelated space, plan, task, review, and event
- direct plan edits append versions through `revisePlan`
- task summaries expose source space identity to Today

Run:

~~~powershell
node --experimental-strip-types --test apps/web/src/modules/learning/public.test.mjs
~~~

Expected: FAIL.

### Step 3: Add shared record types and the Stage 3 public API

Define the persistence-neutral `LearningSpace` and `LearningPlanData` records in `core/learning.ts`. This keeps the dependency direction `module → core`; `core/workspace-state.ts` must not import a business module. Re-export those types from `modules/learning/public.ts` for consumers.

Keep `summarizeTasksForToday`, but make it filter by matching owner and expose the source:

~~~ts
export type LearningSpace = {
  id: EntityId;
  name: string;
  goal: string;
  status: LearningSpaceStatus;
  templateId: "blank" | "three-horizon";
  currentMonthlyPlanId: EntityId | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type LearningPlanData = {
  learningSpaceId: EntityId;
  periodKey: string;
  title: string;
  goal: string;
  parentPlanId: EntityId | null;
  taskIds: EntityId[];
  capacityMinutes: number | null;
};

export type LearningSpaceBundle = {
  space: LearningSpace;
  plans: Plan<LearningPlanData>[];
  tasks: Task[];
  reviews: Review[];
};
~~~

Implement pure functions:

- `createLearningSpace(input)`
- `updateLearningSpace(space, patch, now)`
- `setLearningSpaceStatus(space, status, now)`
- `createLearningPlanHierarchy(space, templateId, dateKey, now)`
- `reviseLearningPlan(plan, patch, reason, now)`
- `scheduleLearningTask(space, dailyPlan, input)`
- `summarizeTasksForToday(space, tasks)`
- `buildLearningSpaceExport(workspace, spaceId, exportedAt)`
- `removeLearningSpaceBundle(workspace, spaceId, now)`

Use `createId`, `createTask`, `createPlan`, and `revisePlan`. Do not call storage or browser APIs from this file.

The `three-horizon` template creates empty structural containers:

- monthly title: “月度方向”
- weekly title: “本周重点”
- daily title: “今日任务”

Goals and tasks remain empty until the user enters them.

### Step 4: Verify

~~~powershell
node --experimental-strip-types --test apps/web/src/modules/learning/public.test.mjs
npm test
npm run typecheck
~~~

Expected: PASS.

### Step 5: Commit

~~~powershell
git add package.json apps/web/src/core/learning.ts apps/web/src/modules/learning/public.ts apps/web/src/modules/learning/public.test.mjs
git commit -m "feat(learning): add configurable learning domain"
~~~

---

## Task 3: Add the Stage 3 Workspace V2 Root and Safe Migration

**Files:**

- Create: `apps/web/src/core/workspace-state.ts`
- Create: `apps/web/src/core/workspace-state.test.mjs`
- Modify: `apps/web/src/core/migrations.ts`
- Modify: `apps/web/src/core/migrations.test.mjs`
- Modify: `package.json`

### Step 1: Register and write failing workspace-state tests

Add the new test file to the root `test` script.

Test:

- empty V2 state has version 2 and empty Stage 3 collections
- normalization isolates malformed arrays instead of blanking valid arrays
- duplicate entity IDs are de-duplicated deterministically, first valid record wins
- unknown root fields are ignored, not executed or trusted
- updates always refresh `updatedAt`

Run:

~~~powershell
node --experimental-strip-types --test apps/web/src/core/workspace-state.test.mjs
~~~

Expected: FAIL.

### Step 2: Implement the Stage 3 root

~~~ts
export type WorkspaceStateV2 = {
  version: 2;
  learningSpaces: LearningSpace[];
  plans: Plan<LearningPlanData>[];
  tasks: Task[];
  reviews: Review[];
  events: DomainEvent[];
  updatedAt: IsoDateTime;
};
~~~

Implement:

- `createEmptyWorkspaceStateV2(now)`
- `normalizeWorkspaceStateV2(value, now)`
- `upsertLearningSpace(state, space, now)`
- `replaceLearningPlan(state, plan, now)`
- `upsertTask(state, task, now)`
- `appendReview(state, review, now)`
- `appendDomainEvent(state, event, now)`

Import `LearningSpace` and `LearningPlanData` from `core/learning.ts`. The core workspace state must not import `modules/learning/*`. Learning-specific export and deletion remain pure functions in the Learning public API; they must not delete unrelated spaces, tasks, reviews, or events.

Stage 4 collections are intentionally absent from this implementation file. Stage 4 adds them through its own tested schema evolution; this PR does not define unused placeholder models.

### Step 3: Write failing migration tests

Extend `migrations.test.mjs` with fixed V1 input and verify:

- raw V1 backup remains byte-for-byte identical
- V1 maps to one learning space with stable ID
- migrated tasks use `ownerModuleId: "learning"`, the migrated space ID, and V1 `activeDate`
- V1 review maps to workspace review without copying a plan
- an existing intermediate `growpilot.daily-loop.v2.migrated` snapshot is lifted into the workspace root
- running migration twice returns the same IDs and collection lengths
- a malformed workspace root is backed up before recovery
- malformed V1 data does not overwrite an existing valid workspace root

Run:

~~~powershell
node --experimental-strip-types --test apps/web/src/core/migrations.test.mjs
~~~

Expected: FAIL.

### Step 4: Implement the migration bridge

Keep the current exports during this release and add:

~~~ts
export const WORKSPACE_V2_KEY = "growpilot.workspace.v2";
export const WORKSPACE_V2_CORRUPT_BACKUP_KEY = "growpilot.workspace.v2.corrupt.backup";

export function migrateDailyLoopV1ToWorkspaceV2(
  storage: StorageLike,
  now?: IsoDateTime,
): MigrationResult<WorkspaceStateV2>;
~~~

Migration source precedence:

1. valid `growpilot.workspace.v2`
2. valid intermediate `growpilot.daily-loop.v2.migrated`
3. valid `growpilot.daily-loop.v1`
4. empty V2 workspace

Use stable migration IDs such as:

- learning space: `learning-space-v1-daily-loop`
- monthly plan: `learning-plan-v1-monthly`
- weekly plan: `learning-plan-v1-weekly-<activeDate>`
- daily plan: `learning-plan-v1-daily-<activeDate>`

Existing V1 task IDs remain unchanged. If a V1 record lacks an ID, derive one from its array index and active date as the current migration does.

Retain `migrateDailyLoopV1ToV2` only as a compatibility wrapper for existing tests and one-release rollback. Do not write two independent mutable sources.

### Step 5: Verify

~~~powershell
node --experimental-strip-types --test apps/web/src/core/workspace-state.test.mjs apps/web/src/core/migrations.test.mjs
npm test
npm run typecheck
~~~

Expected: PASS.

### Step 6: Commit

~~~powershell
git add package.json apps/web/src/core/workspace-state.ts apps/web/src/core/workspace-state.test.mjs apps/web/src/core/migrations.ts apps/web/src/core/migrations.test.mjs
git commit -m "feat(data): migrate daily loop into workspace v2"
~~~

---

## Task 4: Upgrade the Repository Boundary

**Files:**

- Modify: `apps/web/src/core/persistence.ts`
- Modify: `apps/web/src/core/persistence.test.mjs`

### Step 1: Write failing repository tests

Test:

- `loadWorkspace()` runs migration and returns normalized V2
- `saveWorkspace()` persists only normalized V2 data
- corrupt V2 JSON is preserved under the corrupt-backup key before fallback
- one invalid collection does not erase valid unrelated collections
- repeated loads do not duplicate records
- the repository has no learning-specific export or delete method
- legacy `loadDailyLoop/saveDailyLoop` remain available as a rollback adapter but are not the V2 source of truth

Run:

~~~powershell
node --experimental-strip-types --test apps/web/src/core/persistence.test.mjs
~~~

Expected: FAIL.

### Step 2: Extend `WorkspaceRepository`

~~~ts
export type WorkspaceRepository = {
  loadWorkspace(): WorkspaceStateV2;
  saveWorkspace(state: WorkspaceStateV2): void;
  lastMigration(): MigrationRecord | null;
  loadDailyLoop(): DailyLoopState;
  saveDailyLoop(state: DailyLoopState): void;
};
~~~

Rules:

- V2 methods are the only methods used by the updated UI.
- legacy methods remain isolated for rollback and old import compatibility.
- `saveWorkspace` normalizes before writing.
- repository methods never silently clear the V1 backup.
- the repository does not own learning lifecycle behavior. The Learning public API builds exports and removes confirmed bundles; the UI owns Blob/download behavior.

### Step 3: Verify

~~~powershell
node --experimental-strip-types --test apps/web/src/core/persistence.test.mjs
npm test
npm run typecheck
~~~

Expected: PASS.

### Step 4: Commit

~~~powershell
git add apps/web/src/core/persistence.ts apps/web/src/core/persistence.test.mjs
git commit -m "feat(data): expose workspace v2 repository"
~~~

---

## Task 5: Replace the Learning Page with Configurable Spaces

**Files:**

- Modify: `apps/web/src/modules/learning/index.tsx`
- Create: `apps/web/src/modules/learning/learning-space-dialog.tsx`
- Create: `apps/web/src/modules/learning/learning-delete-dialog.tsx`

### Step 1: Add a failing browser test for creation

In `apps/web/e2e/v3-stability.spec.ts`, replace the old fixed Learning test with a test that:

1. opens `/learning`
2. chooses “新建学习空间”
3. selects “三层计划模板”
4. enters `AI 产品评测`
5. enters a user-defined goal
6. saves
7. confirms the new card appears without navigation to a new route
8. reloads and confirms persistence

Run:

~~~powershell
npx playwright test apps/web/e2e/v3-stability.spec.ts --grep "configurable learning space"
~~~

Expected: FAIL.

### Step 2: Implement the list-and-detail page

Keep one `/learning` route.

Page states:

- no spaces: restrained empty state with one primary “新建学习空间” action
- spaces exist: responsive space list and selected detail
- draft/planned/active: editable
- paused: visible pause state; scheduling controls disabled
- archived: read-only fields and history; edit/task controls absent

The creation dialog must:

- use Radix Dialog already installed
- offer “空白空间” and “三层计划模板”
- require a trimmed name
- allow goal editing before save
- return focus to the trigger on close
- expose validation through text and `aria-describedby`

Do not create a route per subject.

### Step 3: Add monthly, weekly, and daily editing

For the selected space:

- monthly section edits the active monthly plan goal
- weekly section edits the active weekly plan goal
- daily section adds a task with title, duration, and scheduled date
- each saved plan edit creates a new version with reason `user-edit`
- daily tasks are owned by the selected learning space
- default scheduled date uses the local current date, never a hard-coded date
- task completion is displayed from the shared workspace task record

Keep Learning free of execution and review controls.

### Step 4: Add lifecycle actions

- Active/Planned → Pause
- Paused → Resume
- any non-archived state → Archive
- Archive is one-way in Stage 3 and preserves records
- Export downloads `growpilot-learning-<safe-name>-<date>.json`
- Delete opens `learning-delete-dialog.tsx`
- delete dialog includes “先导出” and a text field requiring the exact space name
- confirm button stays disabled until the name matches
- delete acts only on the selected bundle

Use `aria-live="polite"` for save, export, pause, archive, and delete outcomes.

### Step 5: Verify focused behavior

~~~powershell
npx playwright test apps/web/e2e/v3-stability.spec.ts --grep "configurable learning space"
npm run typecheck
~~~

Expected: PASS.

### Step 6: Commit

~~~powershell
git add apps/web/src/modules/learning/index.tsx apps/web/src/modules/learning/learning-space-dialog.tsx apps/web/src/modules/learning/learning-delete-dialog.tsx apps/web/e2e/v3-stability.spec.ts
git commit -m "feat(learning): add configurable learning workspace UI"
~~~

---

## Task 6: Connect Source-Tagged Tasks to Today

**Files:**

- Modify: `apps/web/src/modules/today/ui/today-actions.ts`
- Modify: `apps/web/src/modules/today/ui/today-actions.test.mjs`
- Modify: `apps/web/src/modules/today/ui/today-view.tsx`
- Modify: `apps/web/src/modules/today/public.ts`
- Modify: `apps/web/src/modules/modules.test.mjs`
- Modify: `apps/web/e2e/v3-stability.spec.ts`

### Step 1: Write failing projection tests

Test that `buildTodayViewState(workspace, dateKey)`:

- selects only tasks scheduled for the requested date
- includes source space ID and display name
- sorts timed tasks before untimed tasks via `aggregateTodayItems`
- derives planned, completed, and minutes from real tasks
- does not copy or mutate plan data
- marks a task active and complete by task ID
- appends `learning.task.completed` once when completion first occurs
- undoing completion does not append a false completion event

Run:

~~~powershell
node --experimental-strip-types --test apps/web/src/modules/today/ui/today-actions.test.mjs apps/web/src/modules/modules.test.mjs
~~~

Expected: FAIL.

### Step 2: Implement the V2 Today projection

Replace the `DailyLoopState` projection with a `WorkspaceStateV2` projection.

Extend `TodayItem` minimally:

~~~ts
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
~~~

Use `summarizeTasksForToday` for each non-archived learning space, then `aggregateTodayItems`. Today must not inspect learning plan internals.

Add pure actions:

- `startWorkspaceTask(workspace, taskId, now)`
- `toggleWorkspaceTaskCompletion(workspace, taskId, now)`

### Step 3: Update the Today UI

- load and save through `loadWorkspace/saveWorkspace`
- show source label beside every timeline item
- preserve the current start-next, completion, workload, focus-scroll, announcement, and reduced-motion behavior
- compute capacity from the selected daily plan when available; otherwise show planned minutes without a fabricated capacity percentage
- if no task is scheduled, show a link to Learning rather than an empty fake timeline

### Step 4: Write and pass the cross-page E2E test

Test:

1. create `AI 产品评测`
2. add `建立评测样本表` for today
3. open Today
4. assert task and source label are visible
5. start and complete the task
6. return to Learning
7. assert the same task is complete

Run:

~~~powershell
npx playwright test apps/web/e2e/v3-stability.spec.ts --grep "source-tagged learning task"
~~~

Expected: PASS.

### Step 5: Verify

~~~powershell
npm test
npm run typecheck
npm run build
~~~

Expected: PASS.

### Step 6: Commit

~~~powershell
git add apps/web/src/modules/today/ui/today-actions.ts apps/web/src/modules/today/ui/today-actions.test.mjs apps/web/src/modules/today/ui/today-view.tsx apps/web/src/modules/today/public.ts apps/web/src/modules/modules.test.mjs apps/web/e2e/v3-stability.spec.ts
git commit -m "feat(today): execute source-tagged learning tasks"
~~~

---

## Task 7: Move Review and Settings onto the V2 Root

**Files:**

- Modify: `apps/web/src/modules/review/public.ts`
- Modify: `apps/web/src/modules/review/index.tsx`
- Modify: `apps/web/src/modules/modules.test.mjs`
- Modify: `apps/web/src/modules/settings/index.tsx`
- Modify: `apps/web/src/core/persistence.test.mjs`
- Modify: `apps/web/e2e/v3-stability.spec.ts`

### Step 1: Write failing review and rollover tests

Add pure tests for:

- daily review aggregates actual scheduled and completed tasks
- review stores references through scope fields and does not copy plan contents
- incomplete tasks from active/planned spaces roll to the next date
- tasks from paused or archived spaces do not roll
- completed tasks remain on their original date
- a second rollover call does not duplicate tasks or reviews
- review history is derived from `WorkspaceStateV2.reviews`

Run:

~~~powershell
node --experimental-strip-types --test apps/web/src/modules/modules.test.mjs
~~~

Expected: FAIL.

### Step 2: Implement Review V2 helpers

In `modules/review/public.ts`, add:

- `buildDailyReviewSummary(workspace, dateKey)`
- `saveWorkspaceReview(workspace, input, now)`
- `rollWorkspaceForward(workspace, fromDate, toDate, now)`

Keep the functions pure. The UI persists returned state through the repository.

### Step 3: Update Review UI

Preserve the current wording and page responsibility, but:

- load/save V2 workspace
- derive counts from V2 tasks
- write a workspace-scoped daily review
- roll only eligible unfinished tasks
- show recent V2 reviews
- never create or edit a learning plan from Review

### Step 4: Write failing Settings tests

Extend repository/import tests to prove:

- V2 export contains the complete workspace root
- V2 import normalizes before overwrite
- an exported V1 payload is still accepted and migrated
- clear writes an empty V2 workspace but leaves appearance settings and V1 backup untouched

### Step 5: Update Settings UI

Keep existing button names for continuity:

- “导出数据”
- “导入数据”
- “清空成长数据”

Change payload to:

~~~ts
{
  schema: "growpilot.workspace.export",
  version: 2,
  exportedAt,
  appearance: { theme, motion },
  workspace
}
~~~

Update summary cards to show:

- learning spaces
- scheduled tasks
- reviews

Import confirmation must state that workspace data will be replaced. Invalid imports show a visible failure and leave current data unchanged.

### Step 6: Add E2E coverage

Add tests that:

- save a review after completing a source-tagged task
- roll an unfinished active-space task to tomorrow
- pause a space and verify its task does not roll
- export V2 workspace using Playwright download assertions
- import malformed JSON and verify current data remains
- clear data only after confirmation

Run:

~~~powershell
npx playwright test apps/web/e2e/v3-stability.spec.ts --grep "review|workspace data"
~~~

Expected: PASS.

### Step 7: Verify

~~~powershell
npm test
npm run typecheck
npm run build
~~~

Expected: PASS.

### Step 8: Commit

~~~powershell
git add apps/web/src/modules/review/public.ts apps/web/src/modules/review/index.tsx apps/web/src/modules/modules.test.mjs apps/web/src/modules/settings/index.tsx apps/web/src/core/persistence.test.mjs apps/web/e2e/v3-stability.spec.ts
git commit -m "feat(review): close workspace review and rollover loop"
~~~

---

## Task 8: Complete Stage 3 Regression, Accessibility, and Release Evidence

**Files:**

- Modify: `apps/web/e2e/v3-stability.spec.ts`
- Modify: `README.md`
- Modify: `docs/v2/DELIVERY_PLAN.md`
- Create: `docs/v2/STAGE3_ACCEPTANCE.md`

### Step 1: Add remaining lifecycle E2E tests

Cover:

- arbitrary space name survives reload
- pause disables task creation
- resume restores task creation
- archive makes the detail read-only and preserves completed task history
- space export contains only owned records
- delete requires exact-name confirmation
- deleting one space does not affect another
- migration from the V1 fixture is idempotent across two reloads
- 390 px Learning, Today, Review, and Settings pages do not overflow
- no critical or serious axe violations on affected pages
- reduced-motion setting does not block any primary action

Do not replace behavior assertions with screenshots. Screenshots are supplementary review evidence only.

### Step 2: Run the full local gate

~~~powershell
npm install
npm audit --audit-level=high
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
~~~

Expected: all commands exit 0.

### Step 3: Perform browser visual verification

Start the production server or use the Vercel preview. Check at 1280 × 800 and 390 × 844:

- empty Learning state
- space list with two spaces
- selected active space
- paused state
- archived read-only state
- create dialog
- delete dialog
- Today source label
- completed task reflected back in Learning
- Review rollover outcome
- all three themes
- keyboard focus visibility
- reduced motion

Record screenshots only for the PR review; do not commit personal workspace data.

### Step 4: Write acceptance evidence

`docs/v2/STAGE3_ACCEPTANCE.md` must contain:

- branch and Draft PR URL
- tested commit SHA
- local command results
- GitHub Actions URL
- Vercel deployment URL
- desktop/mobile browser matrix
- migration fixtures and outcomes
- axe result
- audit result
- rollback procedure
- known limitations confined to later stages

Rollback procedure:

1. disable or revert the Stage 3 PR
2. restore UI to the legacy repository adapter
3. retain `growpilot.daily-loop.v1.backup`
4. do not delete `growpilot.workspace.v2`
5. allow re-running the idempotent migration after the fix

### Step 5: Update project docs

- mark Stage 3 deliverables complete only when evidence exists
- leave Stage 4 and later stages unchanged
- update README data model and backup description
- do not claim production RAG, cloud sync, or finished Career/English/Fitness

### Step 6: Request code review

Use `superpowers:requesting-code-review`. Resolve correctness, data-loss, accessibility, and module-boundary findings before final verification.

### Step 7: Re-run verification after review changes

~~~powershell
npm audit --audit-level=high
npm test
npm run typecheck
npm run build
npm run test:e2e
git status --short
~~~

Expected:

- all checks pass
- worktree contains only intended Stage 3 changes
- no secrets or personal exported JSON files are tracked

### Step 8: Commit documentation

~~~powershell
git add README.md docs/v2/DELIVERY_PLAN.md docs/v2/STAGE3_ACCEPTANCE.md apps/web/e2e/v3-stability.spec.ts
git commit -m "docs(stage3): record configurable learning acceptance"
~~~

### Step 9: Push and open the Draft PR

~~~powershell
git push
~~~

Open a Draft PR from `codex/v4-stage3-closure` to `main` with:

- module and contract changes
- migration behavior
- verification evidence
- Vercel preview
- rollback procedure
- explicit Stage 4 exclusions

Do not mark ready for review until CI and Vercel are green.

---

## Stage 3 Acceptance Matrix

| Requirement | Primary evidence |
|---|---|
| arbitrary learning subject without code or route | Learning domain unit test + creation/reload E2E |
| blank and editable structural template | Learning domain test + dialog E2E |
| monthly, weekly, daily hierarchy | plan-version tests + Learning E2E |
| pause stops new task generation | domain unit test + UI E2E |
| archive is read-only and preserves history | workspace-state test + UI E2E |
| export and confirmed deletion | repository test + download/dialog E2E |
| source-tagged handoff to Today | Today projection test + cross-page E2E |
| completion returns to Learning | shared-state cross-page E2E |
| Review aggregates without plan copying | Review unit test |
| rollover respects lifecycle state | Review unit test + E2E |
| V1 migration is repeatable | migration unit test + two-reload E2E |
| unrelated valid data survives malformed records | normalization and repository tests |
| desktop/mobile usability | Playwright 1280 px and 390 px checks |
| accessibility | axe critical/serious = 0 on affected pages |
| security and dependency gate | audit, secret scan by review, server-free local design |
| rollback is recoverable | preserved V1 backup + documented PR revert path |

## Definition of Done

Stage 3 is complete only when:

- every matrix row has recorded evidence
- all local gates pass on the final commit
- GitHub Actions is green
- Vercel preview is Ready
- the user has reviewed the preview
- the Stage 3 Draft PR contains no Stage 4+ implementation
- the acceptance document contains no placeholder values
- no required change remains open from code review
