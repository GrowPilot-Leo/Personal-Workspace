import test from "node:test";
import assert from "node:assert/strict";
import {
  MIGRATION_LOG_KEY,
  V1_DAILY_LOOP_BACKUP_KEY,
  V1_DAILY_LOOP_KEY,
  V2_MIGRATED_KEY,
  migrateDailyLoopV1ToV2,
} from "./migrations.ts";

function memoryStorage(seed = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
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
  assert.equal(done.status, "done");
  assert.equal(done.completedAt, "2026-08-03T01:00:00Z");
  const todo = result.payload.tasks.find((t) => t.id === "t2");
  assert.equal(todo.status, "planned");

  assert.equal(result.payload.reviews.length, 1);
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
