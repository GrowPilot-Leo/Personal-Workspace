import type { EntityId, IsoDateTime } from "@/core/identity";
import type { Task } from "@/core/tasks";
import type { Goal } from "@/core/goals";
import type { Review } from "@/core/reviews";
import { isDateKey, isIsoDateTime } from "./identity.ts";
import type { LearningPlanData, LearningSpace } from "./learning.ts";
import { createPlan } from "./plans.ts";
import type { Plan } from "./plans.ts";
import {
  createEmptyWorkspaceStateV2,
  normalizeWorkspaceStateV2,
} from "./workspace-state.ts";
import type { WorkspaceStateV2 } from "./workspace-state.ts";

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
export const WORKSPACE_V2_KEY = "growpilot.workspace.v2";
export const WORKSPACE_V2_CORRUPT_BACKUP_KEY =
  "growpilot.workspace.v2.corrupt.backup";

const MIGRATION_KEY = "daily-loop.v1-to-v2";
const MIGRATED_SPACE_ID = "learning-space-v1-daily-loop";
const MONTHLY_PLAN_ID = "learning-plan-v1-monthly";

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

type V1DailyLoop = {
  version: 1;
  activeDate: string;
  goal: string;
  availableMinutes: number;
  tasks: unknown[];
  review: unknown | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidV1DailyLoop(value: unknown): value is V1DailyLoop {
  if (!isRecord(value)) return false;
  return (
    value.version === 1 &&
    isDateKey(value.activeDate) &&
    typeof value.goal === "string" &&
    typeof value.availableMinutes === "number" &&
    Number.isFinite(value.availableMinutes) &&
    Array.isArray(value.tasks)
  );
}

function normalizeV1Task(
  value: unknown,
  fallbackId: string,
  scheduledDate: string,
  now: IsoDateTime,
): Task | null {
  if (!isRecord(value)) return null;
  const record = value;
  if (typeof record.title !== "string" || !record.title.trim()) return null;
  return {
    id:
      typeof record.id === "string" && record.id.trim()
        ? record.id
        : fallbackId,
    ownerModuleId: "learning",
    ownerEntityId: MIGRATED_SPACE_ID,
    title: record.title,
    description: "",
    durationMinutes:
      typeof record.durationMinutes === "number"
        ? record.durationMinutes
        : 25,
    scheduledDate,
    priority: "medium",
    tags: [],
    subtasks: [],
    status:
      typeof record.completedAt === "string"
        ? ("done" as const)
        : ("planned" as const),
    dueAt: null,
    completedAt:
      typeof record.completedAt === "string" ? record.completedAt : null,
    createdAt: isIsoDateTime(record.createdAt) ? record.createdAt : now,
    updatedAt: now,
  };
}

function parseV1Raw(
  raw: string,
): { value: V1DailyLoop | null; error: string | null } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { value: null, error: "V1 payload is not valid JSON" };
  }

  return isValidV1DailyLoop(parsed)
    ? { value: parsed, error: null }
    : { value: null, error: "V1 payload failed validation" };
}

function migrationRecord(
  storage: StorageLike,
  status: MigrationStatus,
  now: IsoDateTime,
  error: string | null = null,
): MigrationRecord {
  const log = loadMigrationLog(storage);
  const existing = log.find((record) => record.migrationKey === MIGRATION_KEY);
  if (status === "applied" && existing?.status === "applied") {
    return existing;
  }

  const record: MigrationRecord = {
    id: existing?.id ?? "migration-daily-loop-v1-to-v2",
    migrationKey: MIGRATION_KEY,
    version: 2,
    status,
    appliedAt: now,
    error,
  };
  saveMigrationLog(storage, [
    ...log.filter((entry) => entry.migrationKey !== MIGRATION_KEY),
    record,
  ]);
  return record;
}

function migrationRecordForExistingWorkspace(
  storage: StorageLike,
  workspace: WorkspaceStateV2,
  now: IsoDateTime,
): MigrationRecord {
  const isEmpty =
    workspace.learningSpaces.length === 0 &&
    workspace.plans.length === 0 &&
    workspace.tasks.length === 0 &&
    workspace.reviews.length === 0 &&
    workspace.events.length === 0;
  const existing = loadMigrationLog(storage).find(
    (record) => record.migrationKey === MIGRATION_KEY,
  );

  if (
    isEmpty &&
    (existing?.status === "skipped" || existing?.status === "failed")
  ) {
    return existing;
  }

  return migrationRecord(storage, "applied", now);
}

