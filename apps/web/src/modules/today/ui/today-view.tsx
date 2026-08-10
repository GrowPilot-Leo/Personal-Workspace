"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Circle,
  Clock3,
  Edit3,
  RotateCcw,
  Target,
} from "lucide-react";
import {
  createEmptyDailyLoopState,
  plannedMinutes,
  type DailyLoopState,
  type DailyTask,
} from "@/core/daily-loop";
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

function scrollBehavior(): ScrollBehavior {
  const systemReduced =
    document.documentElement.dataset.motion === "system" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return document.documentElement.dataset.motion === "reduced" ||
    document.documentElement.dataset.motion === "off" ||
    systemReduced
    ? "auto"
    : "smooth";
}

function offsetLabel(tasks: DailyTask[], index: number) {
  const before = tasks
    .slice(0, index)
    .reduce((total, task) => total + task.durationMinutes, 0);
  return before === 0 ? "起点" : `+${before}m`;
}

type RhythmStatus = "pending" | "current" | "done";

function rhythmStatus(index: number, state: DailyLoopState): RhythmStatus {
  const planned = Boolean(state.goal && state.tasks.length);
  const allTasksDone = state.tasks.length > 0 && state.tasks.every((task) => task.completedAt);

  if (index === 0) return planned ? "done" : "current";
  if (index === 1) {
    if (!planned) return "pending";
    return allTasksDone ? "done" : "current";
  }
  if (state.review) return "done";
  return allTasksDone ? "current" : "pending";
}

