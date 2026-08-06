"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Target,
} from "lucide-react";
import {
  createEmptyDailyLoopState,
  loadDailyLoop,
  type DailyLoopState,
} from "@/core/daily-loop";
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
 * Visual rules: high-contrast zinc text scale on solid white cards;
 * borders are black/5, shadows are subtle. No transparency or blur on
 * content surfaces.
 */
export function TodayModule() {
  const [state, setState] = useState<DailyLoopState>(() => createEmptyDailyLoopState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadDailyLoop(window.localStorage));
    setHydrated(true);
  }, []);

  const view = useMemo(() => buildTodayViewState(state, false), [state]);

  if (!hydrated) {
    return (
      <section className="space-y-5">
        <p className="text-sm text-zinc-500">加载今日行动…</p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
            TODAY
          </span>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            今日行动
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-500">
            <CalendarDays size={14} aria-hidden="true" />
            {displayDate(view.date)}
            {view.goal ? ` · ${view.goal}` : " · 先设定一个阶段目标"}
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          type="button"
        >
          开始今日行动<ArrowRight size={15} />
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" role="list" aria-label="今日概览">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-500">
            <Clock3 size={15} aria-hidden="true" />
            <span className="text-xs">计划分钟</span>
          </div>
          <strong className="mt-2 block text-2xl font-semibold text-zinc-900">
            {view.totalMinutes}
          </strong>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-500">
            <CheckCircle2 size={15} aria-hidden="true" />
            <span className="text-xs">任务完成</span>
          </div>
          <strong className="mt-2 block text-2xl font-semibold text-zinc-900">
            {view.completed}/{view.planned}
          </strong>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-500">
            <Target size={15} aria-hidden="true" />
            <span className="text-xs">当前目标</span>
          </div>
          <strong className="mt-2 block text-2xl font-semibold text-zinc-900">
            {view.goal ? "进行中" : "未设定"}
          </strong>
        </div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm text-zinc-900">
        <h2 className="text-base font-semibold text-zinc-900">今日任务</h2>
        {state.tasks.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            今天还没有任务。围绕目标创建 1～3 个可完成的行动。
          </p>
        ) : (
          <ul className="mt-2 list-none">
            {state.tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 border-t border-black/5 py-3 text-sm"
              >
                {task.completedAt ? (
                  <CheckCircle2 size={17} className="shrink-0 text-emerald-600" aria-hidden="true" />
                ) : (
                  <Circle size={17} className="shrink-0 text-zinc-400" aria-hidden="true" />
                )}
                <span
                  className={
                    task.completedAt
                      ? "min-w-0 truncate text-zinc-400 line-through"
                      : "min-w-0 truncate text-zinc-700"
                  }
                >
                  {task.title}
                </span>
                <span className="ml-auto shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] text-zinc-600">
                  {task.durationMinutes} 分钟
                </span>
                <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] text-zinc-600">
                  每日循环
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-900">明日建议</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700">{view.suggestion}</p>
      </div>
    </section>
  );
}
