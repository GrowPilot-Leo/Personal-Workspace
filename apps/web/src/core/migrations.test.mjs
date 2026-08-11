import test from "node:test";
import assert from "node:assert/strict";
import {
  MIGRATION_LOG_KEY,
  V1_DAILY_LOOP_BACKUP_KEY,
  V1_DAILY_LOOP_KEY,
  V2_MIGRATED_KEY,
  WORKSPACE_V2_CORRUPT_BACKUP_KEY,
  WORKSPACE_V2_KEY,
  migrateDailyLoopV1ToV2,
  migrateDailyLoopV1ToWorkspaceV2,
} from "./migrations.ts";

function memoryStorage(seed = {}) {
  const data = new Map(Object.entries(seed));
  const writes = [];
  return {
    getItem(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      writes.push({ key, value });
      data.set(key, value);
    },
    get writes() {
      return [...writes];
    },
  };
}

const v1Fixture = JSON.stringify({
  version: 1,
  activeDate: "2026-08-03",
  goal: "掌握 RAG 基础",
  availableMinutes: 90,
  tasks: [
    {
      id: "t1",
      title: "阅读检索论文",
      durationMinutes: 30,
      completedAt: "2026-08-03T01:00:00Z",
      createdAt: "2026-08-02T10:00:00Z",
    },
    {
      id: "t2",
      title: "画检索流程图",
      durationMinutes: 45,
      completedAt: null,
      createdAt: "2026-08-02T10:00:00Z",
    },
    { id: "bad", title: "", durationMinutes: 30 },
  ],
  review: { wins: "读完第一章", blockers: "时间不够", adjustment: "缩小范围" },
});

test("migration maps V1 daily loop into V2 entities and preserves a backup", () => {
  const storage = memoryStorage({ [V1_DAILY_LOOP_KEY]: v1Fixture });
  const result = migrateDailyLoopV1ToV2(storage, "2026-08-06T00:00:00Z");

  assert.equal(result.record.status, "applied");
  assert.equal(result.record.migrationKey, "daily-loop.v1-to-v2");
  assert.ok(result.payload, "payload should exist");

  assert.equal(result.payload.schemaVersion, 2);
  assert.equal(result.payload.goal.title, "掌握 RAG 基础");
  assert.equal(result.payload.goal.status, "active");
  assert.equal(result.payload.activeDate, "2026-08-03");

  // invalid task dropped, valid tasks mapped with correct status
  assert.equal(result.payload.tasks.length, 2);
  const done = result.payload.tasks.find((t) => t.id === "t1");
  assert.equal(done.ownerModuleId, "learning");
  assert.equal(done.ownerEntityId, "learning-space-v1-daily-loop");
  assert.equal(done.scheduledDate, "2026-08-03");
  assert.equal(done.status, "done");
  assert.equal(done.completedAt, "2026-08-03T01:00:00Z");
  const todo = result.payload.tasks.find((t) => t.id === "t2");
  assert.equal(todo.status, "planned");

  assert.equal(result.payload.reviews.length, 1);
  assert.equal(result.payload.reviews[0].ownerEntityId, "learning-space-v1-daily-loop");
  assert.equal(result.payload.reviews[0].wins, "读完第一章");

  // raw backup preserved, migration log recorded, migrated snapshot written
  assert.equal(storage.getItem(V1_DAILY_LOOP_BACKUP_KEY), v1Fixture);
  const log = JSON.parse(storage.getItem(MIGRATION_LOG_KEY));
  assert.equal(log.length, 1);
  assert.equal(log[0].status, "applied");
  assert.ok(storage.getItem(V2_MIGRATED_KEY));
});