function migratedPlans(
  goal: string,
  activeDate: string,
  taskIds: EntityId[],
  capacityMinutes: number | null,
  now: IsoDateTime,
): Plan<LearningPlanData>[] {
  const weeklyPlanId = `learning-plan-v1-weekly-${activeDate}`;
  const dailyPlanId = `learning-plan-v1-daily-${activeDate}`;

  const monthly = createPlan<LearningPlanData>({
    id: MONTHLY_PLAN_ID,
    ownerModuleId: "learning",
    ownerEntityId: MIGRATED_SPACE_ID,
    horizon: "monthly",
    reason: "migration",
    now,
    data: {
      learningSpaceId: MIGRATED_SPACE_ID,
      periodKey: activeDate.slice(0, 7),
      title: "Monthly learning plan",
      goal,
      parentPlanId: null,
      taskIds: [],
      capacityMinutes: null,
    },
  });

  const weekly = createPlan<LearningPlanData>({
    id: weeklyPlanId,
    ownerModuleId: "learning",
    ownerEntityId: MIGRATED_SPACE_ID,
    horizon: "weekly",
    reason: "migration",
    now,
    data: {
      learningSpaceId: MIGRATED_SPACE_ID,
      periodKey: activeDate,
      title: "Weekly learning plan",
      goal,
      parentPlanId: MONTHLY_PLAN_ID,
      taskIds: [],
      capacityMinutes: null,
    },
  });

  const daily = createPlan<LearningPlanData>({
    id: dailyPlanId,
    ownerModuleId: "learning",
    ownerEntityId: MIGRATED_SPACE_ID,
    horizon: "daily",
    reason: "migration",
    now,
    data: {
      learningSpaceId: MIGRATED_SPACE_ID,
      periodKey: activeDate,
      title: "Daily learning plan",
      goal,
      parentPlanId: weeklyPlanId,
      taskIds,
      capacityMinutes,
    },
  });

  return [monthly, weekly, daily];
}

function migratedSpace(goal: string, now: IsoDateTime): LearningSpace {
  return {
    id: MIGRATED_SPACE_ID,
    name: goal.trim() || "Migrated daily loop",
    goal,
    status: goal.trim() ? "active" : "draft",
    templateId: "three-horizon",
    currentMonthlyPlanId: MONTHLY_PLAN_ID,
    createdAt: now,
    updatedAt: now,
  };
}

function migratedV1Reviews(
  value: unknown,
  activeDate: string,
  now: IsoDateTime,
): Review[] {
  if (!isRecord(value)) return [];
  if (
    typeof value.wins !== "string" &&
    typeof value.blockers !== "string" &&
    typeof value.adjustment !== "string"
  ) {
    return [];
  }

  return [
    {
      id: `learning-review-v1-daily-${activeDate}`,
      ownerModuleId: "learning",
      ownerEntityId: null,
      horizon: "daily",
      periodKey: activeDate,
      wins: String(value.wins ?? ""),
      blockers: String(value.blockers ?? ""),
      adjustment: String(value.adjustment ?? ""),
      submittedAt: now,
      updatedAt: now,
    },
  ];
}

function workspaceFromV1(
  value: V1DailyLoop,
  now: IsoDateTime,
): WorkspaceStateV2 {
  const taskCandidates = value.tasks
    .map((task, index) =>
      normalizeV1Task(
        task,
        `v1-task-${index}-${value.activeDate}`,
        value.activeDate,
        now,
      ),
    )
    .filter((task): task is Task => task !== null);

  const tasks = normalizeWorkspaceStateV2(
    {
      version: 2,
      learningSpaces: [],
      plans: [],
      tasks: taskCandidates,
      reviews: [],
      events: [],
      updatedAt: now,
    },
    now,
  ).tasks;

  return normalizeWorkspaceStateV2(
    {
      version: 2,
      learningSpaces: [migratedSpace(value.goal, now)],
      plans: migratedPlans(
        value.goal,
        value.activeDate,
        tasks.map((task) => task.id),
        value.availableMinutes,
        now,
      ),
      tasks,
      reviews: migratedV1Reviews(value.review, value.activeDate, now),
      events: [],
      updatedAt: now,
    },
    now,
  );
}

export function migrateDailyLoopPayloadToWorkspaceV2(
  value: unknown,
  now: IsoDateTime,
): WorkspaceStateV2 | null {
  return isValidV1DailyLoop(value) ? workspaceFromV1(value, now) : null;
}
type ParsedWorkspaceRoot = {
  workspace: WorkspaceStateV2;
  needsRepair: boolean;
};

