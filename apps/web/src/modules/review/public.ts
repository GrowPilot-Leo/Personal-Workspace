import type { EntityId, IsoDateTime } from "@/core/identity";
import {
  createReview,
  updateReview,
  type Review,
  type ReviewHorizon,
} from "../../core/reviews.ts";
import type { WorkspaceStateV2 } from "@/core/workspace-state";
import type { TaskSubtask } from "@/core/tasks";

export type ReviewSummary = {
  id: EntityId;
  ownerModuleId: string;
  ownerEntityId: EntityId | null;
  horizon: ReviewHorizon;
  periodKey: string;
  wins: string;
  blockers: string;
  adjustment: string;
};

export function toReviewSummary(review: Review): ReviewSummary {
  return {
    id: review.id,
    ownerModuleId: review.ownerModuleId,
    ownerEntityId: review.ownerEntityId,
    horizon: review.horizon,
    periodKey: review.periodKey,
    wins: review.wins,
    blockers: review.blockers,
    adjustment: review.adjustment,
  };
}

/** A workspace-owned daily review is due when none exists for this date. */
export function isReviewDue(existing: ReviewSummary[], periodKey: string): boolean {
  return !existing.some(
    (review) =>
      review.ownerModuleId === "workspace" &&
      review.ownerEntityId === null &&
      review.periodKey === periodKey &&
      review.horizon === "daily",
  );
}

export type DailyReviewSummary = {
  date: string;
  planned: number;
  completed: number;
  plannedMinutes: number;
  completedMinutes: number;
  completedItems: Array<{
    id: EntityId;
    title: string;
    subtasks: TaskSubtask[];
  }>;
};

export function buildDailyReviewSummary(
  workspace: WorkspaceStateV2,
  dateKey: string,
): DailyReviewSummary {
  const eligibleSpaceIds = new Set(
    workspace.learningSpaces
      .filter((space) => space.status !== "archived")
      .map((space) => space.id),
  );
  const tasks = workspace.tasks.filter(
    (task) =>
      task.ownerModuleId === "learning" &&
      eligibleSpaceIds.has(task.ownerEntityId) &&
      task.scheduledDate === dateKey,
  );
  const completed = tasks.filter((task) => task.status === "done");
  return {
    date: dateKey,
    planned: tasks.length,
    completed: completed.length,
    plannedMinutes: tasks.reduce(
      (total, task) => total + task.durationMinutes,
      0,
    ),
    completedMinutes: completed.reduce(
      (total, task) => total + task.durationMinutes,
      0,
    ),
    completedItems: completed.map((task) => ({
      id: task.id,
      title: task.title,
      subtasks: task.subtasks.map((subtask) => ({ ...subtask })),
    })),
  };
}

export function saveWorkspaceReview(
  workspace: WorkspaceStateV2,
  input: {
    dateKey: string;
    wins: string;
    blockers: string;
    adjustment: string;
  },
  now: IsoDateTime,
): WorkspaceStateV2 {
  const patch = {
    wins: input.wins.trim(),
    blockers: input.blockers.trim(),
    adjustment: input.adjustment.trim(),
  };
  const existing = workspace.reviews.find(
    (review) =>
      review.ownerModuleId === "workspace" &&
      review.ownerEntityId === null &&
      review.horizon === "daily" &&
      review.periodKey === input.dateKey,
  );

  if (existing) {
    const updated = updateReview(existing, patch, now);
    return {
      ...workspace,
      reviews: workspace.reviews.map((review) =>
        review.id === existing.id ? updated : review,
      ),
      updatedAt: now,
    };
  }

  return {
    ...workspace,
    reviews: [
      ...workspace.reviews,
      createReview({
        ownerModuleId: "workspace",
        ownerEntityId: null,
        horizon: "daily",
        periodKey: input.dateKey,
        ...patch,
        submittedAt: now,
      }),
    ],
    updatedAt: now,
  };
}

export function rollWorkspaceForward(
  workspace: WorkspaceStateV2,
  fromDate: string,
  toDate: string,
  now: IsoDateTime,
): WorkspaceStateV2 {
  if (fromDate === toDate) return workspace;

  const eligibleSpaceIds = new Set(
    workspace.learningSpaces
      .filter(
        (space) => space.status === "active" || space.status === "planned",
      )
      .map((space) => space.id),
  );
  let changed = false;
  const tasks = workspace.tasks.map((task) => {
    if (
      task.ownerModuleId !== "learning" ||
      !eligibleSpaceIds.has(task.ownerEntityId) ||
      task.scheduledDate !== fromDate ||
      task.status === "done"
    ) {
      return task;
    }
    changed = true;
    return {
      ...task,
      scheduledDate: toDate,
      status: "planned" as const,
      completedAt: null,
      updatedAt: now,
    };
  });

  return changed ? { ...workspace, tasks, updatedAt: now } : workspace;
}