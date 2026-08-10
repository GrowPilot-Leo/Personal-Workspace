import type { EntityId, IsoDateTime } from "@/core/identity";
import type { Task } from "@/core/tasks";
import type { Goal } from "@/core/goals";
import type { Review } from "@/core/reviews";

/**
 * Migration boundary (DATA_MODEL.md §11):
 * - read and validate the source payload
 * - preserve a raw backup before mapping
 * - record migration version and result
 * - retry safely without duplicating records (idempotent)
 * - cleanup is a separate, explicitly approved later action
 */

export type MigrationStatus = "pending" | "applied" | "skipped" | "failed";

export type MigrationRecord = {
  id: EntityId;
  migrationKey: string;
  version: number;
  status: MigrationStatus;
  appliedAt: IsoDateTime | null;
  error: string | null;
};

export type MigrationResult<T> = {
  record: MigrationRecord;
  payload: T | null;
  backupKey: string | null;
};

export type StorageLike = Pick<Storage, "getItem" | "setItem">;

export const V1_DAILY_LOOP_KEY = "growpilot.daily-loop.v1";
export const V1_DAILY_LOOP_BACKUP_KEY = "growpilot.daily-loop.v1.backup";
export const MIGRATION_LOG_KEY = "growpilot.migrations.v1";
export const V2_MIGRATED_KEY = "growpilot.daily-loop.v2.migrated";