test("re-running migration is idempotent and does not duplicate records", () => {
  const storage = memoryStorage({ [V1_DAILY_LOOP_KEY]: v1Fixture });
  const first = migrateDailyLoopV1ToV2(storage, "2026-08-06T00:00:00Z");
  const second = migrateDailyLoopV1ToV2(storage, "2026-08-06T01:00:00Z");

  assert.equal(first.record.status, "applied");
  assert.equal(second.record.status, "applied");

  const log = JSON.parse(storage.getItem(MIGRATION_LOG_KEY));
  assert.equal(log.length, 1, "log must not grow on re-run");

  assert.equal(first.payload.tasks.length, second.payload.tasks.length);
  assert.equal(first.payload.reviews.length, second.payload.reviews.length);
  // same migrated snapshot returned, not duplicated
  assert.equal(storage.getItem(V2_MIGRATED_KEY), JSON.stringify(second.payload));
});

test("migration skips cleanly when no V1 data exists", () => {
  const storage = memoryStorage();
  const result = migrateDailyLoopV1ToV2(storage);

  assert.equal(result.record.status, "skipped");
  assert.equal(result.payload, null);
  assert.equal(storage.getItem(V1_DAILY_LOOP_BACKUP_KEY), null);
});

test("migration fails validation without writing partial state", () => {
  const storage = memoryStorage({
    [V1_DAILY_LOOP_KEY]: JSON.stringify({ version: 1, goal: 123 }),
  });
  const result = migrateDailyLoopV1ToV2(storage);

  assert.equal(result.record.status, "failed");
  assert.equal(result.record.error, "V1 payload failed validation");
  assert.equal(result.payload, null);
  assert.equal(storage.getItem(V1_DAILY_LOOP_BACKUP_KEY), null);
  assert.equal(storage.getItem(V2_MIGRATED_KEY), null);
});

const WORKSPACE_NOW = "2026-08-11T08:00:00Z";
const WORKSPACE_LATER = "2026-08-11T09:00:00Z";
const MIGRATED_SPACE_ID = "learning-space-v1-daily-loop";

const workspaceV1Raw = '{"version":1,"activeDate":"2026-08-03","goal":"Build reliable RAG foundations","availableMinutes":90,"tasks":[{"id":"legacy-task-fixed","title":"Read retrieval notes","durationMinutes":30,"completedAt":"2026-08-03T01:00:00Z","createdAt":"2026-08-02T10:00:00Z"},{"title":"Draw the retrieval flow","durationMinutes":45,"completedAt":null,"createdAt":"2026-08-02T11:00:00Z"}],"review":{"wins":"Finished the retrieval notes","blockers":"Evaluation criteria were unclear","adjustment":"Define the acceptance checks first"}}';

const intermediateSnapshot = {
  schemaVersion: 2,
  goal: {
    id: "intermediate-goal-fixed",
    title: "Intermediate snapshot goal",
    description: "",
    status: "active",
    createdAt: "2026-08-01T08:00:00Z",
    updatedAt: "2026-08-01T08:00:00Z",
    completedAt: null,
  },
  tasks: [
    {
      id: "intermediate-task-fixed",
      ownerModuleId: "learning",
      ownerEntityId: MIGRATED_SPACE_ID,
      title: "Preserve the intermediate task",
      description: "",
      durationMinutes: 25,
      scheduledDate: "2026-08-01",
      status: "planned",
      dueAt: null,
      completedAt: null,
      createdAt: "2026-08-01T08:00:00Z",
      updatedAt: "2026-08-01T08:00:00Z",
    },
  ],
  reviews: [
    {
      id: "intermediate-review-fixed",
      ownerModuleId: "daily-loop",
      ownerEntityId: MIGRATED_SPACE_ID,
      horizon: "daily",
      periodKey: "2026-08-01",
      wins: "Intermediate review",
      blockers: "",
      adjustment: "",
      submittedAt: "2026-08-01T09:00:00Z",
      updatedAt: "2026-08-01T09:00:00Z",
    },
  ],
  activeDate: "2026-08-01",
  migratedAt: "2026-08-01T10:00:00Z",
  sourceKey: V1_DAILY_LOOP_KEY,
};

const intermediateRaw = JSON.stringify(intermediateSnapshot);

