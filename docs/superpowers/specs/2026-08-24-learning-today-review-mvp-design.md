# GrowPilot Learning-Today-Review MVP Design

Date: 2026-08-24
Status: approved for implementation

## Objective

Ship one complete local-first workflow:

1. Create and manage a learning task in Learning.
2. Execute today's task in Today.
3. Review the day and deliberately roll unfinished work forward in Review.
4. Persist every change locally and support manual JSON backup and restore in Settings.

The MVP is successful when this flow works on desktop and 390 px mobile without requiring an account, cloud service, AI provider, or external database.

## Product Boundary

The only primary routes are Today, Learning, Review, and Settings. Desktop and mobile navigation expose the same four destinations but never appear at the same viewport size. Dashboard enters Today. Career, English, Fitness, Knowledge, Badge, RAG, DeepSeek, agent harnesses, cloud sync, login, Android packaging, timers, advanced analytics, and cache management are out of scope. Their existing code may remain dormant but must not appear in the MVP navigation or acceptance path.

## Learning

Learning owns task creation and editing. The first visit creates or reuses one default active learning space named `我的学习`; users do not choose templates or configure monthly, weekly, or daily planning layers.

A task contains:

- required title;
- optional note;
- scheduled date, defaulting to today;
- expected duration, defaulting to 25 minutes;
- priority: high, medium, or low, defaulting to medium;
- at most three trimmed, unique free-text tags;
- a single-level subtask checklist;
- planned, active, or done status;
- completion time when done.

Subtasks have only an ID, title, and completion flag. They cannot have dates, duration, priority, tags, children, independent Today entries, or independent review records. Learning allows creating, editing, and deleting unfinished tasks. Completed tasks remain viewable but are collapsed by default.

## Today

Today owns execution and cannot create or edit tasks. It displays eligible Learning tasks whose scheduled date is today. Planned tasks are ordered by priority and then stable creation order.

Only one task may be active. Starting another task returns the previous active task to planned. Users can expand a task and check subtasks, complete the parent task, and undo completion. Completing a parent with unfinished subtasks requires confirmation. Completion records a completion time and one deduplicated completion event. The MVP shows expected duration but has no countdown, pause state, notifications, background timing, or actual-duration tracking.

## Review

Review derives facts from Workspace V2 for the selected day:

- total, completed, and unfinished task counts;
- total expected minutes of completed tasks;
- completed task and subtask details.

The user can answer two prompts:

1. `今天完成了什么、学到了什么？`
2. `明天需要调整什么？`

Saving the same day updates one workspace-owned daily review instead of creating duplicates. Unfinished planned or active Learning tasks move to tomorrow only after an explicit user action. Rollover preserves task IDs, priority, tags, and subtask state; completed, archived-space, non-Learning, and other-date tasks do not move. Repeating rollover is idempotent.

## Local Persistence and Backup

Every mutation saves normalized Workspace V2 immediately through the repository boundary. Reloading or reopening the browser restores the latest state.

Settings supports:

- exporting one complete versioned JSON backup containing normalized Workspace V2 and valid appearance preferences;
- validating an import before confirmation;
- showing import counts for spaces, tasks, and reviews before overwrite;
- applying no changes for invalid or cancelled imports;
- importing valid V2 backups and the supported V1 export through the existing migration;
- clearing growth data only after confirmation while preserving appearance and migration/backup records.

There is no automatic backup. The UI must explain that browser data can be lost if the user clears site data or removes the application.

## Error Handling

- Invalid task input stays in the form with a visible explanation.
- Persistence failures show a visible failure state and must not claim success.
- Invalid import files leave workspace and appearance unchanged.
- Destructive clear and overwrite actions require confirmation.
- Empty states provide the next valid action rather than fabricated progress.

## Acceptance Path

On desktop 1280x800 and mobile 390x844, a new user can:

1. Open Learning and immediately use the default space.
2. Create a task with priority, tags, and subtasks.
3. See it in Today for its scheduled date.
4. Start it, check subtasks, complete it, and undo/re-complete it without duplicate events.
5. Open Review, see accurate derived facts, save both review answers, and manually roll an unfinished task to tomorrow.
6. Reload and retain all changes.
7. Export a backup, clear growth data while keeping appearance, import the backup after preview and confirmation, and recover the same tasks and review.

The release gate is focused unit coverage for the four-module flow, typecheck, production build, and one desktop plus one mobile end-to-end acceptance path. Full-repository tests run once at the final gate, not after every cycle.
