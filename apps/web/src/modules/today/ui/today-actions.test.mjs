import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTodayViewState,
  startWorkspaceTask,
  toggleWorkspaceTaskCompletion,
} from "./today-actions.ts";

const DATE = "2026-08-06";
const NOW = "2026-08-06T08:00:00.000Z";

function space(id, name, status) {
  return {
    id,
    name,
    goal: "",
    status,
    templateId: "three-horizon",
    currentMonthlyPlanId: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  };
}

function task(id, overrides = {}) {
  return {
    id,
    ownerModuleId: "learning",
    ownerEntityId: "space-1",
    title: `任务 ${id}`,
    description: "",
    durationMinutes: 30,
    scheduledDate: DATE,
    status: "planned",
    dueAt: null,
    completedAt: null,
    createdAt: "2026-08-06T00:00:00.000Z",
    updatedAt: "2026-08-06T00:00:00.000Z",
    ...overrides,
  };
}

function dailyPlan(id, ownerEntityId, periodKey, capacityMinutes) {
  return {
    id,
    ownerModuleId: "learning",
    ownerEntityId,
    horizon: "daily",
    versions: [
      {
        version: 1,
        createdAt: "2026-08-06T00:00:00.000Z",
        reason: "initial",
        data: {
          learningSpaceId: ownerEntityId,
          periodKey,
          title: "今日任务",
          goal: "",
          parentPlanId: null,
          taskIds: [],
          capacityMinutes,
        },
      },
    ],
    activeVersion: 1,
    updatedAt: "2026-08-06T00:00:00.000Z",
  };
}

function workspace(overrides = {}) {
  return {
    version: 2,
    learningSpaces: [],
    plans: [],
    tasks: [],
    reviews: [],
    events: [],
    updatedAt: "2026-08-06T00:00:00.000Z",
    ...overrides,
  };
}

const activeSpace = space("space-1", "RAG 学习", "active");
const archivedSpace = space("space-2", "已归档空间", "archived");

function snapshot(value) {
  return JSON.parse(JSON.stringify(value));
}

// ---- buildTodayViewState projection ----

test("buildTodayViewState projects only tasks scheduled for the requested date", () => {
  const ws = workspace({
    learningSpaces: [activeSpace],
    tasks: [
      task("t1"),
      task("t2", { scheduledDate: "2026-08-07" }),
    ],
  });
  const view = buildTodayViewState(ws, DATE);
  assert.deepEqual(view.items.map((item) => item.id), ["t1"]);
});

test("buildTodayViewState excludes tasks owned by archived spaces", () => {
  const ws = workspace({
    learningSpaces: [activeSpace, archivedSpace],
    tasks: [
      task("t1"),
      task("t4", { ownerEntityId: "space-2" }),
    ],
  });
  const view = buildTodayViewState(ws, DATE);
  assert.deepEqual(view.items.map((item) => item.id), ["t1"]);
});

test("buildTodayViewState exposes the learning-space source label", () => {
  const ws = workspace({
    learningSpaces: [activeSpace],
    tasks: [task("t1", { title: "读论文" })],
  });
  const view = buildTodayViewState(ws, DATE);
  assert.equal(view.items[0].sourceModule, "learning");
  assert.equal(view.items[0].sourceEntityId, "space-1");
  assert.equal(view.items[0].sourceLabel, "RAG 学习");
  assert.equal(view.items[0].title, "读论文");
});

test("buildTodayViewState derives planned, completed and totalMinutes from real tasks", () => {
  const ws = workspace({
    learningSpaces: [activeSpace],
    tasks: [
      task("t1", { durationMinutes: 30 }),
      task("t2", { durationMinutes: 45, status: "done", completedAt: NOW }),
    ],
  });
  const view = buildTodayViewState(ws, DATE);
  assert.equal(view.planned, 2);
  assert.equal(view.completed, 1);
  assert.equal(view.totalMinutes, 75);
});

test("buildTodayViewState projects durationMinutes onto each item", () => {
  const ws = workspace({
    learningSpaces: [activeSpace],
    tasks: [task("t1", { durationMinutes: 45 })],
  });
  const view = buildTodayViewState(ws, DATE);
  assert.equal(view.items[0].durationMinutes, 45);
});

test("buildTodayViewState sums capacity from active daily plans for the date", () => {
  const ws = workspace({
    learningSpaces: [activeSpace, archivedSpace],
    plans: [
      dailyPlan("p1", "space-1", DATE, 90),
      dailyPlan("p2", "space-2", DATE, 60),
    ],
    tasks: [task("t1")],
  });
  const view = buildTodayViewState(ws, DATE);
  assert.equal(view.capacityMinutes, 90);
});

test("buildTodayViewState returns null capacity when no plan has a value", () => {
  const ws = workspace({
    learningSpaces: [activeSpace],
    plans: [
      dailyPlan("p1", "space-1", DATE, null),
      dailyPlan("p2", "space-1", "2026-08-07", 120),
    ],
    tasks: [task("t1")],
  });
  const view = buildTodayViewState(ws, DATE);
  assert.equal(view.capacityMinutes, null);
});

