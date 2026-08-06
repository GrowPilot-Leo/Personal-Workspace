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
      <section className="page-stack">
        <p className="text-muted">加载今日行动…</p>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">TODAY</span>
          <h1>今日行动</h1>
          <p>
            <CalendarDays size={14} aria-hidden="true" /> {displayDate(view.date)}
            {view.goal ? ` · ${view.goal}` : " · 先设定一个阶段目标"}
          </p>
        </div>
        <button className="primary-button" type="button">
          开始今日行动<ArrowRight size={16} />
        </button>
      </header>

      <div className="stat-row" role="list" aria-label="今日概览">
        <div className="stat-card">
          <Clock3 size={16} aria-hidden="true" />
          <strong>{view.totalMinutes}</strong>
          <span>计划分钟</span>
        </div>
        <div className="stat-card">
          <CheckCircle2 size={16} aria-hidden="true" />
          <strong>{view.completed}/{view.planned}</strong>
          <span>任务完成</span>
        </div>
        <div className="stat-card">
          <Target size={16} aria-hidden="true" />
          <strong>{view.goal ? "进行中" : "未设定"}</strong>
          <span>当前目标</span>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">今日任务</h2>
        {state.tasks.length === 0 ? (
          <p className="empty-state">今天还没有任务。围绕目标创建 1～3 个可完成的行动。</p>
        ) : (
          <ul className="task-list">
            {state.tasks.map((task) => (
              <li key={task.id} className={task.completedAt ? "task-item done" : "task-item"}>
                {task.completedAt ? (
                  <CheckCircle2 size={18} aria-hidden="true" />
                ) : (
                  <Circle size={18} aria-hidden="true" />
                )}
                <span className="task-title">{task.title}</span>
                <span className="task-chip">{task.durationMinutes} 分钟</span>
                <span className="task-chip source">每日循环</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card suggestion-card">
        <h2 className="card-title">明日建议</h2>
        <p>{view.suggestion}</p>
      </div>
    </section>
  );
}
