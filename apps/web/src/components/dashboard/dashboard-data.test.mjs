import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildDashboardData, demoPrompts } from "./dashboard-data.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(__dirname, "dashboard-data.ts"), "utf8");

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

test("buildDashboardData with no tasks shows honest zeros", () => {
  const empty = { ...loop, tasks: [], goal: "" };
  const data = buildDashboardData(empty);
  assert.equal(data.planned, 0);
  assert.equal(data.completed, 0);
  assert.equal(data.totalMinutes, 0);
});

test("prompt configuration is shaped correctly", () => {
  assert.ok(demoPrompts.length >= 3);
  for (const item of demoPrompts) {
    assert.ok(item.label.length > 0);
    assert.ok(item.prompt.length > 0);
  }
});

// V3-004: demo business data (learning/projects/knowledge/reviews) must
// NOT exist in dashboard-data — modules render honest empty states.
test("no invented business demo rows remain", () => {
  assert.equal(source.includes("demoLearningProgress"), false);
  assert.equal(source.includes("demoProjects"), false);
  assert.equal(source.includes("demoKnowledgeUpdates"), false);
  assert.equal(source.includes("demoReviews"), false);
});
