import type { EntityId, IsoDateTime } from "@/core/identity";

export type GoalStatus = "draft" | "active" | "paused" | "completed" | "archived";

export type Goal = {
  id: EntityId;
  title: string;
  description: string;
  status: GoalStatus;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  completedAt: IsoDateTime | null;
};

export function createGoal(input: {
  title: string;
  description?: string;
  id?: EntityId;
  now?: IsoDateTime;
}): Goal {
  const now = input.now ?? new Date().toISOString();
  return {
    id: input.id ?? crypto.randomUUID(),
    title: input.title,
    description: input.description ?? "",
    status: "draft",
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };
}