/** A restrained daily workspace: guided rhythm, real timeline, one primary action. */
export function TodayModule() {
  const [state, setState] = useState<DailyLoopState>(() => createEmptyDailyLoopState());
  const [hydrated, setHydrated] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const timelineRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    setState(createBrowserWorkspaceRepository().loadDailyLoop());
    setHydrated(true);
  }, []);

  const view = useMemo(() => buildTodayViewState(state, false), [state]);
  const nextTask = useMemo(
    () => state.tasks.find((task) => !task.completedAt) ?? null,
    [state.tasks],
  );
  const totalMinutes = plannedMinutes(state);
  const workload = Math.min(100, Math.round((totalMinutes / state.availableMinutes) * 100));
  const overCapacity = totalMinutes > state.availableMinutes;

  const startNextTask = () => {
    if (!nextTask) return;
    setActiveTaskId(nextTask.id);
    setAnnouncement(`已开始：${nextTask.title}`);
    window.setTimeout(() => {
      timelineRef.current
        ?.querySelector<HTMLElement>(`[data-task-id="${nextTask.id}"]`)
        ?.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
    }, 30);
  };

  const toggleTask = (taskId: string) => {
    const next: DailyLoopState = {
      ...state,
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, completedAt: task.completedAt ? null : new Date().toISOString() }
          : task,
      ),
      updatedAt: new Date().toISOString(),
    };
    const changed = next.tasks.find((task) => task.id === taskId);
    createBrowserWorkspaceRepository().saveDailyLoop(next);
    setState(next);
    setAnnouncement(
      changed?.completedAt
        ? `已完成：${changed.title}`
        : `已恢复为待完成：${changed?.title ?? "任务"}`,
    );
    if (changed?.completedAt && activeTaskId === taskId) setActiveTaskId(null);
  };

  if (!hydrated) {
    return <p className="text-sm text-muted-foreground">加载今日安排…</p>;
  }

  const allDone = state.tasks.length > 0 && !nextTask;
  const rhythm = [
    { label: "计划", note: "确认目标与容量" },
    { label: "执行", note: "专注下一项" },
    { label: "复盘", note: "记录并调整" },
  ];

  return (
    <section className="space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <CalendarDays size={13} aria-hidden="true" />
            {displayDate(view.date)}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-[38px]">
            今日行动
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {view.goal || "先决定今天真正要推进的一件事。"}
          </p>
        </div>

        {state.tasks.length === 0 ? (
          <Link className="primary-action" href="/learning">
            安排今天 <ArrowRight size={15} aria-hidden="true" />
          </Link>
        ) : allDone ? (
          <Link className="primary-action" href="/review">
            开始复盘 <RotateCcw size={15} aria-hidden="true" />
          </Link>
        ) : (
          <motion.button
            className="primary-action"
            onClick={startNextTask}
            transition={{ duration: 0.12 }}
            type="button"
            whileTap={{ scale: 0.985 }}
          >
            {activeTaskId === nextTask?.id ? "正在进行" : "开始下一项"}
            <span className="max-w-48 truncate">：{nextTask?.title}</span>
            <ArrowRight size={15} aria-hidden="true" />
          </motion.button>
        )}
        <span aria-live="polite" className="sr-only">{announcement}</span>
      </header>

      <section aria-labelledby="rhythm-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="rhythm-title" className="text-xs font-semibold text-foreground">今日节奏</h2>
          <span className="text-[11px] text-muted-foreground">每一步都有明确出口</span>
        </div>
        <ol className="rhythm-bar list-none">
          {rhythm.map((step, index) => {
            const status = rhythmStatus(index, state);
            return (
              <li className={`rhythm-step ${status}`} key={step.label}>
                <span className="rhythm-step-number" aria-hidden="true">
                  {status === "done" ? <Check size={13} /> : index + 1}
                </span>
                <span>
                  <strong>{step.label}</strong>
                  <small>{step.note}</small>
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="daily-layout">
        <section className="calm-surface timeline-panel" aria-labelledby="timeline-title">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h2 id="timeline-title" className="text-base font-semibold">今日时间线</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                按顺序完成，避免同时推进太多任务。
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">
                {view.completed}/{view.planned} 完成
              </span>
              <Link className="tertiary-action" href="/learning">
                <Edit3 size={14} aria-hidden="true" /> 编辑
              </Link>
            </div>
          </header>

          {state.tasks.length ? (
            <ol ref={timelineRef} aria-label="今日时间线" className="timeline-list">
              {state.tasks.map((task, index) => {
                const active = activeTaskId === task.id && !task.completedAt;
                return (
                  <motion.li
                    data-task-id={task.id}
                    className="timeline-item"
                    key={task.id}
                    layout
                    transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    <span className="timeline-slot">
                      {offsetLabel(state.tasks, index)}
                    </span>
                    <span
                      className={
                        task.completedAt
                          ? "timeline-marker done"
                          : active
                            ? "timeline-marker active"
                            : "timeline-marker"
                      }
                      aria-hidden="true"
                    >
                      {task.completedAt ? <Check size={14} /> : <Circle size={12} />}
                    </span>
                    <div className="timeline-content">
                      <div className="timeline-content-row">
                        <div className="timeline-task-copy">
                          <strong className={task.completedAt ? "text-muted-foreground line-through" : ""}>
                            {task.title}
                          </strong>
                          <small>
                            {task.durationMinutes} 分钟
                            {active ? " · 正在进行" : task.completedAt ? " · 已完成" : ""}
                          </small>
                        </div>
                        <button
                          aria-label={
                            task.completedAt
                              ? `撤销完成：${task.title}`
                              : `完成任务：${task.title}`
                          }
                          className="timeline-complete"
                          onClick={() => toggleTask(task.id)}
                          type="button"
                        >
                          {task.completedAt ? "撤销" : "完成"}
                        </button>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          ) : (
            <div className="py-12 text-center">
              <Clock3 className="mx-auto text-muted-foreground" size={20} aria-hidden="true" />
              <h3 className="mt-3 text-sm font-semibold">今天还没有安排</h3>
              <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-muted-foreground">
                从一个 10～60 分钟、能够验证结果的任务开始。
              </p>
              <Link className="secondary-action mt-5" href="/learning">建立今日计划</Link>
            </div>
          )}
        </section>

        <aside className="calm-surface p-5" aria-label="今日辅助信息">
          <div className="insight-stack">
            <section className="insight-section">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-primary" aria-hidden="true" />
                <h2>今日目标</h2>
              </div>
              <p>{state.goal || "尚未设置阶段目标。"}</p>
            </section>

            <section className="insight-section">
              <div className="flex items-center justify-between gap-3">
                <h2>工作量</h2>
                <span className="text-[11px] text-muted-foreground">
                  {totalMinutes}/{state.availableMinutes} 分钟
                </span>
              </div>
              <div
                className="workload-track"
                role="progressbar"
                aria-label="今日工作量"
                aria-valuemin={0}
                aria-valuemax={state.availableMinutes}
                aria-valuenow={Math.min(totalMinutes, state.availableMinutes)}
              >
                <span style={{ width: `${workload}%` }} />
              </div>
              <p>{overCapacity ? "计划已超出容量，请缩小任务范围。" : "保留余量比排满一天更容易完成。"}</p>
            </section>

            <section className="insight-section">
              <h2>行动建议</h2>
              <p>{view.suggestion}</p>
              <small className="mt-2 block text-[10px] text-muted-foreground">
                规则建议，不会自动修改计划
              </small>
            </section>

            <section className="insight-section">
              <h2>晚间复盘</h2>
              <p>{state.review ? "今日复盘已记录，可确认下一天。" : "结束前记录结果、阻塞和一个调整。"}</p>
              <Link className="secondary-action mt-4 w-full" href="/review">
                {state.review ? "查看复盘" : "进入复盘"}
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </section>
          </div>
        </aside>
      </div>

    </section>
  );
}
