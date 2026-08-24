import { createId } from "../../core/identity.ts";
import type { EntityId, IsoDateTime } from "../../core/identity.ts";
import type {
  LearningPlanData,
  LearningSpace,
  LearningSpaceStatus,
} from "../../core/learning.ts";
import {
  activePlanData,
  createPlan,
  revisePlan,
  type Plan,
} from "../../core/plans.ts";
import type { Review } from "../../core/reviews.ts";
import {
  createTask,
  type Task,
  type TaskInput,
} from "../../core/tasks.ts";
import type { DomainEvent } from "../../core/events.ts";

export type {
  LearningPlanData,
  LearningSpace,
  LearningSpaceStatus,
} from "../../core/learning.ts";

export type LearningSpaceSummary = {
  id: EntityId;
  name: string;
  goal: string;
  status: LearningSpaceStatus;
  planHorizon: "daily" | "weekly" | "monthly";
};

export type LearningTaskSummary = {
  id: EntityId;
  sourceModule: "learning";
  sourceEntityId: EntityId;
  sourceLabel: string;
  title: string;
  durationMinutes: number;
  priority: Task["priority"];
  tags: string[];
  subtasks: Task["subtasks"];
  createdAt: IsoDateTime;
  dueAt?: string;
  status: "planned" | "active" | "done";
};

export type LearningSpaceBundle = {
  space: LearningSpace;
  plans: Plan<LearningPlanData>[];
  tasks: Task[];
  reviews: Review[];
};

export type LearningSpaceExport = LearningSpaceBundle & {
  exportedAt: IsoDateTime;
};

export type LearningWorkspaceCollections = {
  learningSpaces: LearningSpace[];
  plans: Plan<LearningPlanData>[];
  tasks: Task[];
  reviews: Review[];
  events: DomainEvent[];
  updatedAt: IsoDateTime;
};

export type CreateLearningSpaceInput = {
  id?: EntityId;
  name: string;
  goal?: string;
  templateId: LearningSpace["templateId"];
  now: IsoDateTime;
};

export type LearningSpacePatch = Partial<
  Pick<LearningSpace, "name" | "goal">
>;

export type LearningPlanHierarchy = {
  space: LearningSpace;
  plans: Plan<LearningPlanData>[];
};

export type ScheduleLearningTaskInput = Omit<
  TaskInput,
  "ownerModuleId" | "ownerEntityId" | "title" | "now"
> & {
  title: string;
  now: IsoDateTime;
};

export type ScheduledLearningTask = {
  task: Task;
  plan: Plan<LearningPlanData>;
};

const MAX_NAME_LENGTH = 80;
const MAX_GOAL_LENGTH = 500;

function normalizeName(name: string): string {
  const normalized = name.trim();
  if (!normalized || normalized.length > MAX_NAME_LENGTH) {
    throw new Error(`Learning space name must contain 1-${MAX_NAME_LENGTH} characters`);
  }
  return normalized;
}

function normalizeGoal(goal: string): string {
  const normalized = goal.trim();
  if (normalized.length > MAX_GOAL_LENGTH) {
    throw new Error(`Learning space goal must not exceed ${MAX_GOAL_LENGTH} characters`);
  }
  return normalized;
}

function assertSpaceEditable(space: LearningSpace): void {
  if (space.status === "archived") {
    throw new Error("Archived learning spaces are read-only");
  }
}

function isOwnedPlan(
  plan: Plan<LearningPlanData>,
  spaceId: EntityId,
): boolean {
  return plan.ownerModuleId === "learning" && plan.ownerEntityId === spaceId;
}

function isOwnedTask(task: Task, spaceId: EntityId): boolean {
  return (
    task.ownerModuleId === "learning" &&
    task.ownerEntityId === spaceId
  );
}

function isOwnedReview(review: Review, spaceId: EntityId): boolean {
  return (
    review.ownerModuleId === "learning" &&
    review.ownerEntityId === spaceId
  );
}

