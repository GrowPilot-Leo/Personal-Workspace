import type { EntityId } from "@/core/identity";
import type { Task } from "@/core/tasks";

export type SkillGap = {
  id: EntityId;
  skill: string;
  currentState: string;
  targetState: string;
  linkedSpaceId: EntityId | null;
};

export type CareerTaskSummary = {
  id: EntityId;
  title: string;
  dueAt?: string;
  status: "planned" | "active" | "done";
};

/**
 * Maps career tasks to Today summaries. Career orchestrates learning spaces;
 * it does not copy their content into summaries.
 */
export function careerTaskSummaries(tasks: Task[]): CareerTaskSummary[] {
  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    dueAt: task.dueAt ?? undefined,
    status: task.status,
  }));
}
