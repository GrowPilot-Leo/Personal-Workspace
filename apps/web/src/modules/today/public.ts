import type { EntityId } from "@/core/identity";
import type { TaskPriority, TaskSubtask } from "@/core/tasks";

export type TodayItem = {
  id: EntityId;
  sourceModule: string;
  sourceEntityId: EntityId;
  sourceLabel: string;
  title: string;
  durationMinutes: number;
  priority: TaskPriority;
  tags: string[];
  subtasks: TaskSubtask[];
  createdAt: string;
  dueAt?: string;
  status: "planned" | "active" | "done";
};

export type ModuleSummary = {
  moduleId: string;
  items: TodayItem[];
};

/**
 * Pure aggregation of today items from module summaries.
 * Today never mutates module data; it composes read-only summaries.
 * Items without a due time sort after items that have one.
 */
export function aggregateTodayItems(summaries: ModuleSummary[]): TodayItem[] {
  const statusRank = { active: 0, planned: 1, done: 2 } as const;
  const priorityRank = { high: 0, medium: 1, low: 2 } as const;

  return summaries
    .flatMap((summary) => summary.items)
    .sort((a, b) => {
      const statusDifference = statusRank[a.status] - statusRank[b.status];
      if (statusDifference !== 0) return statusDifference;

      if (a.dueAt || b.dueAt) {
        if (!a.dueAt) return 1;
        if (!b.dueAt) return -1;
        const dueDifference = a.dueAt.localeCompare(b.dueAt);
        if (dueDifference !== 0) return dueDifference;
      }

      const priorityDifference =
        priorityRank[a.priority] - priorityRank[b.priority];
      if (priorityDifference !== 0) return priorityDifference;
      return a.createdAt.localeCompare(b.createdAt);
    });
}
