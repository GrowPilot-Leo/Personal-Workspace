import type { DailyLoopState } from "@/core/daily-loop";
import {
  buildNextDaySuggestion,
  completedTaskCount,
  plannedMinutes,
} from "../../core/daily-loop.ts";

/** Aggregated dashboard data derived from the real V1 daily loop. */
export type DashboardData = {
  date: string;
  goal: string;
  planned: number;
  completed: number;
  totalMinutes: number;
  suggestion: string;
};

/**
 * Pure projection of daily-loop state into dashboard aggregates.
 * No invented values: planned/completed/total derive from real tasks.
 */
export function buildDashboardData(state: DailyLoopState): DashboardData {
  return {
    date: state.activeDate,
    goal: state.goal,
    planned: state.tasks.length,
    completed: completedTaskCount(state),
    totalMinutes: plannedMinutes(state),
    suggestion: buildNextDaySuggestion(state),
  };
}

/**
 * Quick prompts are UI configuration (click to copy), not business
 * results — they stay. Modules without a real backend render an honest
 * empty state instead of invented rows (see V3_READINESS_AND_ACCEPTANCE
 * V3-004: no untraceable percentages/dates/reviews in default mode).
 */
export type PromptItem = {
  id: string;
  label: string;
  prompt: string;
};

export const demoPrompts: PromptItem[] = [
  { id: "pr1", label: "复盘今日", prompt: "帮我复盘今天的目标完成情况" },
  { id: "pr2", label: "生成周计划", prompt: "根据本周复盘生成下周计划" },
  { id: "pr3", label: "拆解目标", prompt: "把「掌握 RAG」拆成可执行步骤" },
];
