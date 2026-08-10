import test from "node:test";
import assert from "node:assert/strict";
import { createEmptyDailyLoopState } from "@/core/daily-loop";
import {
  MIGRATION_LOG_KEY,
  V1_DAILY_LOOP_KEY,
  V2_MIGRATED_KEY,
} from "@/core/migrations";
import { createWorkspaceRepository } from "./persistence.ts";

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
  activeDate: "2026-08-06",
  goal: "建立数据边界",
  availableMinutes: 60,
  tasks: [],
  review: null,
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

test("repository save is the only persistence call required by the page", () => {
  const storage = memoryStorage();
  const repository = createWorkspaceRepository(storage);
  const state = createEmptyDailyLoopState("2026-08-06");

  repository.saveDailyLoop({ ...state, goal: "通过 V3 门禁" });

  const stored = JSON.parse(storage.getItem(V1_DAILY_LOOP_KEY));
  assert.equal(stored.goal, "通过 V3 门禁");
});

test("corrupt V1 data falls back to a usable empty state", () => {
  const storage = memoryStorage({ [V1_DAILY_LOOP_KEY]: "{broken" });
  const repository = createWorkspaceRepository(storage);

  const state = repository.loadDailyLoop();

  assert.equal(state.tasks.length, 0);
  assert.equal(state.goal, "");
  assert.equal(repository.lastMigration()?.status, "failed");
});