function existingWorkspaceFixture() {
  return {
    version: 2,
    learningSpaces: [
      {
        id: "existing-workspace-space",
        name: "Existing workspace wins",
        goal: "Keep this workspace untouched",
        status: "active",
        templateId: "blank",
        currentMonthlyPlanId: null,
        createdAt: "2026-08-09T08:00:00Z",
        updatedAt: "2026-08-09T08:00:00Z",
      },
    ],
    plans: [],
    tasks: [],
    reviews: [],
    events: [],
    updatedAt: "2026-08-09T08:00:00Z",
  };
}

function workspaceEntityIds(workspace) {
  return {
    learningSpaces: workspace.learningSpaces.map((space) => space.id),
    plans: workspace.plans.map((plan) => plan.id),
    tasks: workspace.tasks.map((task) => task.id),
    reviews: workspace.reviews.map((review) => review.id),
    events: workspace.events.map((event) => event.eventId),
  };
}

function workspaceCollectionLengths(workspace) {
  return {
    learningSpaces: workspace.learningSpaces.length,
    plans: workspace.plans.length,
    tasks: workspace.tasks.length,
    reviews: workspace.reviews.length,
    events: workspace.events.length,
  };
}

// Production break caught: V1 migration rewrites raw source, generates unstable
// ownership/plan data, copies review content into plans, or uses wall-clock timestamps.
test("workspace migration maps fixed V1 data and preserves its raw backup byte-for-byte", () => {
  const storage = memoryStorage({ [V1_DAILY_LOOP_KEY]: workspaceV1Raw });
  const result = migrateDailyLoopV1ToWorkspaceV2(storage, WORKSPACE_NOW);

  assert.equal(result.record.status, "applied");
  assert.ok(result.payload);
  assert.equal(storage.getItem(V1_DAILY_LOOP_BACKUP_KEY), workspaceV1Raw);
  assert.equal(storage.getItem(WORKSPACE_V2_KEY), JSON.stringify(result.payload));

  assert.equal(result.payload.version, 2);
  assert.equal(result.payload.updatedAt, WORKSPACE_NOW);
  assert.equal(result.payload.learningSpaces.length, 1);
  const space = result.payload.learningSpaces[0];
  assert.equal(space.id, MIGRATED_SPACE_ID);
  assert.equal(space.createdAt, WORKSPACE_NOW);
  assert.equal(space.updatedAt, WORKSPACE_NOW);

  assert.deepEqual(
    result.payload.plans.map((plan) => plan.id).sort(),
    [
      "learning-plan-v1-daily-2026-08-03",
      "learning-plan-v1-monthly",
      "learning-plan-v1-weekly-2026-08-03",
    ],
  );
  for (const plan of result.payload.plans) {
    assert.equal(plan.ownerModuleId, "learning");
    assert.equal(plan.ownerEntityId, MIGRATED_SPACE_ID);
  }

  assert.deepEqual(
    result.payload.tasks.map((task) => task.id),
    ["legacy-task-fixed", "v1-task-1-2026-08-03"],
  );
  for (const migratedTask of result.payload.tasks) {
    assert.equal(migratedTask.ownerModuleId, "learning");
    assert.equal(migratedTask.ownerEntityId, MIGRATED_SPACE_ID);
    assert.equal(migratedTask.scheduledDate, "2026-08-03");
    assert.equal(migratedTask.updatedAt, WORKSPACE_NOW);
  }

  assert.equal(result.payload.reviews.length, 1);
  const migratedReview = result.payload.reviews[0];
  assert.equal(migratedReview.ownerEntityId, null);
  assert.equal(migratedReview.periodKey, "2026-08-03");
  assert.equal(migratedReview.wins, "Finished the retrieval notes");
  assert.equal(migratedReview.blockers, "Evaluation criteria were unclear");
  assert.equal(migratedReview.adjustment, "Define the acceptance checks first");
  assert.equal(migratedReview.submittedAt, WORKSPACE_NOW);
  assert.equal(migratedReview.updatedAt, WORKSPACE_NOW);

  const serializedPlans = JSON.stringify(result.payload.plans);
  assert.equal(serializedPlans.includes('"wins"'), false);
  assert.equal(serializedPlans.includes('"blockers"'), false);
  assert.equal(serializedPlans.includes('"adjustment"'), false);
  assert.equal(serializedPlans.includes("Finished the retrieval notes"), false);
});

