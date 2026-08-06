import type { EntityId } from "@/core/identity";
import type { Task } from "@/core/tasks";

export type EnglishSkillDimension = "listening" | "speaking" | "reading" | "writing";

export type EnglishTaskSummary = {
  id: EntityId;
  title: string;
  dimension: EnglishSkillDimension;
  dueAt?: string;
  status: "planned" | "active" | "done";
};

export type EnglishTaskInput = Task & { dimension: EnglishSkillDimension };

/**
 * Maps English tasks to Today summaries, keeping skill dimensions explicit.
 */
export function englishTaskSummaries(tasks: EnglishTaskInput[]): EnglishTaskSummary[] {
  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    dimension: task.dimension,
    dueAt: task.dueAt ?? undefined,
    status: task.status,
  }));
}
