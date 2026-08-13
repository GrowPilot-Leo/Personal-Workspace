import type { WorkspaceStateV2 } from "../../../core/workspace-state.ts";
import type { EntityId, IsoDateTime } from "../../../core/identity.ts";
import { createId } from "../../../core/identity.ts";
import type { DomainEvent } from "../../../core/events.ts";
import {
  summarizeDailyCapacityForToday,
  summarizeTasksForToday,
} from "../../learning/public.ts";
import {
  aggregateTodayItems,
  type ModuleSummary,
  type TodayItem,
} from "../public.ts";

export type TodayViewState = {
  date: string;
  items: TodayItem[];
  planned: number;
  completed: number;
  totalMinutes: number;
  capacityMinutes: number | null;
  reviewDue: boolean;
};

function sumActiveDailyCapacity(
  workspace: WorkspaceStateV2,
  dateKey: string,
  activeSpaces: { id: EntityId }[],
): number | null {
  let total: number | null = null;
  for (const space of activeSpaces) {
    const capacity = summarizeDailyCapacityForToday(
      space,
      workspace.plans,
      dateKey,
    );
    if (capacity !== null) {
      total = (total ?? 0) + capacity;
    }
  }
  return total;
}

/**
 * Pure projection of Workspace V2 into the Today view model. Tasks and daily
 * capacity come only through the Learning module's public summaries; Today
 * never inspects or copies Learning plan internals. planned/completed/
 * totalMinutes derive exclusively from projected tasks, and capacity is honest
 * (null when no active daily plan carries a value).
 */
export function buildTodayViewState(
  workspace: WorkspaceStateV2,
  dateKey: string,
): TodayViewState {
  const activeSpaces = workspace.learningSpaces.filter(
    (space) => space.status !== "archived",
  );
  const datedTasks = workspace.tasks.filter(
    (task) => task.scheduledDate === dateKey,
  );
  const durationByTaskId = new Map(
    datedTasks.map((task) => [task.id, task.durationMinutes]),
  );

  const summaries: ModuleSummary[] = activeSpaces.map((space) => ({
    moduleId: "learning",
    items: summarizeTasksForToday(space, datedTasks).map((summary) => ({
      ...summary,
      durationMinutes: durationByTaskId.get(summary.id) ?? 0,
    })),
  }));

  const items = aggregateTodayItems(summaries);
  const completed = items.filter((item) => item.status === "done").length;
  const totalMinutes = items.reduce(
    (total, item) => total + item.durationMinutes,
    0,
  );
  const capacityMinutes = sumActiveDailyCapacity(workspace, dateKey, activeSpaces);
  const reviewDue = !workspace.reviews.some(
    (review) =>
      review.ownerModuleId === "workspace" &&
      review.ownerEntityId === null &&
      review.horizon === "daily" &&
      review.periodKey === dateKey,
  );

  return {
    date: dateKey,
    items,
    planned: items.length,
    completed,
    totalMinutes,
    capacityMinutes,
    reviewDue,
  };
}

function ownedActiveLearningTask(
  workspace: WorkspaceStateV2,
  taskId: EntityId,
): EntityId | null {
  const task = workspace.tasks.find((candidate) => candidate.id === taskId);
  if (!task) return null;
  if (task.ownerModuleId !== "learning") return null;
  const space = workspace.learningSpaces.find(
    (candidate) => candidate.id === task.ownerEntityId,
  );
  if (!space || space.status === "archived") return null;
  return task.id;
}

/**
 * Pure action: mark the addressed non-done task active. Non-learning tasks,
 * tasks without an active learning space, and done/already active tasks are
 * left untouched.
 */
export function startWorkspaceTask(
  workspace: WorkspaceStateV2,
  taskId: EntityId,
  now: IsoDateTime,
): WorkspaceStateV2 {
  if (ownedActiveLearningTask(workspace, taskId) === null) return workspace;
  const task = workspace.tasks.find((candidate) => candidate.id === taskId)!;
  if (task.status !== "planned") return workspace;

  return {
    ...workspace,
    tasks: workspace.tasks.map((candidate) =>
      candidate.id === taskId
        ? { ...candidate, status: "active", updatedAt: now }
        : candidate,
    ),
    updatedAt: now,
  };
}

function completionEvent(taskId: EntityId, now: IsoDateTime): DomainEvent {
  return {
    eventId: createId(),
    eventType: "learning.task.completed",
    moduleId: "learning",
    entityId: taskId,
    schemaVersion: 1,
    occurredAt: now,
    payload: { taskId },
  };
}

/**
 * Pure action: toggle the addressed task between done and planned.
 * Non-learning tasks and tasks owned by archived or missing spaces are left
 * untouched. Completing sets completedAt and appends exactly one
 * learning.task.completed event; undoing clears completedAt and appends no
 * event; re-completing never duplicates an existing completion event.
 */
export function toggleWorkspaceTaskCompletion(
  workspace: WorkspaceStateV2,
  taskId: EntityId,
  now: IsoDateTime,
): WorkspaceStateV2 {
  if (ownedActiveLearningTask(workspace, taskId) === null) return workspace;
  const task = workspace.tasks.find((candidate) => candidate.id === taskId)!;

  if (task.status === "done") {
    return {
      ...workspace,
      tasks: workspace.tasks.map((candidate) =>
        candidate.id === taskId
          ? { ...candidate, status: "planned", completedAt: null, updatedAt: now }
          : candidate,
      ),
      updatedAt: now,
    };
  }

  const alreadyRecorded = workspace.events.some(
    (event) =>
      event.eventType === "learning.task.completed" && event.entityId === taskId,
  );
  const events = alreadyRecorded
    ? workspace.events
    : [...workspace.events, completionEvent(taskId, now)];

  return {
    ...workspace,
    tasks: workspace.tasks.map((candidate) =>
      candidate.id === taskId
        ? { ...candidate, status: "done", completedAt: now, updatedAt: now }
        : candidate,
    ),
    events,
    updatedAt: now,
  };
}