// Production break caught: the bridge ignores a valid intermediate snapshot,
// returns the legacy schema, or mutates the rollback snapshot while lifting it.
test("workspace migration lifts a valid intermediate V2 snapshot into WorkspaceStateV2", () => {
  const storage = memoryStorage({ [V2_MIGRATED_KEY]: intermediateRaw });
  const result = migrateDailyLoopV1ToWorkspaceV2(storage, WORKSPACE_NOW);

  assert.ok(result.payload);
  assert.equal(result.payload.version, 2);
  assert.deepEqual(Object.keys(result.payload).sort(), [
    "events",
    "learningSpaces",
    "plans",
    "reviews",
    "tasks",
    "updatedAt",
    "version",
  ]);
  assert.equal(result.payload.learningSpaces.length, 1);
  assert.equal(result.payload.learningSpaces[0].id, MIGRATED_SPACE_ID);
  assert.deepEqual(result.payload.tasks.map((task) => task.id), ["intermediate-task-fixed"]);
  assert.deepEqual(result.payload.reviews.map((review) => review.id), ["intermediate-review-fixed"]);
  assert.equal(storage.getItem(V2_MIGRATED_KEY), intermediateRaw);
  assert.equal(storage.getItem(WORKSPACE_V2_KEY), JSON.stringify(result.payload));
});

// Production break caught: a second run regenerates IDs or appends duplicates.
test("workspace migration is idempotent across repeated runs", () => {
  const storage = memoryStorage({ [V1_DAILY_LOOP_KEY]: workspaceV1Raw });
  const first = migrateDailyLoopV1ToWorkspaceV2(storage, WORKSPACE_NOW);
  const second = migrateDailyLoopV1ToWorkspaceV2(storage, WORKSPACE_LATER);

  assert.ok(first.payload);
  assert.ok(second.payload);
  assert.deepEqual(workspaceEntityIds(second.payload), workspaceEntityIds(first.payload));
  assert.deepEqual(
    workspaceCollectionLengths(second.payload),
    workspaceCollectionLengths(first.payload),
  );
});

// Production break caught: recovery overwrites malformed workspace before preserving it.
test("malformed workspace root is backed up before recovery", () => {
  const malformedWorkspaceRaw = '{"version":2,"learningSpaces":[';
  const storage = memoryStorage({
    [WORKSPACE_V2_KEY]: malformedWorkspaceRaw,
    [V2_MIGRATED_KEY]: intermediateRaw,
  });

  const result = migrateDailyLoopV1ToWorkspaceV2(storage, WORKSPACE_NOW);
  assert.ok(result.payload);
  assert.equal(storage.getItem(WORKSPACE_V2_CORRUPT_BACKUP_KEY), malformedWorkspaceRaw);
  assert.deepEqual(result.payload.tasks.map((task) => task.id), ["intermediate-task-fixed"]);

  const backupWriteIndex = storage.writes.findIndex(
    (write) => write.key === WORKSPACE_V2_CORRUPT_BACKUP_KEY,
  );
  const recoveredWorkspaceWriteIndex = storage.writes.findIndex(
    (write) => write.key === WORKSPACE_V2_KEY,
  );
  assert.notEqual(backupWriteIndex, -1);
  assert.notEqual(recoveredWorkspaceWriteIndex, -1);
  assert.ok(
    backupWriteIndex < recoveredWorkspaceWriteIndex,
    "corrupt backup must be written before the recovered workspace",
  );
});

