import type { DateKey, EntityId, IsoDateTime } from "@/core/identity";

export type TaskStatus = "planned" | "active" | "done";

export type TaskOwnerModule = "learning" | "career" | "english" | "fitness";

export type Task = {
  id: EntityId;
  ownerModuleId: TaskOwnerModule;
  ownerEntityId: EntityId;
  title: string;
  description: string;
  durationMinutes: number;
  scheduledDate: DateKey;
  status: TaskStatus;
  dueAt: IsoDateTime | null;
  completedAt: IsoDateTime | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type TaskInput = {
  id?: EntityId;
  ownerModuleId: TaskOwnerModule;
  ownerEntityId: EntityId;
  title: string;
  description?: string;
  durationMinutes?: number;
  scheduledDate: DateKey;
  dueAt?: IsoDateTime | null;
  now?: IsoDateTime;
};

export function createTask(input: TaskInput): Task {
  const now = input.now ?? new Date().toISOString();
  return {
    id: input.id ?? crypto.randomUUID(),
    ownerModuleId: input.ownerModuleId,
    ownerEntityId: input.ownerEntityId,
    title: input.title,
    description: input.description ?? "",
    durationMinutes: input.durationMinutes ?? 25,
    scheduledDate: input.scheduledDate,
    status: "planned",
    dueAt: input.dueAt ?? null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function completeTask(task: Task, now: IsoDateTime = new Date().toISOString()): Task {
  return { ...task, status: "done", completedAt: now, updatedAt: now };
}

export function isTaskDone(task: Task): boolean {
  return task.status === "done" && task.completedAt !== null;
}
