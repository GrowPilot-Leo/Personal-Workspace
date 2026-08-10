import type { EntityId, IsoDateTime } from "./identity.ts";

export type LearningSpaceStatus =
  | "draft"
  | "planned"
  | "active"
  | "paused"
  | "completed"
  | "archived";

export type LearningSpace = {
  id: EntityId;
  name: string;
  goal: string;
  status: LearningSpaceStatus;
  templateId: "blank" | "three-horizon";
  currentMonthlyPlanId: EntityId | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type LearningPlanData = {
  learningSpaceId: EntityId;
  periodKey: string;
  title: string;
  goal: string;
  parentPlanId: EntityId | null;
  taskIds: EntityId[];
  capacityMinutes: number | null;
};