// Production break caught: malformed V1 is evaluated before a valid workspace.
test("malformed V1 data cannot overwrite a valid workspace root", () => {
  const existingWorkspace = existingWorkspaceFixture();
  const existingWorkspaceRaw = JSON.stringify(existingWorkspace);
  const storage = memoryStorage({
    [WORKSPACE_V2_KEY]: existingWorkspaceRaw,
    [V1_DAILY_LOOP_KEY]: JSON.stringify({ version: 1, goal: 123 }),
  });

  const result = migrateDailyLoopV1ToWorkspaceV2(storage, WORKSPACE_NOW);
  assert.deepEqual(result.payload, existingWorkspace);
  assert.equal(storage.getItem(WORKSPACE_V2_KEY), existingWorkspaceRaw);
  assert.equal(storage.getItem(V1_DAILY_LOOP_BACKUP_KEY), null);
  assert.equal(storage.getItem(WORKSPACE_V2_CORRUPT_BACKUP_KEY), null);
  assert.equal(storage.writes.some((write) => write.key === WORKSPACE_V2_KEY), false);
});

// Production break caught: lower-precedence sources replace valid workspace.
test("source precedence selects a valid workspace before intermediate and V1 sources", () => {
  const existingWorkspace = existingWorkspaceFixture();
  const existingWorkspaceRaw = JSON.stringify(existingWorkspace);
  const storage = memoryStorage({
    [WORKSPACE_V2_KEY]: existingWorkspaceRaw,
    [V2_MIGRATED_KEY]: intermediateRaw,
    [V1_DAILY_LOOP_KEY]: workspaceV1Raw,
  });

  const result = migrateDailyLoopV1ToWorkspaceV2(storage, WORKSPACE_NOW);
  assert.deepEqual(result.payload, existingWorkspace);
  assert.equal(storage.getItem(WORKSPACE_V2_KEY), existingWorkspaceRaw);
  assert.equal(storage.getItem(V2_MIGRATED_KEY), intermediateRaw);
  assert.equal(storage.getItem(V1_DAILY_LOOP_BACKUP_KEY), null);
});

// Production break caught: V1 is selected even when intermediate is valid.
test("source precedence selects a valid intermediate snapshot before V1", () => {
  const storage = memoryStorage({
    [V2_MIGRATED_KEY]: intermediateRaw,
    [V1_DAILY_LOOP_KEY]: workspaceV1Raw,
  });

  const result = migrateDailyLoopV1ToWorkspaceV2(storage, WORKSPACE_NOW);
  assert.ok(result.payload);
  assert.deepEqual(result.payload.tasks.map((task) => task.id), ["intermediate-task-fixed"]);
  assert.equal(
    result.payload.tasks.some((task) => task.id === "legacy-task-fixed"),
    false,
  );
  assert.equal(storage.getItem(V1_DAILY_LOOP_BACKUP_KEY), null);
});

// Production break caught: malformed V1 stops precedence before the empty-root fallback.
test("malformed V1 falls back to an empty V2 workspace", () => {
  const storage = memoryStorage({
    [V1_DAILY_LOOP_KEY]: JSON.stringify({ version: 1, goal: 123 }),
  });
  const result = migrateDailyLoopV1ToWorkspaceV2(storage, WORKSPACE_NOW);
  const expectedWorkspace = {
    version: 2,
    learningSpaces: [],
    plans: [],
    tasks: [],
    reviews: [],
    events: [],
    updatedAt: WORKSPACE_NOW,
  };

  assert.deepEqual(
    {
      payload: result.payload,
      storedWorkspace: storage.getItem(WORKSPACE_V2_KEY),
    },
    {
      payload: expectedWorkspace,
      storedWorkspace: JSON.stringify(expectedWorkspace),
    },
  );
  assert.equal(storage.getItem(V1_DAILY_LOOP_BACKUP_KEY), null);
  assert.equal(storage.getItem(V2_MIGRATED_KEY), null);
});

// Production break caught: no-source path returns null or legacy schema.
test("source precedence falls back to an empty V2 workspace", () => {
  const storage = memoryStorage();
  const result = migrateDailyLoopV1ToWorkspaceV2(storage, WORKSPACE_NOW);

  assert.deepEqual(result.payload, {
    version: 2,
    learningSpaces: [],
    plans: [],
    tasks: [],
    reviews: [],
    events: [],
    updatedAt: WORKSPACE_NOW,
  });
  assert.equal(storage.getItem(WORKSPACE_V2_KEY), JSON.stringify(result.payload));
  assert.equal(storage.getItem(V1_DAILY_LOOP_BACKUP_KEY), null);
  assert.equal(storage.getItem(V2_MIGRATED_KEY), null);
});

