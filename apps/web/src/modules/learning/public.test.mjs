import test from "node:test";
import assert from "node:assert/strict";
import { activePlanData, createPlan, revisePlan } from "../../core/plans.ts";
import { createTask } from "../../core/tasks.ts";
import {
  buildLearningSpaceExport,
  createLearningPlanHierarchy,
  createLearningSpace,
  removeLearningSpaceBundle,
  reviseLearningPlan,
  scheduleLearningTask,
  setLearningSpaceStatus,
  summarizeDailyCapacityForToday,
  summarizeTasksForToday,
  updateLearningSpace,
} from "./public.ts";

const CREATED_AT = "2026-08-10T08:00:00Z";
const UPDATED_AT = "2026-08-10T09:00:00Z";

function makeSpace(overrides = {}) {
  return {
    id: "space-target",
    name: "AI 产品评测",
    goal: "建立可靠评测体系",
    status: "active",
    templateId: "three-horizon",
    currentMonthlyPlanId: "plan-target-monthly",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    ...overrides,
  };
}

function makePlan({
  id = "plan-target-daily",
  ownerEntityId = "space-target",
  horizon = "daily",
  parentPlanId = "plan-target-weekly",
  taskIds = [],
  title = "今日任务",
  periodKey = "2026-08-10",
  capacityMinutes = null,
} = {}) {
  return createPlan({
    id,
    ownerModuleId: "learning",
    ownerEntityId,
    horizon,
    data: {
      learningSpaceId: ownerEntityId,
      periodKey,
      title,
      goal: "",
      parentPlanId,
      taskIds,
      capacityMinutes,
    },
    now: CREATED_AT,
  });
}

function makeTask({
  id = "task-target",
  ownerModuleId = "learning",
  ownerEntityId = "space-target",
  title = "建立评测样本表",
  scheduledDate = "2026-08-10",
} = {}) {
  return createTask({
    id,
    ownerModuleId,
    ownerEntityId,
    title,
    durationMinutes: 40,
    scheduledDate,
    dueAt: "2026-08-10T10:00:00Z",
    now: CREATED_AT,
  });
}

test("blank creation accepts an arbitrary trimmed subject without creating a route or curriculum", () => {
  const space = createLearningSpace({
    id: "space-cross-border",
    name: "  跨境车载硬件  ",
    goal: "  梳理真实产品开发流程  ",
    templateId: "blank",
    now: CREATED_AT,
  });

  assert.equal(space.name, "跨境车载硬件");
  assert.equal(space.goal, "梳理真实产品开发流程");
  assert.equal(space.templateId, "blank");
  assert.equal(space.currentMonthlyPlanId, null);
  assert.equal("route" in space, false);
  assert.equal("source" in space, false);

  const hierarchy = createLearningPlanHierarchy(space, "blank", "2026-08-10", UPDATED_AT);
  assert.deepEqual(hierarchy.plans, []);
  assert.equal(hierarchy.space.currentMonthlyPlanId, null);
});

test("three-horizon template creates linked empty monthly, weekly, and daily containers", () => {
  const space = makeSpace({ status: "draft", currentMonthlyPlanId: null });
  const hierarchy = createLearningPlanHierarchy(space, "three-horizon", "2026-08-10", UPDATED_AT);
  assert.equal(hierarchy.plans.length, 3);

  const monthly = hierarchy.plans.find((plan) => plan.horizon === "monthly");
  const weekly = hierarchy.plans.find((plan) => plan.horizon === "weekly");
  const daily = hierarchy.plans.find((plan) => plan.horizon === "daily");

  assert.ok(monthly);
  assert.ok(weekly);
  assert.ok(daily);
  assert.equal(hierarchy.space.currentMonthlyPlanId, monthly.id);
  assert.equal(hierarchy.space.updatedAt, UPDATED_AT);

  const monthlyData = activePlanData(monthly);
  const weeklyData = activePlanData(weekly);
  const dailyData = activePlanData(daily);

  assert.deepEqual(
    [monthlyData.title, weeklyData.title, dailyData.title],
    ["月度方向", "本周重点", "今日任务"],
  );
  assert.deepEqual([monthlyData.goal, weeklyData.goal, dailyData.goal], ["", "", ""]);
  assert.deepEqual([monthlyData.taskIds, weeklyData.taskIds, dailyData.taskIds], [[], [], []]);
  assert.equal(monthlyData.parentPlanId, null);
  assert.equal(weeklyData.parentPlanId, monthly.id);
  assert.equal(dailyData.parentPlanId, weekly.id);

  for (const plan of hierarchy.plans) {
    const data = activePlanData(plan);
    assert.equal(plan.ownerModuleId, "learning");
    assert.equal(plan.ownerEntityId, space.id);
    assert.equal(data.learningSpaceId, space.id);
    assert.equal(data.capacityMinutes, null);
    assert.equal(plan.versions.length, 1);
  }
});

