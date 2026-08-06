import test from "node:test";
import assert from "node:assert/strict";
import {
  activePlanData,
  applyRevision,
  createPlan,
  proposeRevision,
} from "./plans.ts";
import { createGoal } from "./goals.ts";
import { createTask, completeTask, isTaskDone } from "./tasks.ts";
import { createReview, updateReview } from "./reviews.ts";
import { createEventBus } from "./events.ts";
import { createFeatureFlagStore } from "./flags.ts";

test("plan revision flow: proposal stays pending until approved", () => {
  const plan = createPlan({
    ownerModuleId: "learning",
    horizon: "weekly",
    data: { title: "每周计划", tasks: [] },
  });

  const proposal = proposeRevision(plan, {
    reason: "新增知识点",
    after: { title: "每周计划", tasks: [{ id: "t1", title: "新任务" }] },
  });

  assert.equal(proposal.status, "pending");
  assert.equal(proposal.before.tasks.length, 0);
  assert.equal(proposal.after.tasks.length, 1);

  // pending proposal must not touch the active plan
  assert.equal(activePlanData(plan).tasks.length, 0);
});

test("accepted revision creates a new version; rejected leaves the plan untouched", () => {
  const plan = createPlan({
    ownerModuleId: "learning",
    horizon: "weekly",
    data: { title: "每周计划", tasks: [] },
  });
  const proposal = proposeRevision(plan, {
    reason: "知识更新",
    after: { title: "每周计划", tasks: [{ id: "t1", title: "新任务" }] },
  });

  const accepted = applyRevision(plan, proposal, "accepted");
  assert.equal(accepted.plan.activeVersion, 2);
  assert.equal(activePlanData(accepted.plan).tasks.length, 1);
  assert.equal(accepted.proposal.status, "accepted");
  assert.ok(accepted.proposal.decidedAt);

  // rejected revision on a fresh plan leaves version 1 active
  const plan2 = createPlan({
    ownerModuleId: "learning",
    horizon: "daily",
    data: { title: "A", tasks: [] },
  });
  const proposal2 = proposeRevision(plan2, {
    reason: "不相关",
    after: { title: "B", tasks: [{ id: "x", title: "x" }] },
  });
  const rejected = applyRevision(plan2, proposal2, "rejected");
  assert.equal(rejected.plan.activeVersion, 1);
  assert.equal(activePlanData(rejected.plan).title, "A");
  assert.equal(rejected.proposal.status, "rejected");
});

test("goals, tasks and reviews create and update with stable identity", () => {
  const goal = createGoal({ title: "掌握 RAG" });
  assert.equal(goal.status, "draft");

  const task = createTask({ title: "阅读论文", durationMinutes: 30 });
  assert.equal(task.status, "planned");
  assert.equal(isTaskDone(task), false);

  const done = completeTask(task, "2026-08-06T01:00:00Z");
  assert.equal(isTaskDone(done), true);
  assert.equal(done.completedAt, "2026-08-06T01:00:00Z");

  const review = createReview({
    ownerModuleId: "daily-loop",
    horizon: "daily",
    periodKey: "2026-08-06",
    wins: "完成一章",
  });
  const updated = updateReview(review, { blockers: "时间紧张" });
  assert.equal(updated.wins, "完成一章");
  assert.equal(updated.blockers, "时间紧张");
});

test("typed event bus routes events only to matching subscribers", () => {
  const bus = createEventBus();
  const received = [];
  const unsubscribe = bus.subscribe("learning.task.completed", (event) => {
    received.push(event);
  });
  bus.subscribe("plan.revision.confirmed", () => {
    received.push("wrong-channel");
  });

  bus.publish({
    eventId: "e1",
    eventType: "learning.task.completed",
    moduleId: "learning",
    entityId: "task-1",
    schemaVersion: 1,
    occurredAt: "2026-08-06T00:00:00Z",
    payload: { taskId: "task-1" },
  });

  assert.equal(received.length, 1);
  assert.equal(received[0].payload.taskId, "task-1");

  unsubscribe();
  bus.publish({
    eventId: "e2",
    eventType: "learning.task.completed",
    moduleId: "learning",
    entityId: "task-2",
    schemaVersion: 1,
    occurredAt: "2026-08-06T00:00:00Z",
    payload: {},
  });
  assert.equal(received.length, 1, "unsubscribed handler must not fire");
});

test("feature flags default off except v2Navigation and can be toggled", () => {
  const store = createFeatureFlagStore();
  assert.equal(store.isEnabled("v2Navigation"), true);
  assert.equal(store.isEnabled("dynamicLearningSpaces"), false);
  assert.equal(store.isEnabled("fitnessVisionAnalysis"), false);

  store.set("dynamicLearningSpaces", true);
  assert.equal(store.isEnabled("dynamicLearningSpaces"), true);
});
