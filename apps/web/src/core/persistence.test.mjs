import test from "node:test";
import assert from "node:assert/strict";
import { createEmptyDailyLoopState } from "./daily-loop.ts";
import {
  MIGRATION_LOG_KEY,
  V1_DAILY_LOOP_KEY,
  V2_MIGRATED_KEY,
  WORKSPACE_V2_CORRUPT_BACKUP_KEY,
  WORKSPACE_V2_KEY,
} from "./migrations.ts";
import { createWorkspaceRepository } from "./persistence.ts";

function memoryStorage(seed = {}) {
  const data = new Map(Object.entries(seed));
  const writes = [];
  return {
    writes,
    getItem(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      writes.push({ key, value });
      data.set(key, value);
    },
  };
}

const FIXED_NOW = "2026-08-06T08:00:00Z";

const v1Fixture = JSON.stringify({
  version: 1,
  activeDate: "2026-08-06",
  goal: "建立数据边界",
  availableMinutes: 60,
  tasks: [
    {
      id: "v1-task-fixed",
      title: "验证仓储边界",
      durationMinutes: 30,
      completedAt: null,
      createdAt: FIXED_NOW,
    },
  ],
  review: null,
});

function learningSpace(overrides = {}) {
  return {
    id: "learning-space-fixed",
    name: "RAG 基础",
    goal: "完成可靠检索原型",
    status: "active",
    templateId: "blank",
    currentMonthlyPlanId: null,
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
    ...overrides,
  };
}

function learningTask(overrides = {}) {
  return {
    id: "task-fixed",
    ownerModuleId: "learning",
    ownerEntityId: "learning-space-fixed",
    title: "整理检索笔记",
    description: "",
    durationMinutes: 30,
    scheduledDate: "2026-08-06",
    status: "planned",
    dueAt: null,
    completedAt: null,
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
    ...overrides,
  };
}

function workspaceFixture(overrides = {}) {
  return {
    version: 2,
    learningSpaces: [learningSpace()],
    plans: [],
    tasks: [learningTask()],
    reviews: [],
    events: [],
    updatedAt: FIXED_NOW,
    ...overrides,
  };
}

// Mutation caught: loadWorkspace bypasses migration or returns the legacy editing model.
test("loadWorkspace runs migration and returns normalized Workspace V2", () => {
  const storage = memoryStorage({ [V1_DAILY_LOOP_KEY]: v1Fixture });
  const repository = createWorkspaceRepository(storage);

  const state = repository.loadWorkspace();

  assert.equal(state.version, 2);
  assert.deepEqual(state.learningSpaces.map(({ id }) => id), [
    "learning-space-v1-daily-loop",
  ]);
  assert.deepEqual(state.tasks.map(({ id }) => id), ["v1-task-fixed"]);
  assert.equal(state.tasks[0].ownerModuleId, "learning");
  assert.equal(state.tasks[0].scheduledDate, "2026-08-06");
  assert.equal(repository.lastMigration()?.status, "applied");
});

// Mutation caught: saveWorkspace stores untrusted fields, malformed collections, or duplicate records.
test("saveWorkspace persists only normalized Workspace V2 data", () => {
  const storage = memoryStorage();
  const repository = createWorkspaceRepository(storage);

  repository.saveWorkspace(
    workspaceFixture({
      plans: "invalid collection",
      tasks: [
        learningTask({ title: "保留首条任务" }),
        learningTask({ title: "丢弃重复任务" }),
      ],
      futureCollection: [{ id: "not-stage-3" }],
    }),
  );

  const stored = JSON.parse(storage.getItem(WORKSPACE_V2_KEY));
  assert.deepEqual(Object.keys(stored).sort(), [
    "events",
    "learningSpaces",
    "plans",
    "reviews",
    "tasks",
    "updatedAt",
    "version",
  ]);
  assert.deepEqual(stored.plans, []);
  assert.deepEqual(stored.tasks.map(({ id, title }) => ({ id, title })), [
    { id: "task-fixed", title: "保留首条任务" },
  ]);
  assert.equal(storage.getItem(V1_DAILY_LOOP_KEY), null);
});

// Mutation caught: fallback overwrites corrupt Workspace V2 before preserving its exact bytes.
test("loadWorkspace backs up corrupt V2 JSON before falling back", () => {
  const corruptWorkspace = '{"version":2,"learningSpaces":[';
  const storage = memoryStorage({
    [WORKSPACE_V2_KEY]: corruptWorkspace,
    [V1_DAILY_LOOP_KEY]: v1Fixture,
  });
  const repository = createWorkspaceRepository(storage);

  const state = repository.loadWorkspace();

  assert.equal(state.version, 2);
  assert.equal(storage.getItem(WORKSPACE_V2_CORRUPT_BACKUP_KEY), corruptWorkspace);
  const backupWrite = storage.writes.findIndex(
    ({ key }) => key === WORKSPACE_V2_CORRUPT_BACKUP_KEY,
  );
  const recoveryWrite = storage.writes.findIndex(
    ({ key }) => key === WORKSPACE_V2_KEY,
  );
  assert.ok(backupWrite >= 0);
  assert.ok(recoveryWrite > backupWrite);
});

