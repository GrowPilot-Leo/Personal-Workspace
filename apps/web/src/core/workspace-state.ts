import type { DomainEvent, DomainEventType } from "./events.ts";
import type { IsoDateTime } from "./identity.ts";
import { isDateKey, isIsoDateTime } from "./identity.ts";
import type { LearningPlanData, LearningSpace, LearningSpaceStatus } from "./learning.ts";
import type { Plan, PlanHorizon } from "./plans.ts";
import type { Review, ReviewHorizon } from "./reviews.ts";
import type { Task, TaskOwnerModule, TaskStatus } from "./tasks.ts";

export type WorkspaceStateV2 = {
  version: 2;
  learningSpaces: LearningSpace[];
  plans: Plan<LearningPlanData>[];
  tasks: Task[];
  reviews: Review[];
  events: DomainEvent[];
  updatedAt: IsoDateTime;
};

const learningSpaceStatuses = new Set<LearningSpaceStatus>([
  "draft",
  "planned",
  "active",
  "paused",
  "completed",
  "archived",
]);

const planHorizons = new Set<PlanHorizon>(["daily", "weekly", "monthly"]);
const reviewHorizons = new Set<ReviewHorizon>(["daily", "weekly", "monthly"]);
const taskOwnerModules = new Set<TaskOwnerModule>(["learning", "career", "english", "fitness"]);
const taskStatuses = new Set<TaskStatus>(["planned", "active", "done"]);
const taskPriorities = new Set(["high", "medium", "low"] as const);
const domainEventTypes = new Set<DomainEventType>([
  "learning.space.created",
  "learning.space.updated",
  "learning.space.paused",
  "learning.task.scheduled",
  "learning.task.completed",
  "learning.space.archived",
  "career.skill-gap.changed",
  "fitness.session.completed",
  "knowledge.resource.updated",
  "badge.earned",
  "plan.revision.proposed",
  "plan.revision.confirmed",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeLearningSpace(value: unknown): LearningSpace | null {
  if (!isRecord(value)) return null;
  if (
    !isText(value.id) ||
    !isText(value.name) ||
    typeof value.goal !== "string" ||
    !learningSpaceStatuses.has(value.status as LearningSpaceStatus) ||
    (value.templateId !== "blank" && value.templateId !== "three-horizon") ||
    (value.currentMonthlyPlanId !== null && !isText(value.currentMonthlyPlanId)) ||
    !isIsoDateTime(value.createdAt) ||
    !isIsoDateTime(value.updatedAt)
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    goal: value.goal,
    status: value.status as LearningSpaceStatus,
    templateId: value.templateId,
    currentMonthlyPlanId: value.currentMonthlyPlanId,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function normalizeLearningPlanData(value: unknown): LearningPlanData | null {
  if (!isRecord(value)) return null;
  if (
    !isText(value.learningSpaceId) ||
    !isText(value.periodKey) ||
    !isText(value.title) ||
    typeof value.goal !== "string" ||
    (value.parentPlanId !== null && !isText(value.parentPlanId)) ||
    !Array.isArray(value.taskIds) ||
    !value.taskIds.every(isText) ||
    (value.capacityMinutes !== null &&
      (typeof value.capacityMinutes !== "number" || !Number.isFinite(value.capacityMinutes)))
  ) {
    return null;
  }

  return {
    learningSpaceId: value.learningSpaceId,
    periodKey: value.periodKey,
    title: value.title,
    goal: value.goal,
    parentPlanId: value.parentPlanId,
    taskIds: [...value.taskIds],
    capacityMinutes: value.capacityMinutes,
  };
}

function normalizeLearningPlan(value: unknown): Plan<LearningPlanData> | null {
  if (
    !isRecord(value) ||
    !isText(value.id) ||
    !isText(value.ownerModuleId) ||
    !isText(value.ownerEntityId) ||
    !planHorizons.has(value.horizon as PlanHorizon) ||
    !Array.isArray(value.versions) ||
    value.versions.length === 0 ||
    typeof value.activeVersion !== "number" ||
    !Number.isInteger(value.activeVersion) ||
    !isIsoDateTime(value.updatedAt)
  ) {
    return null;
  }

  const versions = value.versions.map((version) => {
    if (
      !isRecord(version) ||
      typeof version.version !== "number" ||
      !Number.isInteger(version.version) ||
      !isIsoDateTime(version.createdAt) ||
      !isText(version.reason)
    ) {
      return null;
    }

    const data = normalizeLearningPlanData(version.data);
    return data
      ? {
          version: version.version,
          createdAt: version.createdAt,
          reason: version.reason,
          data,
        }
      : null;
  });

  if (
    versions.some((version) => version === null) ||
    !versions.some((version) => version?.version === value.activeVersion)
  ) {
    return null;
  }

  return {
    id: value.id,
    ownerModuleId: value.ownerModuleId,
    ownerEntityId: value.ownerEntityId,
    horizon: value.horizon as PlanHorizon,
    versions: versions as Plan<LearningPlanData>["versions"],
    activeVersion: value.activeVersion,
    updatedAt: value.updatedAt,
  };
}

function normalizeTask(value: unknown): Task | null {
  if (
    !isRecord(value) ||
    !isText(value.id) ||
    !taskOwnerModules.has(value.ownerModuleId as TaskOwnerModule) ||
    !isText(value.ownerEntityId) ||
    !isText(value.title) ||
    typeof value.description !== "string" ||
    typeof value.durationMinutes !== "number" ||
    !Number.isFinite(value.durationMinutes) ||
    !isDateKey(value.scheduledDate) ||
    !taskStatuses.has(value.status as TaskStatus) ||
    (value.dueAt !== null && !isIsoDateTime(value.dueAt)) ||
    (value.completedAt !== null && !isIsoDateTime(value.completedAt)) ||
    !isIsoDateTime(value.createdAt) ||
    !isIsoDateTime(value.updatedAt)
  ) {
    return null;
  }

  const tags: string[] = [];
  if (Array.isArray(value.tags)) {
    for (const candidate of value.tags) {
      if (typeof candidate !== "string") continue;
      const tag = candidate.trim();
      if (!tag || tags.includes(tag)) continue;
      tags.push(tag);
      if (tags.length === 3) break;
    }
  }

  const subtasks: Task["subtasks"] = [];
  const seenSubtasks = new Set<string>();
  if (Array.isArray(value.subtasks)) {
    for (const candidate of value.subtasks) {
      if (
        !isRecord(candidate) ||
        !isText(candidate.id) ||
        !isText(candidate.title) ||
        typeof candidate.completed !== "boolean" ||
        seenSubtasks.has(candidate.id)
      ) {
        continue;
      }
      seenSubtasks.add(candidate.id);
      subtasks.push({
        id: candidate.id,
        title: candidate.title.trim(),
        completed: candidate.completed,
      });
    }
  }

  return {
    id: value.id,
    ownerModuleId: value.ownerModuleId as TaskOwnerModule,
    ownerEntityId: value.ownerEntityId,
    title: value.title.trim(),
    description: value.description,
    durationMinutes: value.durationMinutes,
    scheduledDate: value.scheduledDate,
    priority: taskPriorities.has(value.priority as Task["priority"])
      ? (value.priority as Task["priority"])
      : "medium",
    tags,
    subtasks,
    status: value.status as TaskStatus,
    dueAt: value.dueAt,
    completedAt: value.completedAt,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}
function normalizeReview(value: unknown): Review | null {
  if (
    !isRecord(value) ||
    !isText(value.id) ||
    !isText(value.ownerModuleId) ||
    (value.ownerEntityId !== null && !isText(value.ownerEntityId)) ||
    !reviewHorizons.has(value.horizon as ReviewHorizon) ||
    !isText(value.periodKey) ||
    typeof value.wins !== "string" ||
    typeof value.blockers !== "string" ||
    typeof value.adjustment !== "string" ||
    !isIsoDateTime(value.submittedAt) ||
    !isIsoDateTime(value.updatedAt)
  ) {
    return null;
  }

  return {
    id: value.id,
    ownerModuleId: value.ownerModuleId,
    ownerEntityId: value.ownerEntityId,
    horizon: value.horizon as ReviewHorizon,
    periodKey: value.periodKey,
    wins: value.wins,
    blockers: value.blockers,
    adjustment: value.adjustment,
    submittedAt: value.submittedAt,
    updatedAt: value.updatedAt,
  };
}

function normalizeDomainEvent(value: unknown): DomainEvent | null {
  if (
    !isRecord(value) ||
    !isText(value.eventId) ||
    !domainEventTypes.has(value.eventType as DomainEventType) ||
    !isText(value.moduleId) ||
    !isText(value.entityId) ||
    typeof value.schemaVersion !== "number" ||
    !Number.isInteger(value.schemaVersion) ||
    !isIsoDateTime(value.occurredAt) ||
    !("payload" in value)
  ) {
    return null;
  }

  return {
    eventId: value.eventId,
    eventType: value.eventType as DomainEventType,
    moduleId: value.moduleId,
    entityId: value.entityId,
    schemaVersion: value.schemaVersion,
    occurredAt: value.occurredAt,
    payload: value.payload,
  };
}

function normalizeCollection<T>(
  value: unknown,
  normalize: (entry: unknown) => T | null,
  getId: (entry: T) => string,
): T[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const normalized: T[] = [];
  for (const entry of value) {
    const valid = normalize(entry);
    if (!valid) continue;

    const id = getId(valid);
    if (seen.has(id)) continue;
    seen.add(id);
    normalized.push(valid);
  }
  return normalized;
}

export function createEmptyWorkspaceStateV2(now: IsoDateTime): WorkspaceStateV2 {
  return {
    version: 2,
    learningSpaces: [],
    plans: [],
    tasks: [],
    reviews: [],
    events: [],
    updatedAt: now,
  };
}

export function normalizeWorkspaceStateV2(
  value: unknown,
  now: IsoDateTime,
): WorkspaceStateV2 {
  if (!isRecord(value) || value.version !== 2) {
    return createEmptyWorkspaceStateV2(now);
  }

  return {
    version: 2,
    learningSpaces: normalizeCollection(value.learningSpaces, normalizeLearningSpace, (space) => space.id),
    plans: normalizeCollection(value.plans, normalizeLearningPlan, (plan) => plan.id),
    tasks: normalizeCollection(value.tasks, normalizeTask, (task) => task.id),
    reviews: normalizeCollection(value.reviews, normalizeReview, (review) => review.id),
    events: normalizeCollection(value.events, normalizeDomainEvent, (event) => event.eventId),
    updatedAt: isIsoDateTime(value.updatedAt) ? value.updatedAt : now,
  };
}

export function upsertLearningSpace(
  state: WorkspaceStateV2,
  space: LearningSpace,
  now: IsoDateTime,
): WorkspaceStateV2 {
  const exists = state.learningSpaces.some((current) => current.id === space.id);
  return {
    ...state,
    learningSpaces: exists
      ? state.learningSpaces.map((current) => (current.id === space.id ? space : current))
      : [...state.learningSpaces, space],
    updatedAt: now,
  };
}

export function replaceLearningPlan(
  state: WorkspaceStateV2,
  plan: Plan<LearningPlanData>,
  now: IsoDateTime,
): WorkspaceStateV2 {
  const exists = state.plans.some((current) => current.id === plan.id);
  return {
    ...state,
    plans: exists
      ? state.plans.map((current) => (current.id === plan.id ? plan : current))
      : [...state.plans, plan],
    updatedAt: now,
  };
}

export function upsertTask(
  state: WorkspaceStateV2,
  task: Task,
  now: IsoDateTime,
): WorkspaceStateV2 {
  const exists = state.tasks.some((current) => current.id === task.id);
  return {
    ...state,
    tasks: exists
      ? state.tasks.map((current) => (current.id === task.id ? task : current))
      : [...state.tasks, task],
    updatedAt: now,
  };
}

export function appendReview(
  state: WorkspaceStateV2,
  review: Review,
  now: IsoDateTime,
): WorkspaceStateV2 {
  return {
    ...state,
    reviews: [...state.reviews, review],
    updatedAt: now,
  };
}

export function appendDomainEvent(
  state: WorkspaceStateV2,
  event: DomainEvent,
  now: IsoDateTime,
): WorkspaceStateV2 {
  return {
    ...state,
    events: [...state.events, event],
    updatedAt: now,
  };
}