function parseWorkspaceRoot(
  raw: string,
  now: IsoDateTime,
): ParsedWorkspaceRoot | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed) || parsed.version !== 2) {
    return null;
  }

  if (
    !Array.isArray(parsed.learningSpaces) &&
    !Array.isArray(parsed.plans) &&
    !Array.isArray(parsed.tasks) &&
    !Array.isArray(parsed.reviews) &&
    !Array.isArray(parsed.events)
  ) {
    return null;
  }

  const normalized = normalizeWorkspaceStateV2(parsed, now);
  const collections: Array<[unknown, number]> = [
    [parsed.learningSpaces, normalized.learningSpaces.length],
    [parsed.plans, normalized.plans.length],
    [parsed.tasks, normalized.tasks.length],
    [parsed.reviews, normalized.reviews.length],
    [parsed.events, normalized.events.length],
  ];
  const hasValidEntity = collections.some(
    ([, normalizedLength]) => normalizedLength > 0,
  );
  const hasTrulyEmptyCollections = collections.every(
    ([source]) => Array.isArray(source) && source.length === 0,
  );
  if (!hasValidEntity && !hasTrulyEmptyCollections) {
    return null;
  }

  const needsRepair =
    !isIsoDateTime(parsed.updatedAt) ||
    normalized.updatedAt !== parsed.updatedAt ||
    collections.some(
      ([source, normalizedLength]) =>
        !Array.isArray(source) || source.length !== normalizedLength,
    );

  return { workspace: normalized, needsRepair };
}

function parseIntermediate(raw: string): MigratedDailyLoopV2 | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (
    !isRecord(parsed) ||
    parsed.schemaVersion !== 2 ||
    (parsed.goal !== null &&
      (!isRecord(parsed.goal) || typeof parsed.goal.title !== "string")) ||
    !Array.isArray(parsed.tasks) ||
    !Array.isArray(parsed.reviews) ||
    !isDateKey(parsed.activeDate) ||
    !isIsoDateTime(parsed.migratedAt) ||
    typeof parsed.sourceKey !== "string"
  ) {
    return null;
  }

  return parsed as MigratedDailyLoopV2;
}

function workspaceFromIntermediate(
  snapshot: MigratedDailyLoopV2,
  now: IsoDateTime,
): WorkspaceStateV2 | null {
  const goal = snapshot.goal?.title ?? "";
  const tasks = snapshot.tasks.map((task) => ({
    ...task,
    ownerModuleId: "learning" as const,
    ownerEntityId: MIGRATED_SPACE_ID,
  }));
  const reviews = snapshot.reviews.map((review) => ({
    ...review,
    ownerModuleId: "learning",
    ownerEntityId: null,
  }));

  const candidate: WorkspaceStateV2 = {
    version: 2,
    learningSpaces: [migratedSpace(goal, now)],
    plans: migratedPlans(
      goal,
      snapshot.activeDate,
      tasks.map((task) => task.id),
      null,
      now,
    ),
    tasks,
    reviews,
    events: [],
    updatedAt: now,
  };

  const normalized = normalizeWorkspaceStateV2(candidate, now);
  if (
    normalized.learningSpaces.length !== 1 ||
    normalized.plans.length !== 3 ||
    normalized.tasks.length !== snapshot.tasks.length ||
    normalized.reviews.length !== snapshot.reviews.length
  ) {
    return null;
  }
  return normalized;
}

export function migrateDailyLoopV1ToWorkspaceV2(
  storage: StorageLike,
  now: IsoDateTime = new Date().toISOString(),
): MigrationResult<WorkspaceStateV2> {
  const rawWorkspace = storage.getItem(WORKSPACE_V2_KEY);
  let corruptBackupKey: string | null = null;

  if (rawWorkspace !== null) {
    const parsedWorkspace = parseWorkspaceRoot(rawWorkspace, now);
    if (parsedWorkspace && !parsedWorkspace.needsRepair) {
      return {
        record: migrationRecordForExistingWorkspace(
          storage,
          parsedWorkspace.workspace,
          now,
        ),
        payload: parsedWorkspace.workspace,
        backupKey: null,
      };
    }

    storage.setItem(WORKSPACE_V2_CORRUPT_BACKUP_KEY, rawWorkspace);
    corruptBackupKey = WORKSPACE_V2_CORRUPT_BACKUP_KEY;

    if (parsedWorkspace) {
      storage.setItem(
        WORKSPACE_V2_KEY,
        JSON.stringify(parsedWorkspace.workspace),
      );
      return {
        record: migrationRecord(storage, "applied", now),
        payload: parsedWorkspace.workspace,
        backupKey: corruptBackupKey,
      };
    }
  }

  const rawIntermediate = storage.getItem(V2_MIGRATED_KEY);
  if (rawIntermediate !== null) {
    const intermediate = parseIntermediate(rawIntermediate);
    const workspace = intermediate
      ? workspaceFromIntermediate(intermediate, now)
      : null;
    if (workspace) {
      storage.setItem(WORKSPACE_V2_KEY, JSON.stringify(workspace));
      return {
        record: migrationRecord(storage, "applied", now),
        payload: workspace,
        backupKey: corruptBackupKey,
      };
    }
  }

  const rawV1 = storage.getItem(V1_DAILY_LOOP_KEY);
  if (rawV1 !== null) {
    const parsedV1 = parseV1Raw(rawV1);
    if (!parsedV1.value) {
      const empty = createEmptyWorkspaceStateV2(now);
      storage.setItem(WORKSPACE_V2_KEY, JSON.stringify(empty));
      return {
        record: migrationRecord(storage, "skipped", now),
        payload: empty,
        backupKey: corruptBackupKey,
      };
    }

    if (storage.getItem(V1_DAILY_LOOP_BACKUP_KEY) === null) {
      storage.setItem(V1_DAILY_LOOP_BACKUP_KEY, rawV1);
    }

    const workspace = workspaceFromV1(parsedV1.value, now);
    storage.setItem(WORKSPACE_V2_KEY, JSON.stringify(workspace));
    return {
      record: migrationRecord(storage, "applied", now),
      payload: workspace,
      backupKey: V1_DAILY_LOOP_BACKUP_KEY,
    };
  }

  const empty = createEmptyWorkspaceStateV2(now);
  storage.setItem(WORKSPACE_V2_KEY, JSON.stringify(empty));
  return {
    record: migrationRecord(storage, "skipped", now),
    payload: empty,
    backupKey: corruptBackupKey,
  };
}

