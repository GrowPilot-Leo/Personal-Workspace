import type { DateKey, EntityId, IsoDateTime } from "@/core/identity";

export type TaskStatus = "planned" | "active" | "done";
export type TaskPriority = "high" | "medium" | "low";

export type TaskOwnerModule = "learning" | "career" | "english" | "fitness";

export type TaskSubtask = {
  id: EntityId;
  title: string;
  completed: boolean;
};

export type Task = {
  id: EntityId;
  ownerModuleId: TaskOwnerModule;
  ownerEntityId: EntityId;
  title: string;
  description: string;
  durationMinutes: number;
  scheduledDate: DateKey;
  priority: TaskPriority;
  tags: string[];
  subtasks: TaskSubtask[];
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
  priority?: TaskPriority;
  tags?: string[];
  subtasks?: Array<{
    id?: EntityId;
    title: string;
    completed?: boolean;
  }>;
  dueAt?: IsoDateTime | null;
  now?: IsoDateTime;
};

function normalizeTags(tags: string[] | undefined): string[] {
  const normalized: string[] = [];
  for (const value of tags ?? []) {
    const tag = value.trim();
    if (!tag || normalized.includes(tag)) continue;
    normalized.push(tag);
    if (normalized.length === 3) break;
  }
  return normalized;
}

function normalizeSubtasks(
  subtasks: TaskInput["subtasks"],
): TaskSubtask[] {
  const normalized: TaskSubtask[] = [];
  const seen = new Set<string>();
  for (const value of subtasks ?? []) {
    const title = value.title.trim();
    if (!title) continue;
    const id = value.id ?? crypto.randomUUID();
    if (seen.has(id)) continue;
    seen.add(id);
    normalized.push({
      id,
      title,
      completed: value.completed ?? false,
    });
  }
  return normalized;
}

export function createTask(input: TaskInput): Task {
  const now = input.now ?? new Date().toISOString();
  const title = input.title.trim();
  if (!title) throw new Error("Task title is required");

  return {
    id: input.id ?? crypto.randomUUID(),
    ownerModuleId: input.ownerModuleId,
    ownerEntityId: input.ownerEntityId,
    title,
    description: input.description?.trim() ?? "",
    durationMinutes: input.durationMinutes ?? 25,
    scheduledDate: input.scheduledDate,
    priority: input.priority ?? "medium",
    tags: normalizeTags(input.tags),
    subtasks: normalizeSubtasks(input.subtasks),
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
