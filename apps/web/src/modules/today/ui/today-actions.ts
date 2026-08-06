import type { DailyLoopState } from "@/core/daily-loop";
import {
  buildNextDaySuggestion,
  completedTaskCount,
  plannedMinutes,
} from "../../../core/daily-loop.ts";

export type TodayViewState = {
  date: string;
  goal: string;
  planned: number;
  completed: number;
  totalMinutes: number;
  suggestion: string;
  reviewDue: boolean;
};

/**
 * Pure projection of the real V1 daily-loop state into the Today view model.
 * No invented progress values: planned/completed/total all derive from tasks.
 */
export function buildTodayViewState(
  state: DailyLoopState,
  reviewDue: boolean,
): TodayViewState {
  return {
    date: state.activeDate,
    goal: state.goal,
    planned: state.tasks.length,
    completed: completedTaskCount(state),
    totalMinutes: plannedMinutes(state),
    suggestion: buildNextDaySuggestion(state),
    reviewDue,
  };
}