export function createLearningSpace(
  input: CreateLearningSpaceInput,
): LearningSpace {
  return {
    id: input.id ?? createId(),
    name: normalizeName(input.name),
    goal: normalizeGoal(input.goal ?? ""),
    status: "draft",
    templateId: input.templateId,
    currentMonthlyPlanId: null,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

export function updateLearningSpace(
  space: LearningSpace,
  patch: LearningSpacePatch,
  now: IsoDateTime,
): LearningSpace {
  assertSpaceEditable(space);

  return {
    ...space,
    ...(patch.name === undefined
      ? {}
      : { name: normalizeName(patch.name) }),
    ...(patch.goal === undefined
      ? {}
      : { goal: normalizeGoal(patch.goal) }),
    updatedAt: now,
  };
}

export function setLearningSpaceStatus(
  space: LearningSpace,
  status: LearningSpaceStatus,
  now: IsoDateTime,
): LearningSpace {
  assertSpaceEditable(space);
  return { ...space, status, updatedAt: now };
}

export function createLearningPlanHierarchy(
  space: LearningSpace,
  templateId: LearningSpace["templateId"],
  dateKey: string,
  now: IsoDateTime,
): LearningPlanHierarchy {
  assertSpaceEditable(space);

  if (templateId === "blank") {
    return {
      space: {
        ...space,
        templateId,
        currentMonthlyPlanId: null,
        updatedAt: now,
      },
      plans: [],
    };
  }

  const monthly = createPlan<LearningPlanData>({
    id: createId(),
    ownerModuleId: "learning",
    ownerEntityId: space.id,
    horizon: "monthly",
    data: {
      learningSpaceId: space.id,
      periodKey: dateKey,
      title: "月度方向",
      goal: "",
      parentPlanId: null,
      taskIds: [],
      capacityMinutes: null,
    },
    now,
  });

  const weekly = createPlan<LearningPlanData>({
    id: createId(),
    ownerModuleId: "learning",
    ownerEntityId: space.id,
    horizon: "weekly",
    data: {
      learningSpaceId: space.id,
      periodKey: dateKey,
      title: "本周重点",
      goal: "",
      parentPlanId: monthly.id,
      taskIds: [],
      capacityMinutes: null,
    },
    now,
  });

  const daily = createPlan<LearningPlanData>({
    id: createId(),
    ownerModuleId: "learning",
    ownerEntityId: space.id,
    horizon: "daily",
    data: {
      learningSpaceId: space.id,
      periodKey: dateKey,
      title: "今日任务",
      goal: "",
      parentPlanId: weekly.id,
      taskIds: [],
      capacityMinutes: null,
    },
    now,
  });

  return {
    space: {
      ...space,
      templateId,
      currentMonthlyPlanId: monthly.id,
      updatedAt: now,
    },
    plans: [monthly, weekly, daily],
  };
}

export function reviseLearningPlan(
  space: LearningSpace,
  plan: Plan<LearningPlanData>,
  patch: Partial<LearningPlanData>,
  reason: string,
  now: IsoDateTime,
): Plan<LearningPlanData> {
  assertSpaceEditable(space);

  const currentData = activePlanData(plan);
  if (
    plan.ownerModuleId !== "learning" ||
    plan.ownerEntityId !== space.id ||
    currentData.learningSpaceId !== space.id
  ) {
    throw new Error("Learning plan must belong to the learning space");
  }

  return revisePlan(
    plan,
    {
      ...currentData,
      ...patch,
    },
    reason,
    now,
  );
}

export function scheduleLearningTask(
  space: LearningSpace,
  dailyPlan: Plan<LearningPlanData>,
  input: ScheduleLearningTaskInput,
): ScheduledLearningTask {
  if (space.status !== "active") {
    throw new Error("Only active learning spaces can schedule tasks");
  }

  const dailyData = activePlanData(dailyPlan);
  if (
    dailyPlan.ownerModuleId !== "learning" ||
    dailyPlan.ownerEntityId !== space.id ||
    dailyPlan.horizon !== "daily" ||
    dailyData.learningSpaceId !== space.id
  ) {
    throw new Error("Daily plan must belong to the active learning space");
  }

  const title = input.title.trim();
  if (!title) {
    throw new Error("Learning task title is required");
  }

  const task = createTask({
    ...input,
    title,
    ownerModuleId: "learning",
    ownerEntityId: space.id,
    now: input.now,
  });

  return {
    task,
    plan: reviseLearningPlan(
      space,
      dailyPlan,
      { taskIds: [...dailyData.taskIds, task.id] },
      "task-scheduled",
      input.now,
    ),
  };
}

export function summarizeTasksForToday(
  space: Pick<LearningSpace, "id" | "name">,
  tasks: Task[],
): LearningTaskSummary[] {
  return tasks
    .filter((task) => isOwnedTask(task, space.id))
    .map((task) => ({
      id: task.id,
      sourceModule: "learning",
      sourceEntityId: space.id,
      sourceLabel: space.name,
      title: task.title,
      durationMinutes: task.durationMinutes,
      priority: task.priority,
      tags: [...task.tags],
      subtasks: task.subtasks.map((subtask) => ({ ...subtask })),
      createdAt: task.createdAt,
      dueAt: task.dueAt ?? undefined,
      status: task.status,
    }));
}

/**
 * Pure daily capacity projection for a single learning space. Today calls this
 * instead of reading Learning plan internals directly. Only active daily plan
 * versions for the requested date contribute; null capacity values are ignored
 * and the whole result is null when no value exists.
 */
export function summarizeDailyCapacityForToday(
  space: Pick<LearningSpace, "id">,
  plans: Plan<LearningPlanData>[],
  dateKey: string,
): number | null {
  let sum = 0;
  let hasValue = false;
  for (const plan of plans) {
    if (plan.ownerModuleId !== "learning") continue;
    if (plan.ownerEntityId !== space.id) continue;
    if (plan.horizon !== "daily") continue;
    const data = activePlanData(plan);
    if (data.periodKey !== dateKey) continue;
    if (data.capacityMinutes === null) continue;
    sum += data.capacityMinutes;
    hasValue = true;
  }
  return hasValue ? sum : null;
}

export function buildLearningSpaceExport(
  workspace: Pick<
    LearningWorkspaceCollections,
    "learningSpaces" | "plans" | "tasks" | "reviews"
  >,
  spaceId: EntityId,
  exportedAt: IsoDateTime,
): LearningSpaceExport {
  const space = workspace.learningSpaces.find(
    (candidate) => candidate.id === spaceId,
  );
  if (!space) {
    throw new Error(`Learning space ${spaceId} was not found`);
  }

  return {
    exportedAt,
    space,
    plans: workspace.plans.filter((plan) => isOwnedPlan(plan, spaceId)),
    tasks: workspace.tasks.filter((task) => isOwnedTask(task, spaceId)),
    reviews: workspace.reviews.filter((review) =>
      isOwnedReview(review, spaceId),
    ),
  };
}

export function removeLearningSpaceBundle<
  TWorkspace extends LearningWorkspaceCollections,
>(
  workspace: TWorkspace,
  spaceId: EntityId,
  now: IsoDateTime,
): TWorkspace {
  if (!workspace.learningSpaces.some((space) => space.id === spaceId)) {
    throw new Error(`Learning space ${spaceId} was not found`);
  }

  const removedPlans = workspace.plans.filter((plan) =>
    isOwnedPlan(plan, spaceId),
  );
  const removedTasks = workspace.tasks.filter((task) =>
    isOwnedTask(task, spaceId),
  );
  const removedReviews = workspace.reviews.filter((review) =>
    isOwnedReview(review, spaceId),
  );
  const removedEntityIds = new Set<EntityId>([
    spaceId,
    ...removedPlans.map((plan) => plan.id),
    ...removedTasks.map((task) => task.id),
    ...removedReviews.map((review) => review.id),
  ]);

  return {
    ...workspace,
    learningSpaces: workspace.learningSpaces.filter(
      (space) => space.id !== spaceId,
    ),
    plans: workspace.plans.filter((plan) => !isOwnedPlan(plan, spaceId)),
    tasks: workspace.tasks.filter((task) => !isOwnedTask(task, spaceId)),
    reviews: workspace.reviews.filter(
      (review) => !isOwnedReview(review, spaceId),
    ),
    events: workspace.events.filter(
      (event) => !removedEntityIds.has(event.entityId),
    ),
    updatedAt: now,
  };
}
