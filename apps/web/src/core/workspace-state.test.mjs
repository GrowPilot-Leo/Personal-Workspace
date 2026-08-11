import test from "node:test";
import assert from "node:assert/strict";
import {
  appendDomainEvent,
  appendReview,
  createEmptyWorkspaceStateV2,
  normalizeWorkspaceStateV2,
  replaceLearningPlan,
  upsertLearningSpace,
  upsertTask,
} from "./workspace-state.ts";

const CREATED_AT = "2026-08-10T08:00:00Z";

function learningSpace(overrides = {}) {
  return {
    id: "learning-space-1",
    name: "RAG foundations",
    goal: "Build a reliable retrieval prototype",
    status: "active",
    templateId: "blank",
    currentMonthlyPlanId: null,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    ...overrides,
  };
}

function learningPlan(overrides = {}) {
  return {
    id: "learning-plan-1",
    ownerModuleId: "learning",
    ownerEntityId: "learning-space-1",
    horizon: "weekly",
    versions: [
      {
        version: 1,
        createdAt: CREATED_AT,
        reason: "initial",
        data: {
          learningSpaceId: "learning-space-1",
          periodKey: "2026-W33",
          title: "Week 33",
          goal: "Learn retrieval basics",
          parentPlanId: null,
          taskIds: ["task-1"],
          capacityMinutes: 120,
        },
      },
    ],
    activeVersion: 1,
    updatedAt: CREATED_AT,
    ...overrides,
  };
}

function task(overrides = {}) {
  return {
    id: "task-1",
    ownerModuleId: "learning",
    ownerEntityId: "learning-space-1",
    title: "Read retrieval notes",
    description: "",
    durationMinutes: 30,
    scheduledDate: "2026-08-10",
    status: "planned",
    dueAt: null,
    completedAt: null,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    ...overrides,
  };
}

function review(overrides = {}) {
  return {
    id: "review-1",
    ownerModuleId: "learning",
    ownerEntityId: "learning-space-1",
    horizon: "daily",
    periodKey: "2026-08-10",
    wins: "Read the notes",
    blockers: "",
    adjustment: "",
    submittedAt: CREATED_AT,
    updatedAt: CREATED_AT,
    ...overrides,
  };
}

function domainEvent(overrides = {}) {
  return {
    eventId: "event-1",
    eventType: "learning.task.scheduled",
    moduleId: "learning",
    entityId: "task-1",
    schemaVersion: 1,
    occurredAt: CREATED_AT,
    payload: { taskId: "task-1" },
    ...overrides,
  };
}

// Mutation caught: createEmptyWorkspaceStateV2 omits V2 metadata or any Stage 3 collection.
test("empty V2 workspace state has version 2 and empty Stage 3 collections", () => {
  assert.deepEqual(createEmptyWorkspaceStateV2("2026-08-10T09:00:00Z"), {
    version: 2,
    learningSpaces: [],
    plans: [],
    tasks: [],
    reviews: [],
    events: [],
    updatedAt: "2026-08-10T09:00:00Z",
  });
});

// Mutation caught: normalizeWorkspaceStateV2 lets one malformed collection erase valid collections.
test("normalization isolates malformed collections without blanking valid collections", () => {
  const state = normalizeWorkspaceStateV2(
    {
      version: 2,
      learningSpaces: [learningSpace()],
      plans: "not an array",
      tasks: [task()],
      reviews: null,
      events: [domainEvent()],
      updatedAt: CREATED_AT,
    },
    "2026-08-10T09:00:00Z",
  );

  assert.deepEqual(state.learningSpaces, [learningSpace()]);
  assert.deepEqual(state.plans, []);
  assert.deepEqual(state.tasks, [task()]);
  assert.deepEqual(state.reviews, []);
  assert.deepEqual(state.events, [domainEvent()]);
});

