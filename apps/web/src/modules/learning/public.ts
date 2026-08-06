import type { EntityId } from "@/core/identity";
import type { Task } from "@/core/tasks";

export type LearningSpaceStatus = "draft" | "planned" | "active" | "paused" | "completed" | "archived";

export type LearningSpaceSummary = {
  id: EntityId;
  name: string;
  goal: string;
  status: LearningSpaceStatus;
  planHorizon: "daily" | "weekly" | "monthly";
};

export type LearningTaskSummary = {
  id: EntityId;
  title: string;
  dueAt?: string;
  status: "planned" | "active" | "done";
};

/**
 * Maps a learning space's active plan tasks to Today summaries.
 * Pure function: reads task contracts, returns read-only summaries.
 */
export function summarizeTasksForToday(space: LearningSpaceSummary, tasks: Task[]): LearningTaskSummary[] {
  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    dueAt: task.dueAt ?? undefined,
    status: task.status,
  }));
}
