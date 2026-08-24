import test from "node:test";
import assert from "node:assert/strict";
import {
  activePlanData,
  applyRevision,
  createPlan,
  proposeRevision,
} from "./plans.ts";
import * as plans from "./plans.ts";
import { createGoal } from "./goals.ts";
import { createTask, completeTask, isTaskDone } from "./tasks.ts";
import { createReview, updateReview } from "./reviews.ts";
import { createEventBus } from "./events.ts";
import * as events from "./events.ts";
import { createFeatureFlagStore } from "./flags.ts";

test("plan revision flow: proposal stays pending until approved", () => {
  const plan = createPlan({
    ownerModuleId: "learning",
    ownerEntityId: "learning-space-contract-1",
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
    ownerEntityId: "learning-space-contract-2",
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
    ownerEntityId: "learning-space-contract-3",
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

  const task = createTask({
    id: "task-contract-1",
    ownerModuleId: "learning",
    ownerEntityId: "learning-space-contract-4",
    title: "阅读论文",
    durationMinutes: 30,
    scheduledDate: "2026-08-06",
    now: "2026-08-06T00:00:00Z",
  });
  assert.equal(task.status, "planned");
  assert.equal(isTaskDone(task), false);

  const done = completeTask(task, "2026-08-06T01:00:00Z");
  assert.equal(isTaskDone(done), true);
  assert.equal(done.completedAt, "2026-08-06T01:00:00Z");

  const review = createReview({
    ownerModuleId: "daily-loop",
    ownerEntityId: "learning-space-v1-daily-loop",
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

test("createTask records explicit ownership and scheduled date", () => {
  const task = createTask({
    id: "task-owned-1",
    ownerModuleId: "learning",
    ownerEntityId: "learning-space-1",
    title: "Read retrieval notes",
    scheduledDate: "2026-08-10",
    now: "2026-08-10T08:00:00Z",
  });

  assert.deepEqual(task, {
    id: "task-owned-1",
    ownerModuleId: "learning",
    ownerEntityId: "learning-space-1",
    title: "Read retrieval notes",
    description: "",
    durationMinutes: 25,
    scheduledDate: "2026-08-10",
    priority: "medium",
    tags: [],
    subtasks: [],
    status: "planned",
    dueAt: null,
    completedAt: null,
    createdAt: "2026-08-10T08:00:00Z",
    updatedAt: "2026-08-10T08:00:00Z",
  });
});

test("completeTask preserves ownership and marks the task done", () => {
  const task = createTask({
    id: "task-owned-2",
    ownerModuleId: "career",
    ownerEntityId: "career-goal-1",
    title: "Update portfolio",
    scheduledDate: "2026-08-11",
    now: "2026-08-10T08:00:00Z",
  });

  const completed = completeTask(task, "2026-08-10T10:00:00Z");

  assert.equal(completed.ownerModuleId, "career");
  assert.equal(completed.ownerEntityId, "career-goal-1");
  assert.equal(completed.scheduledDate, "2026-08-11");
  assert.equal(completed.status, "done");
  assert.equal(completed.completedAt, "2026-08-10T10:00:00Z");
});

test("createPlan records its owning entity", () => {
  const plan = createPlan({
    id: "plan-owned-1",
    ownerModuleId: "english",
    ownerEntityId: "english-track-1",
    horizon: "weekly",
    data: { focus: "speaking" },
    now: "2026-08-10T08:00:00Z",
  });

  assert.equal(plan.id, "plan-owned-1");
  assert.equal(plan.ownerModuleId, "english");
  assert.equal(plan.ownerEntityId, "english-track-1");
  assert.equal(plan.versions[0].createdAt, "2026-08-10T08:00:00Z");
});

test("revisePlan appends an immutable version and advances activeVersion", () => {
  const plan = createPlan({
    id: "plan-owned-2",
    ownerModuleId: "learning",
    ownerEntityId: "learning-space-2",
    horizon: "daily",
    data: { tasks: ["read"] },
    now: "2026-08-10T08:00:00Z",
  });

  const revised = plans.revisePlan(
    plan,
    { tasks: ["read", "evaluate"] },
    "Add evaluation",
    "2026-08-10T09:00:00Z",
  );

  assert.deepEqual(plan.versions, [
    {
      version: 1,
      createdAt: "2026-08-10T08:00:00Z",
      reason: "initial",
      data: { tasks: ["read"] },
    },
  ]);
  assert.equal(plan.activeVersion, 1);
  assert.equal(revised.activeVersion, 2);
  assert.deepEqual(revised.versions[1], {
    version: 2,
    createdAt: "2026-08-10T09:00:00Z",
    reason: "Add evaluation",
    data: { tasks: ["read", "evaluate"] },
  });
});

test("createReview accepts a null owner entity for workspace review", () => {
  const review = createReview({
    id: "review-workspace-1",
    ownerModuleId: "learning",
    ownerEntityId: null,
    horizon: "weekly",
    periodKey: "2026-W33",
    submittedAt: "2026-08-10T10:00:00Z",
  });

  assert.equal(review.id, "review-workspace-1");
  assert.equal(review.ownerModuleId, "learning");
  assert.equal(review.ownerEntityId, null);
  assert.equal(review.updatedAt, "2026-08-10T10:00:00Z");
});

test("Stage 3 domain event literals are exported as the contract source", () => {
  assert.deepEqual(events.stage3DomainEventTypes, [
    "learning.space.created",
    "learning.space.updated",
    "learning.space.paused",
    "learning.task.scheduled",
  ]);
});


test("createTask normalizes priority, tags, and one-level subtasks", () => {
  const task = createTask({
    id: "task-metadata-1",
    ownerModuleId: "learning",
    ownerEntityId: "learning-space-1",
    title: "  复习语法  ",
    scheduledDate: "2026-08-24",
    priority: "high",
    tags: ["英语", "英语", " 语法 ", "", "第四个"],
    subtasks: [
      { id: "sub-1", title: "  整理例句  " },
      { id: "sub-blank", title: "   " },
    ],
    now: "2026-08-24T08:00:00.000Z",
  });

  assert.equal(task.title, "复习语法");
  assert.equal(task.priority, "high");
  assert.deepEqual(task.tags, ["英语", "语法", "第四个"]);
  assert.deepEqual(task.subtasks, [
    { id: "sub-1", title: "整理例句", completed: false },
  ]);
});
