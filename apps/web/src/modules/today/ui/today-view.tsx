"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  PencilLine,
  RotateCcw,
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

/** Today is the daily action centre: choose, start and complete real persisted tasks. */
export function TodayModule() {
  const [state, setState] = useState<DailyLoopState>(() => createEmptyDailyLoopState());
  const [hydrated, setHydrated] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const taskSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setState(createBrowserWorkspaceRepository().loadDailyLoop());
    setHydrated(true);
  }, []);

  const view = useMemo(() => buildTodayViewState(state, false), [state]);
  const nextTask = useMemo(
    () => state.tasks.find((task) => !task.completedAt) ?? null,
    [state.tasks],
  );

  const startNextTask = () => {
    if (!nextTask) return;
    setActiveTaskId(nextTask.id);
    setAnnouncement(`已开始：${nextTask.title}`);
    window.setTimeout(() => {
      taskSectionRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
    }, 40);
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
    return (
      <section className="space-y-5">
        <p className="text-sm text-muted-foreground">加载今日行动…</p>
      </section>
    );
  }

  const allDone = state.tasks.length > 0 && !nextTask;

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
            TODAY · DAILY LOOP
          </span>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            今日行动
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays size={14} aria-hidden="true" />
            {displayDate(view.date)}
            {view.goal ? ` · ${view.goal}` : " · 先完成 3 分钟启动设置"}
          </p>
        </div>

        {state.tasks.length === 0 ? (
          <Link className="summer-action-button" href="/learning">
            <span className="summer-float-icon" aria-hidden="true">🐤</span>
            创建今日计划 <ArrowRight size={15} aria-hidden="true" />
          </Link>
        ) : allDone ? (
          <Link className="summer-action-button" href="/review">
            <span className="summer-float-icon" aria-hidden="true">🐤</span>
            开始今日复盘 <RotateCcw size={15} aria-hidden="true" />
          </Link>
        ) : (
          <motion.button
            className="summer-action-button"
            onClick={startNextTask}
            transition={{ type: "spring", stiffness: 430, damping: 30, mass: 0.7 }}
            type="button"
            whileTap={{ scale: 0.97 }}
          >
            <span className="summer-float-icon" aria-hidden="true">🐤</span>
            {activeTaskId === nextTask?.id ? "正在进行" : "开始下一项"}
            <span className="max-w-44 truncate">：{nextTask?.title}</span>
          </motion.button>
        )}
        <span aria-live="polite" className="sr-only">{announcement}</span>
      </header>

      {!state.goal || state.tasks.length === 0 ? (
        <article className="summer-glass-card rounded-3xl p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <span className="text-[10px] font-bold tracking-[0.14em] text-primary">3 分钟启动</span>
              <h2 className="mt-2 text-lg font-semibold">先定一个目标，再放入 1～3 个今日任务</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                设置可用时间后，从一个能验证结果的小任务开始。系统会自动保存，并在复盘后结转未完成项。
              </p>
            </div>
            <Link className="secondary-button" href="/learning">
              <PencilLine size={16} aria-hidden="true" /> 建立计划
            </Link>
          </div>
        </article>
      ) : null}

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="今日概览">
        <li className="summer-glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock3 size={15} aria-hidden="true" />
            <span className="text-xs">计划分钟</span>
          </div>
          <strong className="mt-2 block text-2xl font-semibold text-card-foreground">
            {view.totalMinutes}
          </strong>
        </li>
        <li className="summer-glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 size={15} aria-hidden="true" />
            <span className="text-xs">任务完成</span>
          </div>
          <strong className="mt-2 block text-2xl font-semibold text-card-foreground">
            {view.completed}/{view.planned}
          </strong>
        </li>
        <li className="summer-glass-card rounded-2xl p-5">
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
        className="summer-glass-card scroll-mt-20 rounded-3xl p-5 text-card-foreground sm:p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-card-foreground">今日任务</h2>
            <p className="mt-1 text-xs text-muted-foreground">直接勾选完成，无需跳转页面。</p>
          </div>
          <Link href="/learning" className="text-link text-xs">
            <PencilLine size={14} aria-hidden="true" /> 编辑计划
          </Link>
        </div>

        {state.tasks.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            今天还没有任务。围绕目标创建 1～3 个可完成的行动。
          </p>
        ) : (
          <ul className="mt-3 list-none space-y-2">
            {state.tasks.map((task) => {
              const active = activeTaskId === task.id && !task.completedAt;
              return (
                <motion.li
                  key={task.id}
                  layout
                  className={
                    active
                      ? "summer-active-task flex items-center gap-3 rounded-2xl border border-primary/25 px-3 py-3 text-sm"
                      : "flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm hover:bg-secondary/55"
                  }
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                >
                  <button
                    aria-label={
                      task.completedAt
                        ? `撤销完成：${task.title}`
                        : `完成任务：${task.title}`
                    }
                    className={
                      task.completedAt
                        ? "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-success)_14%,transparent)] text-[var(--color-success)] transition-transform active:scale-90"
                        : "grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-[transform,color,border] hover:border-primary hover:text-primary active:scale-90"
                    }
                    onClick={() => toggleTask(task.id)}
                    type="button"
                  >
                    {task.completedAt ? <Check size={18} /> : <Circle size={18} />}
                  </button>
                  <span className="min-w-0 flex-1">
                    <strong
                      className={
                        task.completedAt
                          ? "block truncate text-muted-foreground line-through"
                          : "block truncate text-card-foreground"
                      }
                    >
                      {task.title}
                    </strong>
                    <small className="mt-1 block text-[11px] text-muted-foreground">
                      {active ? "进行中 · " : ""}{task.durationMinutes} 分钟
                    </small>
                  </span>
                  <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-medium text-secondary-foreground">
                    {task.completedAt ? "已完成" : active ? "进行中" : "待完成"}
                  </span>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>

      <article className="summer-glass-card rounded-3xl p-5 sm:p-6">
        <span className="text-[10px] font-bold tracking-[0.14em] text-primary">RULE-BASED</span>
        <h2 className="mt-2 text-base font-semibold text-card-foreground">行动建议</h2>
        <p className="mt-2 text-sm leading-relaxed text-card-foreground/85">{view.suggestion}</p>
        <p className="mt-3 text-[11px] text-muted-foreground">规则建议，不会自动修改计划。</p>
      </article>
    </section>
  );
}