test("learning-space names accept 80 trimmed characters and reject blank or longer names", () => {
  const accepted = createLearningSpace({
    id: "space-name-limit",
    name: "  " + "学".repeat(80) + "  ",
    goal: "",
    templateId: "blank",
    now: CREATED_AT,
  });
  assert.equal(accepted.name, "学".repeat(80));

  assert.throws(() => createLearningSpace({
    id: "space-name-too-long",
    name: "学".repeat(81),
    goal: "",
    templateId: "blank",
    now: CREATED_AT,
  }));
  assert.throws(() => createLearningSpace({
    id: "space-name-empty",
    name: "   ",
    goal: "",
    templateId: "blank",
    now: CREATED_AT,
  }));
  assert.throws(() => updateLearningSpace(makeSpace(), { name: "学".repeat(81) }, UPDATED_AT));
});

test("learning-space goals accept 500 trimmed characters and reject longer goals", () => {
  const accepted = createLearningSpace({
    id: "space-goal-limit",
    name: "目标边界",
    goal: "  " + "目".repeat(500) + "  ",
    templateId: "blank",
    now: CREATED_AT,
  });
  assert.equal(accepted.goal, "目".repeat(500));

  assert.throws(() => createLearningSpace({
    id: "space-goal-too-long",
    name: "目标越界",
    goal: "目".repeat(501),
    templateId: "blank",
    now: CREATED_AT,
  }));
  assert.throws(() => updateLearningSpace(makeSpace(), { goal: "目".repeat(501) }, UPDATED_AT));
});

test("an active space schedules an owned task into its daily plan", () => {
  const space = makeSpace();
  const dailyPlan = makePlan();
  const scheduled = scheduleLearningTask(space, dailyPlan, {
    id: "task-scheduled",
    title: "  建立评测样本表  ",
    description: "整理首批样本",
    durationMinutes: 40,
    scheduledDate: "2026-08-10",
    dueAt: "2026-08-10T10:00:00Z",
    now: UPDATED_AT,
  });

  assert.equal(scheduled.task.id, "task-scheduled");
  assert.equal(scheduled.task.ownerModuleId, "learning");
  assert.equal(scheduled.task.ownerEntityId, space.id);
  assert.equal(scheduled.task.title, "建立评测样本表");
  assert.equal(scheduled.task.scheduledDate, "2026-08-10");
  assert.equal(scheduled.task.status, "planned");
  assert.deepEqual(activePlanData(scheduled.plan).taskIds, ["task-scheduled"]);
  assert.deepEqual(activePlanData(dailyPlan).taskIds, []);
});

test("a paused space cannot schedule a new task", () => {
  assert.throws(() => scheduleLearningTask(makeSpace({ status: "paused" }), makePlan(), {
    id: "task-paused",
    title: "不应创建",
    scheduledDate: "2026-08-10",
    now: UPDATED_AT,
  }));
});

test("an archived space cannot be edited, resumed, or scheduled", () => {
  const archived = makeSpace({ status: "archived" });
  assert.throws(() => updateLearningSpace(archived, { name: "不应修改" }, UPDATED_AT));
  assert.throws(() => setLearningSpaceStatus(archived, "active", UPDATED_AT));
  assert.throws(() => scheduleLearningTask(archived, makePlan(), {
    id: "task-archived",
    title: "不应创建",
    scheduledDate: "2026-08-10",
    now: UPDATED_AT,
  }));
});

