import test from "node:test";
import assert from "node:assert/strict";
import { buildTodayViewState } from "./today-actions.ts";

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

test("buildTodayViewState summarizes real task state", () => {
  const view = buildTodayViewState(loop, false);
  assert.equal(view.date, "2026-08-06");
  assert.equal(view.goal, "掌握 RAG");
  assert.equal(view.planned, 2);
  assert.equal(view.completed, 1);
  assert.equal(view.totalMinutes, 75);
  assert.ok(view.suggestion.length > 0);
  assert.equal(view.reviewDue, false);
});

test("reviewDue flag is passed through", () => {
  const view = buildTodayViewState(loop, true);
  assert.equal(view.reviewDue, true);
});
