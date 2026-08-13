import type { EntityId } from "@/core/identity";

export type TodayItem = {
  id: EntityId;
  sourceModule: string;
  sourceEntityId: EntityId;
  sourceLabel: string;
  title: string;
  durationMinutes: number;
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
  return summaries
    .flatMap((summary) => summary.items)
    .sort((a, b) => {
      if (!a.dueAt && !b.dueAt) return 0;
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return a.dueAt.localeCompare(b.dueAt);
    });
}
