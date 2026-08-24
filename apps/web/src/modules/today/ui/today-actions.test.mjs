import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTodayViewState,
  hasIncompleteSubtasks,
  startWorkspaceTask,
  toggleWorkspaceSubtaskCompletion,
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
    priority: "medium",
    tags: [],
    subtasks: [],
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

// ---- task action ownership guards ----

test("startWorkspaceTask rejects non-learning tasks", () => {
  const ws = workspace({
    learningSpaces: [activeSpace],
    tasks: [task("t1", { ownerModuleId: "career" })],
  });
  const next = startWorkspaceTask(ws, "t1", NOW);
  assert.equal(next, ws);
  assert.equal(next.tasks.find((candidate) => candidate.id === "t1").status, "planned");
});

test("toggleWorkspaceTaskCompletion rejects English and Fitness tasks", () => {
  const ws = workspace({
    learningSpaces: [activeSpace],
    tasks: [
      task("t1", { ownerModuleId: "english" }),
      task("t2", { ownerModuleId: "fitness" }),
    ],
  });
  const afterEnglish = toggleWorkspaceTaskCompletion(ws, "t1", NOW);
  assert.equal(afterEnglish, ws);
  assert.equal(afterEnglish.events.length, 0);
  const afterFitness = toggleWorkspaceTaskCompletion(ws, "t2", NOW);
  assert.equal(afterFitness, ws);
  assert.equal(afterFitness.events.length, 0);
});

test("non-learning tasks never append learning.task.completed events", () => {
  const ws = workspace({
    learningSpaces: [activeSpace],
    tasks: [task("t1", { ownerModuleId: "career" })],
  });
  const next = toggleWorkspaceTaskCompletion(ws, "t1", NOW);
  assert.equal(next.events.length, 0);
});

test("archived-space tasks cannot be started or completed", () => {
  const ws = workspace({
    learningSpaces: [activeSpace, archivedSpace],
    tasks: [task("t1", { ownerEntityId: "space-2" })],
  });
  const started = startWorkspaceTask(ws, "t1", NOW);
  assert.equal(started, ws);
  const completed = toggleWorkspaceTaskCompletion(ws, "t1", NOW);
  assert.equal(completed, ws);
  assert.equal(completed.events.length, 0);
});

test("rejection paths leave the input workspace unmodified", () => {
  const ws = workspace({
    learningSpaces: [activeSpace, archivedSpace],
    tasks: [
      task("t1", { ownerModuleId: "career" }),
      task("t2", { ownerEntityId: "space-2" }),
      task("t3", { ownerModuleId: "english" }),
    ],
  });
  const before = snapshot(ws);
  startWorkspaceTask(ws, "t1", NOW);
  startWorkspaceTask(ws, "t2", NOW);
  toggleWorkspaceTaskCompletion(ws, "t3", NOW);
  toggleWorkspaceTaskCompletion(ws, "nonexistent", NOW);
  assert.deepEqual(ws, before);
});

// ---- reviewDue workspace scoping ----

test("reviewDue stays true when only a Learning daily review exists", () => {
  const ws = workspace({
    learningSpaces: [activeSpace],
    tasks: [task("t1")],
    reviews: [
      {
        id: "r1",
        ownerModuleId: "learning",
        ownerEntityId: "space-1",
        horizon: "daily",
        periodKey: DATE,
        wins: "ok",
        blockers: "",
        adjustment: "",
        submittedAt: NOW,
        updatedAt: NOW,
      },
    ],
  });
  const view = buildTodayViewState(ws, DATE);
  assert.equal(view.reviewDue, true);
});

test("reviewDue is false when a Workspace daily review exists for the date", () => {
  const ws = workspace({
    learningSpaces: [activeSpace],
    tasks: [task("t1")],
    reviews: [
      {
        id: "r1",
        ownerModuleId: "workspace",
        ownerEntityId: null,
        horizon: "daily",
        periodKey: DATE,
        wins: "ok",
        blockers: "",
        adjustment: "",
        submittedAt: NOW,
        updatedAt: NOW,
      },
    ],
  });
  const view = buildTodayViewState(ws, DATE);
  assert.equal(view.reviewDue, false);
});

test("Today projects task metadata and orders untimed planned tasks by priority then creation", () => {
  const ws = workspace({
    learningSpaces: [activeSpace],
    tasks: [
      task("medium", { createdAt: "2026-08-06T07:00:00.000Z" }),
      task("high-late", { priority: "high", createdAt: "2026-08-06T08:00:00.000Z", tags: ["重点"], subtasks: [{ id: "sub-1", title: "第一步", completed: false }] }),
      task("high-early", { priority: "high", createdAt: "2026-08-06T06:00:00.000Z" }),
      task("low", { priority: "low", createdAt: "2026-08-06T05:00:00.000Z" }),
    ],
  });
  const view = buildTodayViewState(ws, DATE);
  assert.deepEqual(view.items.map((item) => item.id), ["high-early", "high-late", "medium", "low"]);
  assert.deepEqual(
    {
      priority: view.items[1].priority,
      tags: view.items[1].tags,
      subtasks: view.items[1].subtasks,
      createdAt: view.items[1].createdAt,
    },
    {
      priority: "high",
      tags: ["重点"],
      subtasks: [{ id: "sub-1", title: "第一步", completed: false }],
      createdAt: "2026-08-06T08:00:00.000Z",
    },
  );
});

test("starting a task leaves exactly one eligible Learning task active", () => {
  const ws = workspace({
    learningSpaces: [activeSpace],
    tasks: [task("old", { status: "active" }), task("next")],
  });
  const next = startWorkspaceTask(ws, "next", NOW);
  assert.deepEqual(next.tasks.map((task) => [task.id, task.status]), [
    ["old", "planned"],
    ["next", "active"],
  ]);
  assert.equal(next.tasks[0].updatedAt, NOW);
});

test("subtask toggle changes only the requested checklist item", () => {
  const ws = workspace({
    learningSpaces: [activeSpace],
    tasks: [task("t1", { subtasks: [
      { id: "sub-1", title: "第一步", completed: false },
      { id: "sub-2", title: "第二步", completed: false },
    ] })],
  });
  const next = toggleWorkspaceSubtaskCompletion(ws, "t1", "sub-2", NOW);
  assert.deepEqual(next.tasks[0].subtasks, [
    { id: "sub-1", title: "第一步", completed: false },
    { id: "sub-2", title: "第二步", completed: true },
  ]);
  assert.equal(next.tasks[0].status, "planned");
  assert.equal(hasIncompleteSubtasks(next, "t1"), true);
  assert.deepEqual(ws.tasks[0].subtasks[1].completed, false);
});

test("completion requires explicit allowance while subtasks remain unfinished", () => {
  const ws = workspace({
    learningSpaces: [activeSpace],
    tasks: [task("t1", { subtasks: [{ id: "sub-1", title: "第一步", completed: false }] })],
  });
  assert.strictEqual(toggleWorkspaceTaskCompletion(ws, "t1", NOW), ws);
  const confirmed = toggleWorkspaceTaskCompletion(ws, "t1", NOW, {
    allowIncompleteSubtasks: true,
  });
  assert.equal(confirmed.tasks[0].status, "done");
});