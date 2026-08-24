import { createId, isDateKey } from "../../core/identity.ts";
import type { DateKey, EntityId, IsoDateTime } from "../../core/identity.ts";
import type { LearningSpace } from "../../core/learning.ts";
import { activePlanData } from "../../core/plans.ts";
import { createTask, type TaskPriority } from "../../core/tasks.ts";
import type { WorkspaceStateV2 } from "../../core/workspace-state.ts";

export type LearningTaskDraft = {
  title: string;
  description?: string;
  scheduledDate: DateKey;
  durationMinutes?: number;
  priority?: TaskPriority;
  tags?: string[];
  subtasks?: Array<{
    id?: EntityId;
    title: string;
    completed?: boolean;
  }>;
};

function eligibleSpace(space: LearningSpace): boolean {
  return space.status !== "archived";
}

export function ensureDefaultLearningWorkspace(
  workspace: WorkspaceStateV2,
  now: IsoDateTime,
): { workspace: WorkspaceStateV2; space: LearningSpace } {
  const named = workspace.learningSpaces.find(
    (space) => eligibleSpace(space) && space.name === "我的学习",
  );
  const active = workspace.learningSpaces.find(
    (space) => eligibleSpace(space) && space.status === "active",
  );
  const editable = workspace.learningSpaces.find(eligibleSpace);
  const existing = named ?? active ?? editable;

  if (existing) {
    if (existing.status === "active") {
      return { workspace, space: existing };
    }
    const promoted = { ...existing, status: "active" as const, updatedAt: now };
    return {
      workspace: {
        ...workspace,
        learningSpaces: workspace.learningSpaces.map((space) =>
          space.id === promoted.id ? promoted : space,
        ),
        updatedAt: now,
      },
      space: promoted,
    };
  }

  const space: LearningSpace = {
    id: createId(),
    name: "我的学习",
    goal: "",
    status: "active",
    templateId: "blank",
    currentMonthlyPlanId: null,
    createdAt: now,
    updatedAt: now,
  };
  return {
    workspace: {
      ...workspace,
      learningSpaces: [...workspace.learningSpaces, space],
      updatedAt: now,
    },
    space,
  };
}

function validateDraft(draft: LearningTaskDraft): void {
  if (!draft.title.trim()) throw new Error("Learning task title is required");
  if (!isDateKey(draft.scheduledDate)) {
    throw new Error("Learning task date is invalid");
  }
  if (
    draft.durationMinutes !== undefined &&
    (!Number.isFinite(draft.durationMinutes) || draft.durationMinutes <= 0)
  ) {
    throw new Error("Learning task duration must be positive");
  }
}

function editableOwnedTask(
  workspace: WorkspaceStateV2,
  taskId: EntityId,
) {
  const task = workspace.tasks.find((candidate) => candidate.id === taskId);
  if (!task || task.ownerModuleId !== "learning" || task.status === "done") {
    return null;
  }
  const space = workspace.learningSpaces.find(
    (candidate) =>
      candidate.id === task.ownerEntityId && candidate.status !== "archived",
  );
  return space ? task : null;
}

export function createLearningWorkspaceTask(
  workspace: WorkspaceStateV2,
  draft: LearningTaskDraft,
  now: IsoDateTime,
): WorkspaceStateV2 {
  validateDraft(draft);
  const selected = ensureDefaultLearningWorkspace(workspace, now);
  const task = createTask({
    ...draft,
    ownerModuleId: "learning",
    ownerEntityId: selected.space.id,
    now,
  });
  return {
    ...selected.workspace,
    tasks: [...selected.workspace.tasks, task],
    events: [
      ...selected.workspace.events,
      {
        eventId: createId(),
        eventType: "learning.task.scheduled",
        moduleId: "learning",
        entityId: task.id,
        schemaVersion: 1,
        occurredAt: now,
        payload: { taskId: task.id },
      },
    ],
    updatedAt: now,
  };
}

export function updateLearningWorkspaceTask(
  workspace: WorkspaceStateV2,
  taskId: EntityId,
  draft: LearningTaskDraft,
  now: IsoDateTime,
): WorkspaceStateV2 {
  const task = editableOwnedTask(workspace, taskId);
  if (!task) return workspace;
  validateDraft(draft);
  const normalized = createTask({
    ...draft,
    id: task.id,
    ownerModuleId: task.ownerModuleId,
    ownerEntityId: task.ownerEntityId,
    now: task.createdAt,
  });
  const updated = {
    ...task,
    title: normalized.title,
    description: normalized.description,
    durationMinutes: normalized.durationMinutes,
    scheduledDate: normalized.scheduledDate,
    priority: normalized.priority,
    tags: normalized.tags,
    subtasks: normalized.subtasks,
    updatedAt: now,
  };
  return {
    ...workspace,
    tasks: workspace.tasks.map((current) =>
      current.id === taskId ? updated : current,
    ),
    updatedAt: now,
  };
}

export function removeUnfinishedLearningTask(
  workspace: WorkspaceStateV2,
  taskId: EntityId,
  now: IsoDateTime,
): WorkspaceStateV2 {
  const task = editableOwnedTask(workspace, taskId);
  if (!task) return workspace;

  return {
    ...workspace,
    tasks: workspace.tasks.filter((current) => current.id !== taskId),
    plans: workspace.plans.map((plan) => {
      if (
        plan.ownerModuleId !== "learning" ||
        plan.ownerEntityId !== task.ownerEntityId
      ) {
        return plan;
      }
      const currentData = activePlanData(plan);
      if (!currentData.taskIds.includes(taskId)) return plan;
      return {
        ...plan,
        versions: plan.versions.map((version) =>
          version.version === plan.activeVersion
            ? {
                ...version,
                data: {
                  ...version.data,
                  taskIds: version.data.taskIds.filter((id) => id !== taskId),
                },
              }
            : version,
        ),
        updatedAt: now,
      };
    }),
    updatedAt: now,
  };
}
