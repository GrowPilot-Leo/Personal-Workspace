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

/** Demo rows for modules that have no backend yet (Phase 1 boundary). */
export type LearningProgressItem = {
  id: string;
  title: string;
  progress: number; // 0-100
};

export type KnowledgeUpdateItem = {
  id: string;
  title: string;
  updatedAt: string;
};

export type ProjectProgressItem = {
  id: string;
  title: string;
  progress: number; // 0-100
  status: "on-track" | "at-risk" | "done";
};

export type PromptItem = {
  id: string;
  label: string;
  prompt: string;
};

export type ReviewItem = {
  id: string;
  date: string;
  wins: string;
};

export const demoLearningProgress: LearningProgressItem[] = [
  { id: "l1", title: "RAG 系统设计", progress: 45 },
  { id: "l2", title: "英语口语周练", progress: 70 },
  { id: "l3", title: "健身动作学习", progress: 30 },
];

export const demoKnowledgeUpdates: KnowledgeUpdateItem[] = [
  { id: "k1", title: "向量检索白皮书", updatedAt: "2 小时前" },
  { id: "k2", title: "Notion 交互设计摘录", updatedAt: "昨天" },
  { id: "k3", title: "RAG 评测方法笔记", updatedAt: "3 天前" },
];

export const demoProjects: ProjectProgressItem[] = [
  { id: "p1", title: "V2 视觉重构", progress: 35, status: "on-track" },
  { id: "p2", title: "知识库 RAG", progress: 60, status: "on-track" },
  { id: "p3", title: "健身计划 V1", progress: 85, status: "at-risk" },
];

export const demoPrompts: PromptItem[] = [
  { id: "pr1", label: "复盘今日", prompt: "帮我复盘今天的目标完成情况" },
  { id: "pr2", label: "生成周计划", prompt: "根据本周复盘生成下周计划" },
  { id: "pr3", label: "拆解目标", prompt: "把「掌握 RAG」拆成可执行步骤" },
];

export const demoReviews: ReviewItem[] = [
  { id: "r1", date: "2026-08-05", wins: "完成视觉重构骨架" },
  { id: "r2", date: "2026-08-04", wins: "跑通三主题切换" },
  { id: "r3", date: "2026-08-03", wins: "读完检索论文第一章" },
];