// Production break caught: one malformed collection makes a recoverable
// workspace lose precedence and allows an older intermediate or V1 source to win.
test("recoverable workspace corruption is normalized before lower-precedence sources", () => {
  const recoverableWorkspace = {
    ...existingWorkspaceFixture(),
    tasks: [
      {
        id: "recoverable-workspace-task",
        ownerModuleId: "learning",
        ownerEntityId: "existing-workspace-space",
        title: "Keep the valid workspace task",
        description: "",
        durationMinutes: 25,
        scheduledDate: "2026-08-09",
        status: "planned",
        dueAt: null,
        completedAt: null,
        createdAt: "2026-08-09T08:00:00Z",
        updatedAt: "2026-08-09T08:00:00Z",
      },
    ],
    reviews: null,
  };
  const recoverableWorkspaceRaw = JSON.stringify(recoverableWorkspace);
  const expectedWorkspace = { ...recoverableWorkspace, reviews: [] };
  const storage = memoryStorage({
    [WORKSPACE_V2_KEY]: recoverableWorkspaceRaw,
    [V2_MIGRATED_KEY]: intermediateRaw,
    [V1_DAILY_LOOP_KEY]: workspaceV1Raw,
  });

  const result = migrateDailyLoopV1ToWorkspaceV2(storage, WORKSPACE_NOW);

  assert.equal(storage.getItem(WORKSPACE_V2_CORRUPT_BACKUP_KEY), recoverableWorkspaceRaw);
  assert.deepEqual(result.payload, expectedWorkspace);
  assert.equal(storage.getItem(WORKSPACE_V2_KEY), JSON.stringify(expectedWorkspace));
  assert.deepEqual(result.payload.learningSpaces, recoverableWorkspace.learningSpaces);
  assert.deepEqual(result.payload.tasks, recoverableWorkspace.tasks);
  assert.equal(storage.getItem(V2_MIGRATED_KEY), intermediateRaw);
  assert.equal(storage.getItem(V1_DAILY_LOOP_BACKUP_KEY), null);
});

const duplicateAndInvalidV1Raw = JSON.stringify({
  version: 1,
  activeDate: "2026-08-04",
  goal: "Normalize migrated tasks",
  availableMinutes: 60,
  tasks: [
    {
      id: "duplicate-task",
      title: "First valid duplicate",
      durationMinutes: 20,
      completedAt: null,
      createdAt: "2026-08-03T08:00:00Z",
    },
    {
      id: "duplicate-task",
      title: "Second duplicate",
      durationMinutes: 25,
      completedAt: null,
      createdAt: "2026-08-03T09:00:00Z",
    },
    {
      id: "nested-invalid-task",
      title: "Invalid completion timestamp",
      durationMinutes: 10,
      completedAt: "not-an-iso-timestamp",
      createdAt: "2026-08-03T10:00:00Z",
    },
    {
      id: "unique-task",
      title: "Keep the unique task",
      durationMinutes: 15,
      completedAt: null,
      createdAt: "2026-08-03T11:00:00Z",
    },
  ],
  review: null,
});

// Production break caught: V1 tasks bypass workspace normalization, retaining
// duplicate IDs or nested-invalid timestamps and leaving stale daily plan task IDs.
test("V1 task migration normalizes records before building daily plan task IDs", () => {
  const storage = memoryStorage({ [V1_DAILY_LOOP_KEY]: duplicateAndInvalidV1Raw });

  const result = migrateDailyLoopV1ToWorkspaceV2(storage, WORKSPACE_NOW);
  const normalizedTaskIds = ["duplicate-task", "unique-task"];
  const dailyPlan = result.payload.plans.find(
    (plan) => plan.id === "learning-plan-v1-daily-2026-08-04",
  );

  assert.deepEqual(result.payload.tasks.map((task) => task.id), normalizedTaskIds);
  assert.equal(result.payload.tasks[0].title, "First valid duplicate");
  assert.ok(dailyPlan);
  const activeDailyPlanVersion = dailyPlan.versions.find(
    (version) => version.version === dailyPlan.activeVersion,
  );
  assert.ok(activeDailyPlanVersion);
  assert.deepEqual(activeDailyPlanVersion.data.taskIds, normalizedTaskIds);
  assert.equal(storage.getItem(WORKSPACE_V2_KEY), JSON.stringify(result.payload));
});

