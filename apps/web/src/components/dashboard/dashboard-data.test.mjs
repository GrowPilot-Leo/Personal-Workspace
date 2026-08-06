import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDashboardData,
  demoKnowledgeUpdates,
  demoLearningProgress,
  demoPrompts,
  demoProjects,
  demoReviews,
} from "./dashboard-data.ts";

const loop = {
  activeDate: "2026-08-06",
  goal: "掌握 RAG",
  availableMinutes: 90,
  tasks: [
    {
      id: "a",
      title: "读论文",
      durationMinutes: 30,
      completedAt: "2026-08-06T01:00:00Z",
      createdAt: "x",
    },
    {
      id: "b",
      title: "画流程图",
      durationMinutes: 45,
      completedAt: null,
      createdAt: "x",
    },
  ],
  review: null,
  history: [],
};

test("buildDashboardData derives real aggregates from daily loop", () => {
  const data = buildDashboardData(loop);
  assert.equal(data.date, "2026-08-06");
  assert.equal(data.goal, "掌握 RAG");
  assert.equal(data.planned, 2);
  assert.equal(data.completed, 1);
  assert.equal(data.totalMinutes, 75);
  assert.ok(data.suggestion.length > 0);
});

test("demo rows are non-empty and shaped correctly", () => {
  assert.ok(demoLearningProgress.length >= 3);
  assert.ok(demoKnowledgeUpdates.length >= 3);
  assert.ok(demoProjects.length >= 3);
  assert.ok(demoPrompts.length >= 3);
  assert.ok(demoReviews.length >= 3);

  for (const item of demoLearningProgress) {
    assert.ok(item.progress >= 0 && item.progress <= 100);
  }
  for (const item of demoProjects) {
    assert.ok(["on-track", "at-risk", "done"].includes(item.status));
  }
});
