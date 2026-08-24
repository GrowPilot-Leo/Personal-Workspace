import test from "node:test";
import assert from "node:assert/strict";
import {
  createLearningWorkspaceTask,
  ensureDefaultLearningWorkspace,
  removeUnfinishedLearningTask,
  updateLearningWorkspaceTask,
} from "./mvp-actions.ts";
import { createEmptyWorkspaceStateV2 } from "../../core/workspace-state.ts";
import { createTask } from "../../core/tasks.ts";

const NOW = "2026-08-24T08:00:00.000Z";
const LATER = "2026-08-24T09:00:00.000Z";

function space(overrides = {}) {
  return {
    id: "space-1",
    name: "Existing space",
    goal: "",
    status: "active",
    templateId: "blank",
    currentMonthlyPlanId: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function workspace(overrides = {}) {
  return { ...createEmptyWorkspaceStateV2(NOW), ...overrides };
}

function draft(overrides = {}) {
  return {
    title: "复习语法",
    description: "整理今天的错题",
    scheduledDate: "2026-08-24",
    durationMinutes: 30,
    priority: "high",
    tags: ["英语", "语法"],
    subtasks: [{ id: "sub-1", title: "整理例句" }],
    ...overrides,
  };
}

test("empty workspace gets one active default Learning space", () => {
  const original = workspace();
  const result = ensureDefaultLearningWorkspace(original, NOW);

  assert.equal(result.workspace.learningSpaces.length, 1);
  assert.deepEqual(result.space, result.workspace.learningSpaces[0]);
  assert.equal(result.space.name, "我的学习");
  assert.equal(result.space.status, "active");
  assert.equal(result.space.templateId, "blank");
  assert.notStrictEqual(result.workspace, original);
  assert.deepEqual(original.learningSpaces, []);
});

test("default Learning selection reuses active space and otherwise promotes the first editable space", () => {
  const active = space({ id: "active", name: "正在学习" });
  const activeWorkspace = workspace({
    learningSpaces: [active, space({ id: "paused", status: "paused" })],
  });
  const reused = ensureDefaultLearningWorkspace(activeWorkspace, NOW);
  assert.strictEqual(reused.workspace, activeWorkspace);
  assert.strictEqual(reused.space, active);

  const promoted = ensureDefaultLearningWorkspace(
    workspace({ learningSpaces: [space({ id: "draft", status: "draft" })] }),
    LATER,
  );
  assert.equal(promoted.space.id, "draft");
  assert.equal(promoted.space.name, "Existing space");
  assert.equal(promoted.space.status, "active");
  assert.equal(promoted.space.updatedAt, LATER);
});

test("creating owns the task under the default space and appends one schedule event", () => {
  const original = workspace();
  const next = createLearningWorkspaceTask(original, draft(), NOW);

  assert.equal(next.learningSpaces.length, 1);
  assert.equal(next.tasks.length, 1);
  assert.deepEqual(next.tasks[0], {
    id: next.tasks[0].id,
    ownerModuleId: "learning",
    ownerEntityId: next.learningSpaces[0].id,
    title: "复习语法",
    description: "整理今天的错题",
    durationMinutes: 30,
    scheduledDate: "2026-08-24",
    priority: "high",
    tags: ["英语", "语法"],
    subtasks: [{ id: "sub-1", title: "整理例句", completed: false }],
    status: "planned",
    dueAt: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  });
  assert.equal(next.events.length, 1);
  assert.deepEqual(
    {
      eventType: next.events[0].eventType,
      moduleId: next.events[0].moduleId,
      entityId: next.events[0].entityId,
      payload: next.events[0].payload,
    },
    {
      eventType: "learning.task.scheduled",
      moduleId: "learning",
      entityId: next.tasks[0].id,
      payload: { taskId: next.tasks[0].id },
    },
  );
  assert.deepEqual(original, workspace());
});

test("creating rejects blank titles and malformed date keys without changing input", () => {
  const original = workspace();
  assert.throws(
    () => createLearningWorkspaceTask(original, draft({ title: "  " }), NOW),
    /title/i,
  );
  assert.throws(
    () =>
      createLearningWorkspaceTask(
        original,
        draft({ scheduledDate: "tomorrow" }),
        NOW,
      ),
    /date/i,
  );
  assert.deepEqual(original, workspace());
});

test("updating an unfinished owned task preserves identity and execution state", () => {
  const owned = {
    ...createTask({
      id: "task-1",
      ownerModuleId: "learning",
      ownerEntityId: "space-1",
      title: "旧标题",
      scheduledDate: "2026-08-24",
      now: NOW,
    }),
    status: "active",
  };
  const original = workspace({ learningSpaces: [space()], tasks: [owned] });
  const next = updateLearningWorkspaceTask(
    original,
    "task-1",
    draft({ title: "新标题", priority: "low" }),
    LATER,
  );

  assert.deepEqual(next.tasks[0], {
    ...owned,
    title: "新标题",
    description: "整理今天的错题",
    durationMinutes: 30,
    scheduledDate: "2026-08-24",
    priority: "low",
    tags: ["英语", "语法"],
    subtasks: [{ id: "sub-1", title: "整理例句", completed: false }],
    updatedAt: LATER,
  });
  assert.strictEqual(original.tasks[0], owned);
});

test("update and delete reject done, non-Learning, missing, and archived-space tasks", () => {
  const done = {
    ...createTask({
      id: "done",
      ownerModuleId: "learning",
      ownerEntityId: "space-1",
      title: "已完成",
      scheduledDate: "2026-08-24",
      now: NOW,
    }),
    status: "done",
    completedAt: LATER,
  };
  const career = createTask({
    id: "career",
    ownerModuleId: "career",
    ownerEntityId: "career-1",
    title: "职业任务",
    scheduledDate: "2026-08-24",
    now: NOW,
  });
  const archivedTask = createTask({
    id: "archived-task",
    ownerModuleId: "learning",
    ownerEntityId: "archived",
    title: "归档任务",
    scheduledDate: "2026-08-24",
    now: NOW,
  });
  const original = workspace({
    learningSpaces: [space(), space({ id: "archived", status: "archived" })],
    tasks: [done, career, archivedTask],
  });

  for (const id of ["done", "career", "archived-task", "missing"]) {
    assert.strictEqual(
      updateLearningWorkspaceTask(original, id, draft(), LATER),
      original,
    );
    assert.strictEqual(
      removeUnfinishedLearningTask(original, id, LATER),
      original,
    );
  }
});

test("deleting an unfinished task removes only that task and plan references", () => {
  const owned = createTask({
    id: "task-1",
    ownerModuleId: "learning",
    ownerEntityId: "space-1",
    title: "删除我",
    scheduledDate: "2026-08-24",
    now: NOW,
  });
  const keep = createTask({
    id: "task-2",
    ownerModuleId: "learning",
    ownerEntityId: "space-1",
    title: "保留我",
    scheduledDate: "2026-08-24",
    now: NOW,
  });
  const plan = {
    id: "plan-1",
    ownerModuleId: "learning",
    ownerEntityId: "space-1",
    horizon: "daily",
    versions: [{
      version: 1,
      createdAt: NOW,
      reason: "initial",
      data: {
        learningSpaceId: "space-1",
        periodKey: "2026-08-24",
        title: "今日",
        goal: "",
        parentPlanId: null,
        taskIds: ["task-1", "task-2"],
        capacityMinutes: null,
      },
    }],
    activeVersion: 1,
    updatedAt: NOW,
  };
  const original = workspace({
    learningSpaces: [space()],
    plans: [plan],
    tasks: [owned, keep],
  });
  const next = removeUnfinishedLearningTask(original, "task-1", LATER);

  assert.deepEqual(next.tasks.map((task) => task.id), ["task-2"]);
  assert.deepEqual(next.plans[0].versions[0].data.taskIds, ["task-2"]);
  assert.equal(next.plans[0].updatedAt, LATER);
  assert.deepEqual(original.plans[0].versions[0].data.taskIds, [
    "task-1",
    "task-2",
  ]);
});
