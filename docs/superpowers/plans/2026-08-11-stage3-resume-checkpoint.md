# Stage 3 Resume Checkpoint

**Saved:** 2026-08-13
**Branch:** `codex/v4-stage3-closure`
**Code HEAD before this checkpoint:** `9e625a7ca6f8dfaeb4658cc108fa0d9e6af35b49`
**Worktree:** `W:\coverage\.codex-worktrees\stage3-configurable-learning`
**Real path:** `C:\Users\lilei\Documents\个人工作台\coverage\.codex-worktrees\stage3-configurable-learning`

## Current status

- Tasks 0–5 are complete.
- Tasks 6–8 have not started.
- The isolated worktree was clean when this checkpoint was written.
- Do not use or clean the dirty main checkout; continue only in the isolated worktree and branch above.
- Resume with Task 6 Step 1 TEST-ONLY projection tests. Do not redo Tasks 0–5.

## Completed foundation

### Task 3 — Workspace V2 and migration

- Added the five-collection `WorkspaceStateV2`.
- Added normalization, deterministic de-duplication, update helpers and safe V1/intermediate migration.
- Added corruption backup, source precedence, idempotence and one-release legacy compatibility.
- Final Task 3 implementation HEAD: `837b72f8bcfe3b8df6cfef711d54e723ae11b7b3`.
- Evidence at completion: focused 27/27, full 105/105, typecheck and diff-check passed.

### Task 4 — Workspace repository boundary

- Added `loadWorkspace()` and `saveWorkspace()`.
- V2 saves normalize data and write only `growpilot.workspace.v2`.
- Legacy daily-loop methods remain rollback adapters.
- Real storage failures propagate; malformed V1 remains a normal failed migration fallback.
- Replaced the obsolete V3 migration source-string gate with behavior coverage.
- Final Task 4 HEAD: `a36047a62c75c63f0015f78f0bcfa66fef98a8f1`.
- Evidence at completion: V3 gate 18/18, full 116/116, typecheck and diff-check passed.

## Task 5 — Configurable Learning workspace UI

### Delivered

- One `/learning` route with responsive list/detail states.
- Empty-state and three-horizon creation through the existing Radix dialog.
- Trimmed required space name, editable goal and accessible validation.
- Monthly and weekly goal edits append plan versions with reason `user-edit`.
- Draft activation, active/planned pause, resume and one-way archive.
- Daily task creation with title, duration and local scheduled date.
- Tasks retain Learning ownership and are referenced by the selected daily plan.
- Paused spaces disable scheduling.
- Archived spaces hide edit and task-creation controls while preserving plans and tasks.
- JSON export uses `growpilot-learning-<safe-name>-<date>.json`.
- Exact-name delete confirmation removes only the selected Learning bundle.
- Save, export, lifecycle and delete outcomes use the existing polite announcement region.
- Learning does not expose task completion or review controls; Today integration remains Task 6.

### Key commits

- `e4480c3` — creation RED test.
- `338b94f` — configurable creation/list/detail implementation.
- `d0b1770` — Cycle C browser RED tests.
- `a96ab44` / `0122991` / `e6ed06b` — delete dialog and minimum workspace controls.
- `198ad5e` — correct migrated-workspace preservation assertions.
- `6162846` / `b3f3021` — planned-space pause RED and fix.
- `9e625a7` — align the V3 ownership gate with the Task 5/Task 6 boundary.

### Verification evidence

- Initial Cycle C RED: existing creation 1 passed; lifecycle and export/delete failed on missing controls.
- Cycle C GREEN: configurable-learning Playwright 3/3 passed.
- Review finding RED/GREEN: planned-space lifecycle test failed on missing pause and then passed 1/1 after the two-line condition fix.
- Final full unit regression: 116/116 passed.
- Final TypeScript typecheck: passed.
- Final Task 5 file diff-check: passed.
- React review: no required hooks, dependency, module-boundary or accessibility changes.
- Ponytail review: no speculative dependency or abstraction to remove; the selected-space child component is needed for keyed form state, and the separate delete dialog is required by the plan.
- Local correctness review found and fixed the planned-to-paused gap.
- Three independent read-only reviewer attempts produced no output because the current subagent review channel did not complete. Do not report those attempts as review approval; no code or branch state was changed by them.

## Task 6 next scope

Start with `docs/superpowers/plans/2026-08-10-stage3-configurable-learning.md`, Task 6 Step 1.

1. Add TEST-ONLY projection coverage for `buildTodayViewState(workspace, dateKey)`.
2. Prove the intended RED before changing Today production code.
3. Project source-tagged Learning tasks into Today without reading Learning plan internals.
4. Preserve start-next, completion, workload, focus-scroll, announcement and reduced-motion behavior.
5. Add the cross-page source-tagged task E2E only after the pure projection is GREEN.
6. Do not add Task 7 review/rollover behavior during Task 6.

## Windows environment notes

- Existing-file writes may fail with Windows error 1385. Use `apply_patch` first; if it fails, use the GitHub contents API on the current branch and fast-forward the isolated worktree.
- Normal `npx` is blocked by the PowerShell execution policy; use `npx.cmd`.
- Normal Playwright webServer startup may fail because Next 16 Turbopack mixes the Chinese real path with the `W:` mapping.
- For focused browser tests, start the exact app hidden with Webpack:

```powershell
npm.cmd --workspace apps/web run dev -- --hostname 127.0.0.1 --webpack
```

- Run Playwright while that server is listening on `http://127.0.0.1:3000`; the existing config reuses it.
- Stop only the exact process tree started for verification.
- Restore generated `apps/web/next-env.d.ts` changes and remove generated `test-results` after verification.
- The optional `agent-browser` CLI is not installed; use the repository's Playwright setup instead of adding a dependency.

## Scope guard

Keep the branch scoped to Stage 3. Do not add RAG, provider SDKs, database, authentication or Stage 4 collections.