// Production break caught: the first V1 conversion writes a workspace that the
// bridge rejects as corrupt on its own next run, regenerating or dropping entities.
test("normalized V1 workspace remains valid and stable on a repeated migration", () => {
  const storage = memoryStorage({ [V1_DAILY_LOOP_KEY]: duplicateAndInvalidV1Raw });

  const first = migrateDailyLoopV1ToWorkspaceV2(storage, WORKSPACE_NOW);
  const second = migrateDailyLoopV1ToWorkspaceV2(storage, WORKSPACE_LATER);

  assert.equal(storage.getItem(WORKSPACE_V2_CORRUPT_BACKUP_KEY), null);
  assert.deepEqual(workspaceEntityIds(second.payload), workspaceEntityIds(first.payload));
  assert.deepEqual(
    workspaceCollectionLengths(second.payload),
    workspaceCollectionLengths(first.payload),
  );
  assert.equal(storage.getItem(WORKSPACE_V2_KEY), JSON.stringify(first.payload));
});

// Production break caught: a stale corrupt-workspace backup is retained instead
// of being refreshed with the exact bytes from the workspace currently recovered.
test("new corrupt workspace refreshes an existing backup before recovery writes", () => {
  const currentCorruptRaw = '{"version":2,"learningSpaces":[';
  const olderCorruptRaw = '{"version":2,"olderCorruption":true}';
  const storage = memoryStorage({
    [WORKSPACE_V2_KEY]: currentCorruptRaw,
    [WORKSPACE_V2_CORRUPT_BACKUP_KEY]: olderCorruptRaw,
    [V2_MIGRATED_KEY]: intermediateRaw,
  });

  const result = migrateDailyLoopV1ToWorkspaceV2(storage, WORKSPACE_NOW);

  assert.ok(result.payload);
  assert.equal(storage.getItem(WORKSPACE_V2_CORRUPT_BACKUP_KEY), currentCorruptRaw);
  const backupWriteIndex = storage.writes.findIndex(
    (write) => write.key === WORKSPACE_V2_CORRUPT_BACKUP_KEY,
  );
  const recoveredWorkspaceWriteIndex = storage.writes.findIndex(
    (write) => write.key === WORKSPACE_V2_KEY,
  );
  assert.notEqual(backupWriteIndex, -1);
  assert.notEqual(recoveredWorkspaceWriteIndex, -1);
  assert.ok(backupWriteIndex < recoveredWorkspaceWriteIndex);
});

// Production break caught: the compatibility wrapper validates stale malformed
// V1 after the authoritative workspace wins and downgrades an applied migration.
test("compatibility migration preserves an authoritative workspace despite malformed stale V1", () => {
  const authoritativeWorkspace = existingWorkspaceFixture();
  const authoritativeWorkspaceRaw = JSON.stringify(authoritativeWorkspace);
  const malformedV1Raw = JSON.stringify({ version: 1, goal: 123 });
  const storage = memoryStorage({
    [WORKSPACE_V2_KEY]: authoritativeWorkspaceRaw,
    [V1_DAILY_LOOP_KEY]: malformedV1Raw,
  });

  const result = migrateDailyLoopV1ToV2(storage, WORKSPACE_NOW);

  assert.equal(result.record.status, "applied");
  assert.equal(result.record.error, null);
  assert.equal(result.payload, null);
  assert.equal(storage.getItem(WORKSPACE_V2_KEY), authoritativeWorkspaceRaw);
  assert.equal(storage.getItem(V1_DAILY_LOOP_BACKUP_KEY), null);
  assert.equal(storage.getItem(V2_MIGRATED_KEY), null);
  assert.equal(storage.writes.some((write) => write.key === WORKSPACE_V2_KEY), false);
  assert.deepEqual(JSON.parse(storage.getItem(MIGRATION_LOG_KEY)), [result.record]);
});