test("archiving preserves owned plans and tasks in the learning-space export", () => {
  const archived = setLearningSpaceStatus(makeSpace({ status: "active" }), "archived", UPDATED_AT);
  const monthlyPlan = makePlan({
    id: "plan-target-monthly",
    horizon: "monthly",
    parentPlanId: null,
    title: "月度方向",
  });
  const task = makeTask();
  const workspace = {
    version: 2,
    learningSpaces: [archived],
    plans: [monthlyPlan],
    tasks: [task],
    reviews: [],
    events: [],
    updatedAt: UPDATED_AT,
  };

  const exported = buildLearningSpaceExport(workspace, archived.id, "2026-08-10T10:00:00Z");
  assert.equal(exported.exportedAt, "2026-08-10T10:00:00Z");
  assert.equal(exported.space.status, "archived");
  assert.deepEqual(exported.plans, [monthlyPlan]);
  assert.deepEqual(exported.tasks, [task]);
});

test("removing one confirmed bundle preserves every unrelated workspace record", () => {
  const targetSpace = makeSpace();
  const otherSpace = makeSpace({
    id: "space-other",
    name: "英语表达",
    currentMonthlyPlanId: "plan-other-monthly",
  });
  const targetPlan = makePlan();
  const otherPlan = makePlan({ id: "plan-other-daily", ownerEntityId: otherSpace.id });
  const targetTask = makeTask();
  const otherTask = makeTask({ id: "task-other", ownerEntityId: otherSpace.id, title: "口语练习" });
  const targetReview = {
    id: "review-target",
    ownerModuleId: "learning",
    ownerEntityId: targetSpace.id,
    horizon: "daily",
    periodKey: "2026-08-10",
    wins: "",
    blockers: "",
    adjustment: "",
    submittedAt: CREATED_AT,
    updatedAt: CREATED_AT,
  };
  const otherReview = { ...targetReview, id: "review-other", ownerEntityId: otherSpace.id };
  const workspaceReview = { ...targetReview, id: "review-workspace", ownerEntityId: null };
  const targetEvent = {
    eventId: "event-target",
    eventType: "learning.task.scheduled",
    moduleId: "learning",
    entityId: targetTask.id,
    schemaVersion: 1,
    occurredAt: CREATED_AT,
    payload: { taskId: targetTask.id },
  };
  const otherEvent = {
    ...targetEvent,
    eventId: "event-other",
    entityId: otherTask.id,
    payload: { taskId: otherTask.id },
  };
  const workspace = {
    version: 2,
    learningSpaces: [targetSpace, otherSpace],
    plans: [targetPlan, otherPlan],
    tasks: [targetTask, otherTask],
    reviews: [targetReview, otherReview, workspaceReview],
    events: [targetEvent, otherEvent],
    updatedAt: CREATED_AT,
  };

  const remaining = removeLearningSpaceBundle(workspace, targetSpace.id, UPDATED_AT);
  assert.deepEqual(remaining.learningSpaces, [otherSpace]);
  assert.deepEqual(remaining.plans, [otherPlan]);
  assert.deepEqual(remaining.tasks, [otherTask]);
  assert.deepEqual(remaining.reviews, [otherReview, workspaceReview]);
  assert.deepEqual(remaining.events, [otherEvent]);
  assert.equal(remaining.updatedAt, UPDATED_AT);

  assert.equal(workspace.learningSpaces.length, 2);
  assert.equal(workspace.plans.length, 2);
  assert.equal(workspace.tasks.length, 2);
  assert.equal(workspace.reviews.length, 3);
  assert.equal(workspace.events.length, 2);
});

test("direct learning-plan edits append a version without mutating prior data", () => {
  const space = makeSpace();
  const plan = makePlan();
  const revised = reviseLearningPlan(
    space,
    plan,
    { goal: "完成首轮人工评测", capacityMinutes: 90 },
    "user-edit",
    UPDATED_AT,
  );

  assert.equal(plan.activeVersion, 1);
  assert.equal(plan.versions.length, 1);
  assert.equal(activePlanData(plan).goal, "");
  assert.equal(activePlanData(plan).capacityMinutes, null);
  assert.equal(revised.activeVersion, 2);
  assert.equal(revised.versions.length, 2);
  assert.equal(revised.versions[1].reason, "user-edit");
  assert.equal(revised.versions[1].createdAt, UPDATED_AT);
  assert.equal(activePlanData(revised).goal, "完成首轮人工评测");
  assert.equal(activePlanData(revised).capacityMinutes, 90);
  assert.equal(activePlanData(revised).title, "今日任务");
});