export function loadMigrationLog(storage: StorageLike): MigrationRecord[] {
  try {
    const raw = storage.getItem(MIGRATION_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMigrationLog(storage: StorageLike, log: MigrationRecord[]) {
  storage.setItem(MIGRATION_LOG_KEY, JSON.stringify(log));
}

/**
 * V2 daily-loop state produced by the migration. Kept minimal and stable:
 * it is the target schema for the migrated daily loop only.
 */
export type MigratedDailyLoopV2 = {
  schemaVersion: 2;
  goal: Goal | null;
  tasks: Task[];
  reviews: Review[];
  activeDate: string;
  migratedAt: IsoDateTime;
  sourceKey: string;
};

function isValidV1DailyLoop(value: unknown): value is {
  version: 1;
  activeDate: string;
  goal: string;
  availableMinutes: number;
  tasks: unknown[];
  review: unknown | null;
} {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 1 &&
    typeof record.activeDate === "string" &&
    typeof record.goal === "string" &&
    typeof record.availableMinutes === "number" &&
    Array.isArray(record.tasks)
  );
}

function normalizeV1Task(value: unknown, fallbackId: string, scheduledDate: string): Task | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.title !== "string" || !record.title.trim()) return null;
  return {
    id: typeof record.id === "string" ? record.id : fallbackId,
    ownerModuleId: "learning",
    ownerEntityId: "learning-space-v1-daily-loop",
    title: record.title,
    description: "",
    durationMinutes:
      typeof record.durationMinutes === "number" ? record.durationMinutes : 25,
    scheduledDate,
    status: typeof record.completedAt === "string" ? ("done" as const) : ("planned" as const),
    dueAt: null,
    completedAt: typeof record.completedAt === "string" ? record.completedAt : null,
    createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Idempotent V1 → V2 migration.
 * - validates the raw V1 payload
 * - writes a raw backup once (never overwrites an existing backup)
 * - maps goal, tasks, review and history into V2 entities
 * - records the outcome in the migration log
 * - re-running does not duplicate records
 */
export function migrateDailyLoopV1ToV2(
  storage: StorageLike,
  now: IsoDateTime = new Date().toISOString(),
): MigrationResult<MigratedDailyLoopV2> {
  const log = loadMigrationLog(storage);
  const existing = log.find((r) => r.migrationKey === "daily-loop.v1-to-v2");

  if (existing?.status === "applied") {
    const raw = storage.getItem(V2_MIGRATED_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<MigratedDailyLoopV2>;
        if (parsed && parsed.schemaVersion === 2) {
          return {
            record: existing,
            payload: parsed as MigratedDailyLoopV2,
            backupKey: V1_DAILY_LOOP_BACKUP_KEY,
          };
        }
      } catch {
        // Rebuild from the preserved V1 source below instead of blanking the UI.
      }
    }
  }

  const rawV1 = storage.getItem(V1_DAILY_LOOP_KEY);
  if (!rawV1) {
    const record: MigrationRecord = {
      id: crypto.randomUUID(),
      migrationKey: "daily-loop.v1-to-v2",
      version: 2,
      status: "skipped",
      appliedAt: now,
      error: null,
    };
    saveMigrationLog(storage, [...log.filter((r) => r.migrationKey !== "daily-loop.v1-to-v2"), record]);
    return { record, payload: null, backupKey: null };
  }

  let parsedV1: unknown;
  try {
    parsedV1 = JSON.parse(rawV1);
  } catch {
    const record: MigrationRecord = {
      id: crypto.randomUUID(),
      migrationKey: "daily-loop.v1-to-v2",
      version: 2,
      status: "failed",
      appliedAt: now,
      error: "V1 payload is not valid JSON",
    };
    saveMigrationLog(storage, [...log.filter((r) => r.migrationKey !== "daily-loop.v1-to-v2"), record]);
    return { record, payload: null, backupKey: null };
  }

  if (!isValidV1DailyLoop(parsedV1)) {
    const record: MigrationRecord = {
      id: crypto.randomUUID(),
      migrationKey: "daily-loop.v1-to-v2",
      version: 2,
      status: "failed",
      appliedAt: now,
      error: "V1 payload failed validation",
    };
    saveMigrationLog(storage, [...log.filter((r) => r.migrationKey !== "daily-loop.v1-to-v2"), record]);
    return { record, payload: null, backupKey: null };
  }

  // Preserve a raw backup exactly once.
  if (!storage.getItem(V1_DAILY_LOOP_BACKUP_KEY)) {
    storage.setItem(V1_DAILY_LOOP_BACKUP_KEY, rawV1);
  }

  const goal: Goal = {
    id: crypto.randomUUID(),
    title: parsedV1.goal || "未命名目标",
    description: "",
    status: parsedV1.goal ? "active" : "draft",
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };

  const tasks: Task[] = parsedV1.tasks
    .map((t, index) =>
      normalizeV1Task(t, `v1-task-${index}-${parsedV1.activeDate}`, parsedV1.activeDate),
    )
    .filter((t): t is Task => t !== null);

  const reviews: Review[] =
    parsedV1.review &&
    typeof parsedV1.review === "object" &&
    parsedV1.review !== null &&
    (typeof (parsedV1.review as Record<string, unknown>).wins === "string" ||
      typeof (parsedV1.review as Record<string, unknown>).blockers === "string" ||
      typeof (parsedV1.review as Record<string, unknown>).adjustment === "string")
      ? [
          {
            id: crypto.randomUUID(),
            ownerModuleId: "daily-loop",
            ownerEntityId: "learning-space-v1-daily-loop",
            horizon: "daily",
            periodKey: parsedV1.activeDate,
            wins: String((parsedV1.review as Record<string, unknown>).wins ?? ""),
            blockers: String((parsedV1.review as Record<string, unknown>).blockers ?? ""),
            adjustment: String((parsedV1.review as Record<string, unknown>).adjustment ?? ""),
            submittedAt: now,
            updatedAt: now,
          },
        ]
      : [];

  const migrated: MigratedDailyLoopV2 = {
    schemaVersion: 2,
    goal,
    tasks,
    reviews,
    activeDate: parsedV1.activeDate,
    migratedAt: now,
    sourceKey: V1_DAILY_LOOP_KEY,
  };

  storage.setItem(V2_MIGRATED_KEY, JSON.stringify(migrated));

  const record: MigrationRecord = {
    id: crypto.randomUUID(),
    migrationKey: "daily-loop.v1-to-v2",
    version: 2,
    status: "applied",
    appliedAt: now,
    error: null,
  };
  saveMigrationLog(storage, [...log.filter((r) => r.migrationKey !== "daily-loop.v1-to-v2"), record]);

  return { record, payload: migrated, backupKey: V1_DAILY_LOOP_BACKUP_KEY };
}
