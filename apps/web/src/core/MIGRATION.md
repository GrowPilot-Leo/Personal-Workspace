# V2 migration boundary

## Purpose

V1 stores a daily loop under the local-storage key `growpilot.daily-loop.v1`.
V2 introduces typed core entities (Goal, Task, Plan, Review) with versioned
data. The migration boundary moves V1 data forward explicitly, never silently.

## Guarantees (DATA_MODEL.md §11)

1. Reads and validates `growpilot.daily-loop.v1`
2. Preserves a raw backup at `growpilot.daily-loop.v1.backup` exactly once
3. Maps goal, tasks, review and history into V2 entities
4. Records migration version and result in `growpilot.migrations.v1`
5. Retries safely without duplicating records (idempotent)
6. Provides a user-visible export path before any destructive cleanup

## Files

- `src/core/migrations.ts` — migration logic and V2 target schema
- `src/core/migrations.test.mjs` — coverage: mapping, idempotency, skip, invalid payload

## Storage keys

| Key | Meaning |
|---|---|
| `growpilot.daily-loop.v1` | V1 source (read-only input) |
| `growpilot.daily-loop.v1.backup` | raw V1 backup, written once |
| `growpilot.migrations.v1` | migration log (idempotency) |
| `growpilot.daily-loop.v2.migrated` | migrated V2 snapshot |

## Usage

```ts
import { migrateDailyLoopV1ToV2 } from "@/core/migrations";

const result = migrateDailyLoopV1ToV2(window.localStorage);
if (result.record.status === "applied") {
  // result.payload is the V2 daily-loop state
}
```

## Rules

- The migration is invoked lazily by V2 consumers, not on import.
- `growpilot.daily-loop.v1` is never deleted by this migration. Cleanup is a
  separate, explicitly approved later action.
- New V2 state uses the typed schema; uncontrolled JSON writes are not added
  to components.