test("reviseLearningPlan rejects plan edits when the owning space is archived", () => {
  const archived = makeSpace({ status: "archived" });
  const plan = makePlan();

  assert.throws(
    () =>
      reviseLearningPlan(
        archived,
        plan,
        { goal: "不应修改归档计划" },
        "user-edit",
        UPDATED_AT,
      ),
    /Archived learning spaces are read-only/,
  );

  assert.equal(plan.activeVersion, 1);
  assert.equal(plan.versions.length, 1);
  assert.equal(activePlanData(plan).goal, "");
});

test("Today summaries include only matching learning tasks and expose source-space identity", () => {
  const space = makeSpace();
  const ownedTask = makeTask();
  const otherSpaceTask = makeTask({ id: "task-other-space", ownerEntityId: "space-other" });
  const otherModuleTask = makeTask({
    id: "task-other-module",
    ownerModuleId: "career",
    ownerEntityId: space.id,
  });

  const summaries = summarizeTasksForToday(space, [otherSpaceTask, ownedTask, otherModuleTask]);
  assert.deepEqual(summaries, [{
    id: ownedTask.id,
    sourceModule: "learning",
    sourceEntityId: space.id,
    sourceLabel: space.name,
    title: ownedTask.title,
    dueAt: ownedTask.dueAt,
    status: ownedTask.status,
  }]);
});

test("summarizeDailyCapacityForToday returns the space's capacity for the date", () => {
  const space = makeSpace();
  const plans = [
    makePlan({ id: "p1", capacityMinutes: 60 }),
    makePlan({ id: "p2", capacityMinutes: 30 }),
  ];
  assert.equal(summarizeDailyCapacityForToday(space, plans, "2026-08-10"), 90);
});

test("summarizeDailyCapacityForToday ignores other spaces", () => {
  const space = makeSpace();
  const plans = [
    makePlan({ id: "p1", capacityMinutes: 60 }),
    makePlan({ id: "p2", ownerEntityId: "space-other", capacityMinutes: 30 }),
  ];
  assert.equal(summarizeDailyCapacityForToday(space, plans, "2026-08-10"), 60);
});

test("summarizeDailyCapacityForToday ignores other dates", () => {
  const space = makeSpace();
  const plans = [
    makePlan({ id: "p1", capacityMinutes: 60 }),
    makePlan({ id: "p2", periodKey: "2026-08-11", capacityMinutes: 30 }),
  ];
  assert.equal(summarizeDailyCapacityForToday(space, plans, "2026-08-10"), 60);
});

test("summarizeDailyCapacityForToday ignores weekly and monthly horizons", () => {
  const space = makeSpace();
  const plans = [
    makePlan({ id: "p1", capacityMinutes: 60 }),
    makePlan({ id: "p2", horizon: "weekly", capacityMinutes: 120 }),
    makePlan({ id: "p3", horizon: "monthly", capacityMinutes: 240 }),
  ];
  assert.equal(summarizeDailyCapacityForToday(space, plans, "2026-08-10"), 60);
});

test("summarizeDailyCapacityForToday uses the active plan version", () => {
  const space = makeSpace();
  const plan = makePlan({ id: "p1", capacityMinutes: 60 });
  const revised = revisePlan(
    plan,
    { ...activePlanData(plan), capacityMinutes: 90 },
    "user-edit",
    CREATED_AT,
  );
  assert.equal(summarizeDailyCapacityForToday(space, [revised], "2026-08-10"), 90);
});

test("summarizeDailyCapacityForToday returns null when no capacity exists", () => {
  const space = makeSpace();
  const plans = [makePlan({ id: "p1", capacityMinutes: null })];
  assert.equal(summarizeDailyCapacityForToday(space, plans, "2026-08-10"), null);
});

test("summarizeDailyCapacityForToday does not mutate input plans", () => {
  const space = makeSpace();
  const plans = [
    makePlan({ id: "p1", capacityMinutes: 60 }),
    makePlan({ id: "p2", capacityMinutes: 30 }),
  ];
  const before = JSON.parse(JSON.stringify(plans));
  summarizeDailyCapacityForToday(space, plans, "2026-08-10");
  assert.deepEqual(plans, before);
});