test("buildTodayViewState sorts timed items before untimed items", () => {
  const ws = workspace({
    learningSpaces: [activeSpace],
    tasks: [
      task("t1"),
      task("t2", { dueAt: "2026-08-06T09:00:00.000Z" }),
    ],
  });
  const view = buildTodayViewState(ws, DATE);
  assert.deepEqual(view.items.map((item) => item.id), ["t2", "t1"]);
});

test("buildTodayViewState reports review due when no daily review exists", () => {
  const ws = workspace({
    learningSpaces: [activeSpace],
    tasks: [task("t1")],
  });
  const view = buildTodayViewState(ws, DATE);
  assert.equal(view.reviewDue, true);
});

test("buildTodayViewState does not mutate the input workspace", () => {
  const ws = workspace({
    learningSpaces: [activeSpace],
    plans: [dailyPlan("p1", "space-1", DATE, 90)],
    tasks: [task("t1")],
  });
  const before = snapshot(ws);
  buildTodayViewState(ws, DATE);
  assert.deepEqual(ws, before);
});

// ---- startWorkspaceTask ----

test("startWorkspaceTask moves a planned task to active", () => {
  const ws = workspace({
    learningSpaces: [activeSpace],
    tasks: [task("t1")],
  });
  const next = startWorkspaceTask(ws, "t1", NOW);
  const started = next.tasks.find((candidate) => candidate.id === "t1");
  assert.equal(started.status, "active");
  assert.equal(started.updatedAt, NOW);
  assert.equal(next.updatedAt, NOW);
});

test("startWorkspaceTask leaves active and done tasks unchanged", () => {
  const ws = workspace({
    learningSpaces: [activeSpace],
    tasks: [
      task("t1", { status: "active" }),
      task("t2", { status: "done", completedAt: NOW }),
    ],
  });
  const next = startWorkspaceTask(ws, "t1", NOW);
  assert.equal(next.tasks.find((candidate) => candidate.id === "t1").status, "active");
  const afterDone = startWorkspaceTask(next, "t2", NOW);
  assert.equal(afterDone.tasks.find((candidate) => candidate.id === "t2").status, "done");
});

test("startWorkspaceTask does not mutate the input workspace", () => {
  const ws = workspace({
    learningSpaces: [activeSpace],
    tasks: [task("t1")],
  });
  const before = snapshot(ws);
  startWorkspaceTask(ws, "t1", NOW);
  assert.deepEqual(ws, before);
});

// ---- toggleWorkspaceTaskCompletion ----

test("toggleWorkspaceTaskCompletion completes a task and appends one event", () => {
  const ws = workspace({
    learningSpaces: [activeSpace],
    tasks: [task("t1")],
  });
  const next = toggleWorkspaceTaskCompletion(ws, "t1", NOW);
  const done = next.tasks.find((candidate) => candidate.id === "t1");
  assert.equal(done.status, "done");
  assert.equal(done.completedAt, NOW);
  const completionEvents = next.events.filter(
    (event) =>
      event.eventType === "learning.task.completed" && event.entityId === "t1",
  );
  assert.equal(completionEvents.length, 1);
  assert.equal(completionEvents[0].moduleId, "learning");
  assert.equal(completionEvents[0].schemaVersion, 1);
  assert.equal(completionEvents[0].occurredAt, NOW);
});

test("toggleWorkspaceTaskCompletion undoes a task without appending an event", () => {
  const ws = workspace({
    learningSpaces: [activeSpace],
    tasks: [task("t1", { status: "done", completedAt: NOW })],
  });
  const next = toggleWorkspaceTaskCompletion(ws, "t1", NOW);
  const undone = next.tasks.find((candidate) => candidate.id === "t1");
  assert.equal(undone.status, "planned");
  assert.equal(undone.completedAt, null);
  assert.equal(next.events.length, 0);
});

test("toggleWorkspaceTaskCompletion does not duplicate the completion event", () => {
  const completedOnce = toggleWorkspaceTaskCompletion(
    workspace({ learningSpaces: [activeSpace], tasks: [task("t1")] }),
    "t1",
    NOW,
  );
  const undone = toggleWorkspaceTaskCompletion(completedOnce, "t1", NOW);
  const completedAgain = toggleWorkspaceTaskCompletion(undone, "t1", NOW);
  const completionEvents = completedAgain.events.filter(
    (event) =>
      event.eventType === "learning.task.completed" && event.entityId === "t1",
  );
  assert.equal(completionEvents.length, 1);
});

test("toggleWorkspaceTaskCompletion does not mutate the input workspace", () => {
  const ws = workspace({
    learningSpaces: [activeSpace],
    tasks: [task("t1")],
  });
  const before = snapshot(ws);
  toggleWorkspaceTaskCompletion(ws, "t1", NOW);
  assert.deepEqual(ws, before);
});