// Mutation caught: normalizeWorkspaceStateV2 keeps later duplicate IDs or lets an invalid record reserve an ID.
test("normalization de-duplicates every entity collection with the first valid record winning", () => {
  const state = normalizeWorkspaceStateV2(
    {
      version: 2,
      learningSpaces: [
        learningSpace({ id: "space-duplicate", name: "" }),
        learningSpace({ id: "space-duplicate", name: "Keep this space" }),
        learningSpace({ id: "space-duplicate", name: "Discard this space" }),
      ],
      plans: [
        learningPlan({ id: "plan-duplicate", versions: [] }),
        learningPlan({ id: "plan-duplicate", updatedAt: "2026-08-10T08:01:00Z" }),
        learningPlan({ id: "plan-duplicate", updatedAt: "2026-08-10T08:02:00Z" }),
      ],
      tasks: [
        task({ id: "task-duplicate", title: "" }),
        task({ id: "task-duplicate", title: "Keep this task" }),
        task({ id: "task-duplicate", title: "Discard this task" }),
      ],
      reviews: [
        review({ id: "review-duplicate", periodKey: "" }),
        review({ id: "review-duplicate", wins: "Keep this review" }),
        review({ id: "review-duplicate", wins: "Discard this review" }),
      ],
      events: [
        domainEvent({ eventId: "event-duplicate", eventType: "not.a.real.event" }),
        domainEvent({ eventId: "event-duplicate", payload: { kept: true } }),
        domainEvent({ eventId: "event-duplicate", payload: { kept: false } }),
      ],
      updatedAt: CREATED_AT,
    },
    "2026-08-10T09:00:00Z",
  );

  assert.equal(state.learningSpaces.length, 1);
  assert.equal(state.learningSpaces[0].name, "Keep this space");
  assert.equal(state.plans.length, 1);
  assert.equal(state.plans[0].updatedAt, "2026-08-10T08:01:00Z");
  assert.equal(state.tasks.length, 1);
  assert.equal(state.tasks[0].title, "Keep this task");
  assert.equal(state.reviews.length, 1);
  assert.equal(state.reviews[0].wins, "Keep this review");
  assert.equal(state.events.length, 1);
  assert.deepEqual(state.events[0].payload, { kept: true });
});

// Mutation caught: normalizeWorkspaceStateV2 spreads or reads unknown root fields.
test("normalization ignores unknown root fields without executing or trusting them", () => {
  const input = {
    version: 2,
    learningSpaces: [],
    plans: [],
    tasks: [],
    reviews: [],
    events: [],
    updatedAt: CREATED_AT,
    futureCollection: [{ id: "untrusted" }],
  };
  Object.defineProperty(input, "executeOnRead", {
    enumerable: true,
    get() {
      throw new Error("unknown root field must not execute");
    },
  });

  const state = normalizeWorkspaceStateV2(input, "2026-08-10T09:00:00Z");

  assert.deepEqual(Object.keys(state).sort(), [
    "events",
    "learningSpaces",
    "plans",
    "reviews",
    "tasks",
    "updatedAt",
    "version",
  ]);
  assert.equal("futureCollection" in state, false);
  assert.equal("executeOnRead" in state, false);
});

// Mutations caught: upsertLearningSpace, replaceLearningPlan, upsertTask,
// appendReview, or appendDomainEvent returns a state with stale updatedAt.
test("every workspace update refreshes updatedAt", () => {
  let state = createEmptyWorkspaceStateV2("2026-08-10T09:00:00Z");

  state = upsertLearningSpace(state, learningSpace(), "2026-08-10T09:01:00Z");
  assert.equal(state.updatedAt, "2026-08-10T09:01:00Z");

  state = replaceLearningPlan(state, learningPlan(), "2026-08-10T09:02:00Z");
  assert.equal(state.updatedAt, "2026-08-10T09:02:00Z");

  state = upsertTask(state, task(), "2026-08-10T09:03:00Z");
  assert.equal(state.updatedAt, "2026-08-10T09:03:00Z");

  state = appendReview(state, review(), "2026-08-10T09:04:00Z");
  assert.equal(state.updatedAt, "2026-08-10T09:04:00Z");

  state = appendDomainEvent(state, domainEvent(), "2026-08-10T09:05:00Z");
  assert.equal(state.updatedAt, "2026-08-10T09:05:00Z");
});
