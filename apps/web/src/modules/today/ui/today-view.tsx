"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Target,
} from "lucide-react";
import { createEmptyDailyLoopState, type DailyLoopState } from "@/core/daily-loop";
import { createBrowserWorkspaceRepository } from "@/core/persistence";
import { buildTodayViewState } from "./today-actions.ts";

function displayDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(year, month - 1, day));
}

/**
 * Action-first Today view. Aggregates the real V1 daily-loop state; no
 * invented progress values. Tasks carry a module-source chip.
 *
 * Visual rules: colors come exclusively from semantic tokens (day/night/
 * dusk via html[data-theme]). Cards are solid surfaces, no transparency
 * or blur on content. Lists use native ul/li semantics for a11y.
 */
export function TodayModule() {
  const [state, setState] = useState<DailyLoopState>(() => createEmptyDailyLoopState());
  const [hydrated, setHydrated] = useState(false);
  const [started, setStarted] = useState(false);
  const taskSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setState(createBrowserWorkspaceRepository().loadDailyLoop());
    setHydrated(true);
  }, []);

  const view = useMemo(() => buildTodayViewState(state, false), [state]);

  /**
   * "开始今日行动" must produce a defined action: mark the session as
   * started and bring the task list into view. If there are no tasks yet,
   * it still gives visible feedback (aria-live announcement).
   */
  const startToday = () => {
    setStarted(true);
    window.setTimeout(() => {
      taskSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  if (!hydrated) {
    return (
      <section className="space-y-5">
        <p className="text-sm text-muted-foreground">加载今日行动…</p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            TODAY
          </span>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            今日行动
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays size={14} aria-hidden="true" />
            {displayDate(view.date)}
            {view.goal ? ` · ${view.goal}` : " · 先设定一个阶段目标"}
          </p>
        </div>
        <button
          onClick={startToday}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          type="button"
        >
          {started ? (
            <>
              行动进行中<CheckCircle2 size={15} />
            </>
          ) : (
            <>
              开始今日行动<ArrowRight size={15} />
            </>
          )}
        </button>
        <span aria-live="polite" className="sr-only">
          {started
            ? state.tasks.length > 0
              ? "已开始今日行动，任务列表已定位"
              : "已开始今日行动，今天还没有任务"
            : ""}
        </span>
      </header>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="今日概览">
        <li className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock3 size={15} aria-hidden="true" />
            <span className="text-xs">计划分钟</span>
          </div>
          <strong className="mt-2 block text-2xl font-semibold text-card-foreground">
            {view.totalMinutes}
          </strong>
        </li>
        <li className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 size={15} aria-hidden="true" />
            <span className="text-xs">任务完成</span>
          </div>
          <strong className="mt-2 block text-2xl font-semibold text-card-foreground">
            {view.completed}/{view.planned}
          </strong>
        </li>
        <li className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target size={15} aria-hidden="true" />
            <span className="text-xs">当前目标</span>
          </div>
          <strong className="mt-2 block text-2xl font-semibold text-card-foreground">
            {view.goal ? "进行中" : "未设定"}
          </strong>
        </li>
      </ul>

      <div
        ref={taskSectionRef}
        className="scroll-mt-20 rounded-3xl border border-border bg-card p-6 shadow-sm text-card-foreground"
      >
        <h2 className="text-base font-semibold text-card-foreground">今日任务</h2>
        {state.tasks.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            今天还没有任务。围绕目标创建 1～3 个可完成的行动。
          </p>
        ) : (
          <ul className="mt-2 list-none">
            {state.tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 border-t border-border py-3 text-sm"
              >
                {task.completedAt ? (
                  <CheckCircle2
                    size={17}
                    className="shrink-0 text-[var(--color-success)]"
                    aria-hidden="true"
                  />
                ) : (
                  <Circle size={17} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
                <span
                  className={
                    task.completedAt
                      ? "min-w-0 truncate text-muted-foreground line-through"
                      : "min-w-0 truncate text-card-foreground"
                  }
                >
                  {task.title}
                </span>
                <span className="ml-auto shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-secondary-foreground">
                  {task.durationMinutes} 分钟
                </span>
                <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-secondary-foreground">
                  每日循环
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-card-foreground">明日建议</h2>
        <p className="mt-2 text-sm leading-relaxed text-card-foreground/85">{view.suggestion}</p>
      </div>
    </section>
  );
}
