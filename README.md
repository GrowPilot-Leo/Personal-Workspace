# GrowPilot 0.1 MVP

GrowPilot is a local-first personal learning loop. Version 0.1 deliberately ships one complete workflow instead of exposing unfinished modules:

    create a Learning task
    -> execute it in Today
    -> review the day
    -> save, roll unfinished work forward, and back up locally

## Shipped scope

The visible application contains exactly four destinations:

- **Today** — execute today's Learning tasks, start one task at a time, check subtasks, complete or undo completion.
- **Learning** — create, edit, and delete unfinished tasks in the default “我的学习” space. Tasks support notes, date, expected minutes, priority, up to three tags, and one-level subtasks.
- **Review** — see today's completion facts, answer two prompts, save one daily review, and explicitly roll unfinished tasks to tomorrow.
- **Settings** — select appearance and motion preferences, export the complete Workspace V2 backup, preview and confirm imports, or clear growth data.

The root path and /dashboard both enter /today.

Career, English, Fitness, Knowledge, Badges, RAG, DeepSeek, agent harnesses, login, cloud sync, and Android packaging are not part of the 0.1 acceptance path. Their historical code and design documents may remain dormant for future work, but they are not visible in the MVP navigation.

## Data and privacy boundary

GrowPilot 0.1 has no account, server database, cloud synchronization, or model-provider connection. Growth data is stored only in the current browser's local storage.

Clearing browser/site data can permanently remove the workspace. Export a JSON backup regularly from **Settings**. Import always shows task, learning-space, and review counts before it overwrites the current workspace.

## Local development

Requirements:

- Node.js 22 or newer
- npm

    npm install
    npm test
    npm run typecheck
    npm run build
    npm run dev

Open http://localhost:3000.

Run the focused end-to-end MVP acceptance with:

    npx playwright test apps/web/e2e/mvp-closure.spec.ts --project=chromium

## Current design and implementation records

- [MVP design](docs/superpowers/specs/2026-08-24-learning-today-review-mvp-design.md)
- [MVP implementation plan](docs/superpowers/plans/2026-08-24-learning-today-review-mvp.md)
- [MVP acceptance record](docs/v2/MVP_ACCEPTANCE.md)
- [V2 documentation index](docs/v2/INDEX.md)

Older V1/V2 documents remain historical context and may describe modules that are dormant in GrowPilot 0.1.

## Change discipline

Changes must state their owning module, local-data impact, migration requirement, verification evidence, and rollback point. Prefer focused Conventional Commits and keep the four-route MVP usable before expanding scope.