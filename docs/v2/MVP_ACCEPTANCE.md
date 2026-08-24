# GrowPilot 0.1 MVP Acceptance

Date: 2026-08-24
Branch: codex/v4-stage3-recovery
Application tree under test: de7794ef639dc4416e75b2ea66c74a7a8e94b09a
Verified parent commit: e5e67a6
Rollback commit for Task 4: e5e67a6

## Accepted product boundary

The visible MVP contains exactly four routes in this order:

1. Today
2. Learning
3. Review
4. Settings

The root route and /dashboard redirect to /today. Career, English, Fitness, Knowledge, Badges, RAG, DeepSeek, agent harnesses, login, cloud sync, and Android packaging remain dormant and are not part of the 0.1 navigation or acceptance path.

## Business-loop evidence

The serial browser acceptance verified this exact workflow:

1. Start from an empty browser workspace.
2. Open Learning and automatically obtain the local “我的学习” space.
3. Create a high-priority task with tags and two subtasks, plus one unfinished task.
4. Open Today, start the first task, complete both subtasks, complete the parent, undo completion, and complete it again.
5. Confirm that only one learning.task.completed event exists.
6. Open Review, save both MVP prompts, and explicitly roll the unfinished task to tomorrow.
7. Reload and confirm tasks, review, and rollover date persisted.
8. Export Workspace V2, clear growth data, preview the backup counts, confirm import, and recover one space, two tasks, and one review.

## Verification results

| Gate | Command | Result |
|---|---|---|
| Unit and static suite | npm test | PASS — 164/164 |
| TypeScript | npm run typecheck | PASS |
| Production build | npm run build | PASS |
| Focused MVP browser flow | npx playwright test apps/web/e2e/mvp-closure.spec.ts --project=chromium | PASS — 1/1 |
| Full browser suite | CI=1, PLAYWRIGHT_PORT=3100, PLAYWRIGHT_USE_BUILD=1, npm run test:e2e | PASS — 7 passed, 9 skipped, 0 failed |

The nine skipped browser cases are explicitly retained historical or superseded V3 workflows. They cover the dormant configurable three-horizon learning UI, the dormant Dashboard quick prompt, and two smaller MVP flows replaced by the serial MVP closure acceptance.

## Viewport matrix

| Viewport | Navigation | Overflow | Result |
|---|---|---|---|
| 1280 × 800 | Desktop sidebar exposes Today, Learning, Review, Settings only | No acceptance error | PASS |
| 390 × 844 | Bottom navigation exposes the same four destinations; no drawer trigger | No horizontal overflow | PASS |

Browser acceptance collected console errors and page errors across the full closure flow; the final error list was empty. Core Today, Review, and Settings pages also passed the existing critical/serious accessibility scan.

## Local-data boundary

GrowPilot 0.1 stores Workspace V2 only in the current browser. It has no account, cloud database, cloud synchronization, or active model-provider connection. Clearing browser/site data can permanently remove growth data.

The Settings backup is therefore part of the MVP boundary:

- export includes the complete normalized Workspace V2 envelope;
- import validates the envelope and previews learning-space, task, and review counts before overwrite;
- clear removes growth collections but preserves appearance and migration/backup keys;
- successful import restores the workspace and valid appearance values.

## Known environment warning

Next.js reports multiple lockfiles on this machine and infers a workspace root. The production build and all verification gates pass. A foreign Next.js development process from another worktree occupied port 3000 during acceptance; it was not stopped or reused. Full E2E ran the current production build on isolated port 3100.

## Integration status

This record accepts the application tree above. It does not authorize merging to main or pushing a remote branch. The recovery worktree must remain available until the final reviewer chooses the integration method.