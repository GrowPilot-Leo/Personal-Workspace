import test from "node:test";
import assert from "node:assert/strict";
import { advanceBadgeProgress } from "./badge/public.ts";
import { aggregateTodayItems } from "./today/public.ts";
import {
  buildDailyReviewSummary,
  isReviewDue,
  rollWorkspaceForward,
  saveWorkspaceReview,
} from "./review/public.ts";
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
        { id: "c1", sourceModule: "career", sourceEntityId: "role-1", sourceLabel: "职业", title: "职位任务", durationMinutes: 20, dueAt: "2026-08-06T15:00:00Z", status: "active" },
      ],
    },
    {
      moduleId: "learning",
      items: [
        { id: "l1", sourceModule: "learning", sourceEntityId: "space-1", sourceLabel: "学习", title: "学习任务", durationMinutes: 30, dueAt: "2026-08-06T09:00:00Z", status: "planned" },
        { id: "l2", sourceModule: "learning", sourceEntityId: "space-1", sourceLabel: "学习", title: "无截止任务", durationMinutes: 15, status: "planned" },
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

test("review: only a workspace-owned daily review satisfies the period", () => {
  assert.equal(isReviewDue([], "2026-08-06"), true);
  assert.equal(
    isReviewDue(
      [{ id: "r1", ownerModuleId: "learning", ownerEntityId: "learning-space-1", horizon: "daily", periodKey: "2026-08-06", wins: "ok", blockers: "", adjustment: "" }],
      "2026-08-06",
    ),
    true,
  );
  assert.equal(
    isReviewDue(
      [{ id: "r2", ownerModuleId: "workspace", ownerEntityId: null, horizon: "daily", periodKey: "2026-08-06", wins: "ok", blockers: "", adjustment: "" }],
      "2026-08-06",
    ),
    false,
  );
});
function reviewWorkspace() {
  const createdAt = "2026-08-14T08:00:00.000Z";
  const space = (id, status) => ({
    id,
    name: id,
    goal: "",
    status,
    templateId: "blank",
    currentMonthlyPlanId: null,
    createdAt,
    updatedAt: createdAt,
  });
  const task = (
    id,
    ownerModuleId,
    ownerEntityId,
    status = "planned",
    scheduledDate = "2026-08-14",
    durationMinutes = 25,
  ) => ({
    id,
    ownerModuleId,
    ownerEntityId,
    title: id,
    description: "",
    durationMinutes,
    scheduledDate,
    status,
    dueAt: null,
    completedAt: status === "done" ? "2026-08-14T09:00:00.000Z" : null,
    createdAt,
    updatedAt: createdAt,
  });
  return {
    version: 2,
    learningSpaces: [
      space("active-space", "active"),
      space("planned-space", "planned"),
      space("paused-space", "paused"),
      space("archived-space", "archived"),
      space("completed-space", "completed"),
      space("draft-space", "draft"),
    ],
    plans: [{ id: "learning-plan-sentinel" }],
    tasks: [
      task("active-task", "learning", "active-space", "active", "2026-08-14", 30),
      task("planned-task", "learning", "planned-space", "planned", "2026-08-14", 20),
      task("done-task", "learning", "active-space", "done", "2026-08-14", 40),
      task("paused-task", "learning", "paused-space"),
      task("archived-task", "learning", "archived-space"),
      task("completed-space-task", "learning", "completed-space"),
      task("draft-task", "learning", "draft-space"),
      task("career-task", "career", "active-space"),
      task("other-date-task", "learning", "active-space", "planned", "2026-08-13", 15),
    ],
    reviews: [],
    events: [],
    updatedAt: createdAt,
  };
}

test("review: daily summary derives counts and minutes from the requested date", () => {
  const summary = buildDailyReviewSummary(reviewWorkspace(), "2026-08-14");
  assert.deepEqual(summary, {
    date: "2026-08-14",
    planned: 8,
    completed: 1,
    plannedMinutes: 215,
    completedMinutes: 40,
  });
});

test("review: saving creates one workspace-owned daily review without editing plans", () => {
  const workspace = reviewWorkspace();
  const plansBefore = workspace.plans;
  const next = saveWorkspaceReview(
    workspace,
    {
      dateKey: "2026-08-14",
      wins: " 完成输出 ",
      blockers: "",
      adjustment: " 明天缩小范围 ",
    },
    "2026-08-14T12:00:00.000Z",
  );
  assert.equal(next.reviews.length, 1);
  assert.deepEqual(next.reviews[0], {
    id: next.reviews[0].id,
    ownerModuleId: "workspace",
    ownerEntityId: null,
    horizon: "daily",
    periodKey: "2026-08-14",
    wins: "完成输出",
    blockers: "",
    adjustment: "明天缩小范围",
    submittedAt: "2026-08-14T12:00:00.000Z",
    updatedAt: "2026-08-14T12:00:00.000Z",
  });
  assert.strictEqual(next.plans, plansBefore);
  assert.equal(workspace.reviews.length, 0);
});

test("review: re-saving the same workspace day updates instead of duplicating", () => {
  const first = saveWorkspaceReview(
    reviewWorkspace(),
    { dateKey: "2026-08-14", wins: "初稿", blockers: "", adjustment: "" },
    "2026-08-14T12:00:00.000Z",
  );
  const second = saveWorkspaceReview(
    first,
    { dateKey: "2026-08-14", wins: "修订", blockers: "新阻塞", adjustment: "" },
    "2026-08-14T13:00:00.000Z",
  );
  assert.equal(second.reviews.length, 1);
  assert.equal(second.reviews[0].id, first.reviews[0].id);
  assert.equal(second.reviews[0].submittedAt, first.reviews[0].submittedAt);
  assert.equal(second.reviews[0].updatedAt, "2026-08-14T13:00:00.000Z");
  assert.equal(second.reviews[0].wins, "修订");
});

test("review: rollover reschedules the same unfinished active and planned Learning tasks", () => {
  const workspace = reviewWorkspace();
  const next = rollWorkspaceForward(
    workspace,
    "2026-08-14",
    "2026-08-15",
    "2026-08-14T23:00:00.000Z",
  );
  for (const id of ["active-task", "planned-task"]) {
    const before = workspace.tasks.find((task) => task.id === id);
    const after = next.tasks.find((task) => task.id === id);
    assert.equal(after.id, before.id);
    assert.equal(after.scheduledDate, "2026-08-15");
    assert.equal(after.status, "planned");
    assert.equal(next.tasks.filter((task) => task.id === id).length, 1);
  }
});

test("review: rollover leaves completed, ineligible-space, non-Learning and other-date tasks in place", () => {
  const workspace = reviewWorkspace();
  const next = rollWorkspaceForward(
    workspace,
    "2026-08-14",
    "2026-08-15",
    "2026-08-14T23:00:00.000Z",
  );
  for (const id of [
    "done-task",
    "paused-task",
    "archived-task",
    "completed-space-task",
    "draft-task",
    "career-task",
    "other-date-task",
  ]) {
    assert.strictEqual(
      next.tasks.find((task) => task.id === id),
      workspace.tasks.find((task) => task.id === id),
    );
  }
});

test("review: rollover is idempotent and never edits Learning plans", () => {
  const workspace = reviewWorkspace();
  const first = rollWorkspaceForward(
    workspace,
    "2026-08-14",
    "2026-08-15",
    "2026-08-14T23:00:00.000Z",
  );
  const second = rollWorkspaceForward(
    first,
    "2026-08-14",
    "2026-08-15",
    "2026-08-15T00:00:00.000Z",
  );
  assert.strictEqual(first.plans, workspace.plans);
  assert.strictEqual(second, first);
  assert.equal(new Set(second.tasks.map((task) => task.id)).size, second.tasks.length);
});