// Production break caught: a valid empty workspace created by the no-source path
// changes the stable migration record from skipped to applied on the second run.
test("no-source workspace migration stays skipped with one stable record", () => {
  const storage = memoryStorage();

  const first = migrateDailyLoopV1ToWorkspaceV2(storage, WORKSPACE_NOW);
  const second = migrateDailyLoopV1ToWorkspaceV2(storage, WORKSPACE_LATER);
  const log = JSON.parse(storage.getItem(MIGRATION_LOG_KEY));

  assert.equal(first.record.status, "skipped");
  assert.equal(second.record.status, "skipped");
  assert.deepEqual(second.record, first.record);
  assert.deepEqual(second.payload, first.payload);
  assert.equal(log.length, 1);
  assert.deepEqual(log[0], first.record);
  assert.equal(storage.getItem(WORKSPACE_V2_KEY), JSON.stringify(first.payload));
  assert.equal(storage.getItem(V1_DAILY_LOOP_BACKUP_KEY), null);
  assert.equal(storage.getItem(V2_MIGRATED_KEY), null);
});

// Production break caught: a parseable V2 shell with no usable collections is
// promoted to an authoritative empty workspace instead of yielding to recovery.
test("all-unusable workspace collections fall through to a valid intermediate snapshot", () => {
  const unusableWorkspaceRaw = JSON.stringify({
    version: 2,
    learningSpaces: null,
    plans: {},
    tasks: "invalid",
    reviews: 0,
    events: false,
    updatedAt: "2026-08-10T08:00:00Z",
  });
  const storage = memoryStorage({
    [WORKSPACE_V2_KEY]: unusableWorkspaceRaw,
    [V2_MIGRATED_KEY]: intermediateRaw,
  });

  const result = migrateDailyLoopV1ToWorkspaceV2(storage, WORKSPACE_NOW);

  assert.equal(storage.getItem(WORKSPACE_V2_CORRUPT_BACKUP_KEY), unusableWorkspaceRaw);
  assert.ok(result.payload);
  assert.deepEqual(result.payload.tasks.map((task) => task.id), [
    "intermediate-task-fixed",
  ]);
  assert.deepEqual(result.payload.reviews.map((review) => review.id), [
    "intermediate-review-fixed",
  ]);
  assert.equal(storage.getItem(V2_MIGRATED_KEY), intermediateRaw);
  assert.equal(storage.getItem(WORKSPACE_V2_KEY), JSON.stringify(result.payload));
});

// Production break caught: the compatibility wrapper treats malformed stale V1
// as authoritative after a skipped empty workspace was already established.
test("pre-existing skipped empty workspace remains authoritative over later malformed V1", () => {
  const storage = memoryStorage();
  const first = migrateDailyLoopV1ToWorkspaceV2(storage, WORKSPACE_NOW);
  const emptyWorkspaceRaw = storage.getItem(WORKSPACE_V2_KEY);
  const malformedV1Raw = JSON.stringify({ version: 1, goal: 123 });
  storage.setItem(V1_DAILY_LOOP_KEY, malformedV1Raw);

  const second = migrateDailyLoopV1ToV2(storage, WORKSPACE_LATER);
  const log = JSON.parse(storage.getItem(MIGRATION_LOG_KEY));

  assert.equal(first.record.status, "skipped");
  assert.equal(second.record.status, "skipped");
  assert.deepEqual(second.record, first.record);
  assert.equal(second.payload, null);
  assert.equal(storage.getItem(WORKSPACE_V2_KEY), emptyWorkspaceRaw);
  assert.equal(storage.getItem(V1_DAILY_LOOP_BACKUP_KEY), null);
  assert.equal(storage.getItem(V2_MIGRATED_KEY), null);
  assert.deepEqual(log, [first.record]);
});
