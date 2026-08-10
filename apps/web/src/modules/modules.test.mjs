import test from "node:test";
import assert from "node:assert/strict";
import { advanceBadgeProgress } from "./badge/public.ts";
import { aggregateTodayItems } from "./today/public.ts";
import { isReviewDue } from "./review/public.ts";
import { observationMayInfluencePlan } from "./fitness/public.ts";
import { readStoredTheme, writeStoredTheme } from "./settings/public.ts";
import { v2ModuleManifests } from "./v2-registry.ts";

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

test("v2 registry exposes exactly nine fixed modules", () => {
  const ids = v2ModuleManifests.map((m) => m.id).sort();
  assert.deepEqual(ids, [
    "badge",
    "career",
    "english",
    "fitness",
    "knowledge",
    "learning",
    "review",
    "settings",
    "today",
  ]);
});

test("badge: task evidence advances to active, output evidence to completed", () => {
  const base = {
    id: "b1",
    goal: "掌握 RAG",
    state: "planned",
    startedAt: null,
    completedAt: null,
    verifiedAt: null,
    evidence: [],
  };

  const afterTask = advanceBadgeProgress(base, {
    id: "e1",
    type: "task",
    title: "完成任务",
    sourceModuleId: "learning",
    recordedAt: "2026-08-06T00:00:00Z",
  });
  assert.equal(afterTask.state, "active");
  assert.equal(afterTask.completedAt, null);

  const afterOutput = advanceBadgeProgress(afterTask, {
    id: "e2",
    type: "output",
    title: "产出笔记",
    sourceModuleId: "learning",
    recordedAt: "2026-08-06T01:00:00Z",
  });
  assert.equal(afterOutput.state, "completed");
  assert.ok(afterOutput.completedAt);
});

test("badge: external verification promotes to verified with evidence marker", () => {
  const base = {
    id: "b2",
    goal: "通过评估",
    state: "completed",
    startedAt: "2026-08-01T00:00:00Z",
    completedAt: "2026-08-05T00:00:00Z",
    verifiedAt: null,
    evidence: [{ id: "e1", type: "assessment", title: "评估", sourceModuleId: "learning", recordedAt: "2026-08-05T00:00:00Z" }],
  };
  const verified = advanceBadgeProgress(base, {
    id: "e2",
    type: "external",
    title: "外部认证",
    sourceModuleId: "career",
    recordedAt: "2026-08-06T00:00:00Z",
  });
  assert.equal(verified.state, "verified");
  assert.ok(verified.verifiedAt);
  assert.equal(verified.evidence.length, 2);
});

test("today: aggregates and sorts module summaries by due time", () => {
  const items = aggregateTodayItems([
    {
      moduleId: "career",
      items: [
        { id: "c1", sourceModule: "career", title: "职位任务", dueAt: "2026-08-06T15:00:00Z", status: "active" },
      ],
    },
    {
      moduleId: "learning",
      items: [
        { id: "l1", sourceModule: "learning", title: "学习任务", dueAt: "2026-08-06T09:00:00Z", status: "planned" },
        { id: "l2", sourceModule: "learning", title: "无截止任务", status: "planned" },
      ],
    },
  ]);

  assert.equal(items.length, 3);
  assert.equal(items[0].id, "l1");
  assert.equal(items[1].id, "c1");
  assert.equal(items[2].id, "l2");
});

test("fitness: only confirmed or edited observations influence plans", () => {
  assert.equal(observationMayInfluencePlan({ original: "x", decision: "pending" }), false);
  assert.equal(observationMayInfluencePlan({ original: "x", decision: "rejected" }), false);
  assert.equal(observationMayInfluencePlan({ original: "x", decision: "confirmed" }), true);
  assert.equal(observationMayInfluencePlan({ original: "x", finalValue: "y", decision: "edited" }), true);
});

test("settings: theme preference persists and defaults to day", () => {
  const storage = memoryStorage();
  assert.equal(readStoredTheme(storage), "day");
  writeStoredTheme(storage, "dusk");
  assert.equal(readStoredTheme(storage), "dusk");
  const storage2 = memoryStorage({ "growpilot.theme.v1": "night" });
  assert.equal(readStoredTheme(storage2), "night");
});

test("review: daily review is due when no review exists for the period", () => {
  assert.equal(isReviewDue([], "2026-08-06"), true);
  assert.equal(
    isReviewDue(
      [{ id: "r1", ownerModuleId: "learning", ownerEntityId: "learning-space-1", horizon: "daily", periodKey: "2026-08-06", wins: "ok", blockers: "", adjustment: "" }],
      "2026-08-06",
    ),
    false,
  );
});
