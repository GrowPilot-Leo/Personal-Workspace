# Stage 3 Resume Checkpoint

**Saved:** 2026-08-11  
**Branch:** `codex/v4-stage3-closure`  
**Code HEAD before this checkpoint:** `338b94fd5a68afef15ffd478e09d1e403e56fde9`  
**Worktree:** `W:\coverage\.codex-worktrees\stage3-configurable-learning`

## Current status

- Tasks 0–4 are complete.
- Task 5 is in progress.
- Tasks 6–8 have not started.
- The isolated worktree was clean when work paused.
- Do not use or clean the dirty main checkout; continue only in the isolated worktree and branch above.

## Completed and verified

### Task 3 — Workspace V2 and migration

- Added the five-collection `WorkspaceStateV2`.
- Added normalization, deterministic de-duplication, update helpers and safe V1/intermediate migration.
- Added corruption backup, source precedence, idempotence and one-release legacy compatibility.
- Final Task 3 implementation HEAD: `837b72f8bcfe3b8df6cfef711d54e723ae11b7b3`.
- Final evidence at that point: focused 27/27, full 105/105, typecheck and diff-check passed.
- Independent review ended with no actionable findings.

### Task 4 — Workspace repository boundary

- Added `loadWorkspace()` and `saveWorkspace()`.
- V2 saves normalize data and write only `growpilot.workspace.v2`.
- Legacy daily-loop methods remain rollback adapters.
- Real storage failures propagate; malformed V1 remains a normal failed migration fallback.
- Replaced the old V3 source-string gate with a behavior test.
- Final Task 4 HEAD: `a36047a62c75c63f0015f78f0bcfa66fef98a8f1`.
- Final evidence: V3 gate 18/18, full 116/116, typecheck and diff-check passed.
- Independent review ended with no actionable findings.

### Task 5 Cycle A/B — Configurable Learning creation

- Test commit: `e4480c310ef7433cd0103af41c034cb719e0b83d`.
- Implementation commit: `338b94fd5a68afef15ffd478e09d1e403e56fde9`.
- Replaced the fixed Learning e2e case with `configurable learning space is created and persists on reload`.
- Added `learning-space-dialog.tsx`.
- Replaced the old fixed daily-loop Learning page with Workspace V2 loading, an empty state, configurable-space creation, a responsive list and selected-space detail.
- Creation uses `createLearningSpace`, `createLearningPlanHierarchy` and `WorkspaceRepository`; the page does not access localStorage directly.
- Radix dialog supports blank/three-horizon templates, trimmed required name, editable goal, visible validation and accessible descriptions.
- Focused creation Playwright: 1/1 passed.
- Typecheck and diff-check passed.
- A full repository regression has not yet been run after `338b94f`.

## Current Task 5 scope still missing

1. Add browser RED tests for:
   - monthly and weekly goal edits creating `user-edit` plan versions;
   - draft activation and daily task creation with title, duration and local scheduled date;
   - task ownership and daily-plan task reference;
   - pause disabling scheduling, resume, one-way archive and archived read-only state;
   - export filename/content;
   - exact-name delete confirmation and selected-bundle-only deletion.
2. Implement the tests without touching TSX, prove the intended RED.
3. Implement:
   - plan editors and daily task form in `apps/web/src/modules/learning/index.tsx`;
   - lifecycle actions and archived read-only presentation;
   - `apps/web/src/modules/learning/learning-delete-dialog.tsx`;
   - Blob/download behavior in the UI using `buildLearningSpaceExport`;
   - confirmed deletion using `removeLearningSpaceBundle`.
4. Run focused Playwright, typecheck and diff-check.
5. Run React TSX best-practices review because multiple TSX components will be edited.
6. Run full tests and an independent Task 5 review.

## Intended accessible UI contract for the next RED tests

- Plan sections: `月度方向`, `本周重点`, `每日任务`.
- Fields/buttons: `月度目标` / `保存月度目标`; `本周目标` / `保存本周目标`.
- Activation/lifecycle: `开始学习`, `暂停空间`, `继续学习`, `归档空间`.
- Daily task: `任务标题`, `预计分钟`, `计划日期`, `添加每日任务`.
- Export/delete: `导出空间`, `删除空间`; dialog `删除学习空间`; field `输入空间名称以确认`; buttons `先导出`, `确认删除`.
- Learning must not expose execution or review controls.

## Playwright environment workaround

Normal Playwright webServer startup fails in this Windows workspace because Next 16 Turbopack mixes the Chinese real path with the `W:` mapping.

Use the ASCII worktree and start the exact app with Webpack first:

```powershell
npm.cmd --workspace apps/web run dev -- --hostname 127.0.0.1 --webpack
```

Run Playwright while that server is listening on `http://127.0.0.1:3000`; the existing config will reuse it. Launch background servers hidden and stop only the exact process tree started for verification.

## Local environment notes

- Use the core Git binary when the bundled wrapper fails:
  `C:\Users\lilei\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\mingw64\bin\git.exe`
- Existing-file writes may fail with Windows error 1385. New files can use `apply_patch`; existing files can be updated through the GitHub contents API and then pulled into the isolated worktree.
- Keep the branch scoped to Stage 3. Do not add RAG, provider SDKs, database, authentication or Stage 4 collections.

## Resume instruction

Read this checkpoint and `docs/superpowers/plans/2026-08-10-stage3-configurable-learning.md`, verify the branch/worktree, then resume Task 5 Cycle C with TEST-ONLY browser changes. Do not redo Tasks 0–4 or the Task 5 creation flow.
