import test from "node:test";
import assert from "node:assert/strict";
import {
  buildNextDaySuggestion,
  completedTaskCount,
  normalizeDailyLoopState,
  rollDailyLoopForward,
} from "./daily-loop.ts";

test("normalization drops invalid tasks and clamps time values", () => {
  const state = normalizeDailyLoopState({
    activeDate: "2026-08-03",
    goal: "  完成 RAG 最小方案  ",
    availableMinutes: 999,
    tasks: [
      { id: "a", title: " 画检索流程 ", durationMinutes: 5, createdAt: "now" },
      { id: "b", title: "", durationMinutes: 30 },
      null,
    ],
  });

  assert.equal(state.goal, "完成 RAG 最小方案");
  assert.equal(state.availableMinutes, 480);
  assert.equal(state.tasks.length, 1);
  assert.equal(state.tasks[0].durationMinutes, 10);
});

test("rolling forward archives the day and carries only incomplete tasks", () => {
  const state = normalizeDailyLoopState({
    activeDate: "2026-08-03",
    goal: "掌握 RAG",
    availableMinutes: 60,
    tasks: [
      { id: "done", title: "完成任务", durationMinutes: 20, completedAt: "2026-08-03T01:00:00Z", createdAt: "now" },
      { id: "todo", title: "未完成任务", durationMinutes: 30, completedAt: null, createdAt: "now" },
    ],
    review: { wins: "完成一次输出", blockers: "", adjustment: "缩小范围" },
  });

  const next = rollDailyLoopForward(state);
  assert.equal(next.activeDate, "2026-08-04");
  assert.equal(next.history.length, 1);
  assert.deepEqual(next.tasks.map((task) => task.id), ["todo"]);
  assert.equal(next.review, null);
  assert.equal(completedTaskCount(next), 0);
});

test("suggestion is based on real task state", () => {
  const empty = normalizeDailyLoopState({ activeDate: "2026-08-03" });
  assert.match(buildNextDaySuggestion(empty), /阶段目标/);

  const withTodo = normalizeDailyLoopState({
    activeDate: "2026-08-03",
    goal: "掌握 RAG",
    tasks: [{ id: "todo", title: "画流程", durationMinutes: 20, completedAt: null, createdAt: "now" }],
  });
  assert.match(buildNextDaySuggestion(withTodo), /1 个未完成任务/);
});