function legacySnapshotFromWorkspace(
  workspace: WorkspaceStateV2,
  value: V1DailyLoop,
): MigratedDailyLoopV2 {
  const space = workspace.learningSpaces.find(
    (candidate) => candidate.id === MIGRATED_SPACE_ID,
  );
  const migratedAt = workspace.updatedAt;
  const goal: Goal = {
    id: "goal-v1-daily-loop",
    title: value.goal,
    description: "",
    status: value.goal ? "active" : "draft",
    createdAt: space?.createdAt ?? migratedAt,
    updatedAt: space?.updatedAt ?? migratedAt,
    completedAt: null,
  };

  return {
    schemaVersion: 2,
    goal,
    tasks: workspace.tasks.filter(
      (task) => task.ownerEntityId === MIGRATED_SPACE_ID,
    ),
    reviews: workspace.reviews
      .filter(
        (review) =>
          review.horizon === "daily" &&
          review.periodKey === value.activeDate,
      )
      .map((review) => ({
        ...review,
        ownerModuleId: "daily-loop",
        ownerEntityId: MIGRATED_SPACE_ID,
      })),
    activeDate: value.activeDate,
    migratedAt,
    sourceKey: V1_DAILY_LOOP_KEY,
  };
}

/**
 * One-release compatibility wrapper. Workspace V2 is authoritative; the
 * intermediate value is retained only as a rollback snapshot.
 */
export function migrateDailyLoopV1ToV2(
  storage: StorageLike,
  now: IsoDateTime = new Date().toISOString(),
): MigrationResult<MigratedDailyLoopV2> {
  const rawWorkspaceBeforeMigration = storage.getItem(WORKSPACE_V2_KEY);
  const hadAuthoritativeWorkspace =
    rawWorkspaceBeforeMigration !== null &&
    parseWorkspaceRoot(rawWorkspaceBeforeMigration, now) !== null;
  const workspaceResult = migrateDailyLoopV1ToWorkspaceV2(storage, now);
  if (workspaceResult.record.status === "failed") {
    return {
      record: workspaceResult.record,
      payload: null,
      backupKey: null,
    };
  }

  const existingIntermediateRaw = storage.getItem(V2_MIGRATED_KEY);
  if (existingIntermediateRaw !== null) {
    const existingIntermediate = parseIntermediate(existingIntermediateRaw);
    if (existingIntermediate) {
      return {
        record: workspaceResult.record,
        payload: existingIntermediate,
        backupKey:
          storage.getItem(V1_DAILY_LOOP_BACKUP_KEY) !== null
            ? V1_DAILY_LOOP_BACKUP_KEY
            : null,
      };
    }
  }

  if (hadAuthoritativeWorkspace) {
    return {
      record: workspaceResult.record,
      payload: null,
      backupKey: null,
    };
  }

  const rawV1 = storage.getItem(V1_DAILY_LOOP_KEY);
  if (rawV1 === null || !workspaceResult.payload) {
    return {
      record: workspaceResult.record,
      payload: null,
      backupKey: null,
    };
  }

  const parsedV1 = parseV1Raw(rawV1);
  if (!parsedV1.value) {
    return {
      record: migrationRecord(storage, "failed", now, parsedV1.error),
      payload: null,
      backupKey: null,
    };
  }

  const legacy = legacySnapshotFromWorkspace(
    workspaceResult.payload,
    parsedV1.value,
  );
  if (existingIntermediateRaw === null) {
    storage.setItem(V2_MIGRATED_KEY, JSON.stringify(legacy));
  }

  return {
    record: workspaceResult.record,
    payload: legacy,
    backupKey: V1_DAILY_LOOP_BACKUP_KEY,
  };
}