// Mutation caught: normalization of one invalid collection clears valid unrelated collections.
test("loadWorkspace preserves valid collections when one collection is invalid", () => {
  const storage = memoryStorage({
    [WORKSPACE_V2_KEY]: JSON.stringify(
      workspaceFixture({ plans: null, reviews: "invalid collection" }),
    ),
  });
  const repository = createWorkspaceRepository(storage);

  const state = repository.loadWorkspace();

  assert.deepEqual(state.learningSpaces, [learningSpace()]);
  assert.deepEqual(state.tasks, [learningTask()]);
  assert.deepEqual(state.plans, []);
  assert.deepEqual(state.reviews, []);
});

// Mutation caught: repeated migration or normalization appends duplicate entities or regenerates IDs.
test("repeated loadWorkspace calls preserve entity IDs and collection lengths", () => {
  const storage = memoryStorage({ [V1_DAILY_LOOP_KEY]: v1Fixture });
  const repository = createWorkspaceRepository(storage);

  const first = repository.loadWorkspace();
  const second = repository.loadWorkspace();

  for (const [collection, idKey] of [
    ["learningSpaces", "id"],
    ["plans", "id"],
    ["tasks", "id"],
    ["reviews", "id"],
    ["events", "eventId"],
  ]) {
    assert.deepEqual(
      second[collection].map((record) => record[idKey]),
      first[collection].map((record) => record[idKey]),
    );
  }
});

// Mutation caught: repository takes ownership of learning export or deletion behavior.
test("repository exposes no learning-specific export or delete API", () => {
  const repository = createWorkspaceRepository(memoryStorage());
  const forbidden = Object.keys(repository).filter(
    (name) => /learning/i.test(name) && /(export|delete|remove)/i.test(name),
  );

  assert.deepEqual(forbidden, []);
});

// Mutation caught: a legacy save writes through to or replaces the authoritative Workspace V2 root.
test("legacy adapters remain callable without overwriting Workspace V2 source of truth", () => {
  const rawWorkspace = JSON.stringify(workspaceFixture());
  const storage = memoryStorage({
    [WORKSPACE_V2_KEY]: rawWorkspace,
    [V1_DAILY_LOOP_KEY]: v1Fixture,
  });
  const repository = createWorkspaceRepository(storage);

  assert.equal(typeof repository.loadDailyLoop, "function");
  assert.equal(typeof repository.saveDailyLoop, "function");
  const legacy = repository.loadDailyLoop();
  repository.saveDailyLoop({ ...legacy, goal: "仅修改回滚适配器" });

  assert.equal(storage.getItem(WORKSPACE_V2_KEY), rawWorkspace);
  assert.equal(repository.loadWorkspace().learningSpaces[0].name, "RAG 基础");
  assert.equal(repository.loadDailyLoop().goal, "仅修改回滚适配器");
});

test("repository runs migration at the read boundary and returns the V1 editing model", () => {
  const storage = memoryStorage({ [V1_DAILY_LOOP_KEY]: v1Fixture });
  const repository = createWorkspaceRepository(storage);

  const state = repository.loadDailyLoop();

  assert.equal(state.goal, "建立数据边界");
  assert.equal(repository.lastMigration()?.status, "applied");
  assert.ok(storage.getItem(V2_MIGRATED_KEY));
  assert.ok(storage.getItem(MIGRATION_LOG_KEY));
});

test("repository save is the only persistence call required by the legacy page", () => {
  const storage = memoryStorage();
  const repository = createWorkspaceRepository(storage);
  const state = createEmptyDailyLoopState("2026-08-06");

  repository.saveDailyLoop({ ...state, goal: "通过 V3 门禁" });

  const stored = JSON.parse(storage.getItem(V1_DAILY_LOOP_KEY));
  assert.equal(stored.goal, "通过 V3 门禁");
});

test("corrupt V1 data falls back to a usable empty legacy state", () => {
  const storage = memoryStorage({ [V1_DAILY_LOOP_KEY]: "{broken" });
  const repository = createWorkspaceRepository(storage);

  const state = repository.loadDailyLoop();

  assert.equal(state.tasks.length, 0);
  assert.equal(state.goal, "");
  assert.equal(repository.lastMigration()?.status, "failed");
});

