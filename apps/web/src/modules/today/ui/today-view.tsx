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
  Play,
  RotateCcw,
  Target,
} from "lucide-react";
import {
  createBrowserWorkspaceRepository,
  type WorkspaceRepository,
} from "@/core/persistence";
import type { WorkspaceStateV2 } from "@/core/workspace-state";
import type { TodayItem } from "../public";
import {
  buildTodayViewState,
  startWorkspaceTask,
  toggleWorkspaceTaskCompletion,
  type TodayViewState,
} from "./today-actions.ts";

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

function offsetLabel(items: TodayItem[], index: number) {
  const before = items
    .slice(0, index)
    .reduce((total, item) => total + item.durationMinutes, 0);
  return before === 0 ? "起点" : `+${before}m`;
}

function rhythmStatus(
  index: number,
  view: TodayViewState,
): "pending" | "current" | "done" {
  const hasPlan = view.items.length > 0;
  const allDone = hasPlan && view.completed === view.planned;

  if (index === 0) return hasPlan ? "done" : "current";
  if (index === 1) {
    if (!hasPlan) return "pending";
    return allDone ? "done" : "current";
  }
  if (!view.reviewDue) return "done";
  return allDone ? "current" : "pending";
}

function actionSuggestion(view: TodayViewState): string {
  if (view.items.length === 0) return "先安排一个 10～60 分钟、能够验证结果的任务。";
  if (view.completed === view.planned) return "今天的任务已完成，趁信息清晰时记录一次复盘。";
  const remaining = view.planned - view.completed;
  return `保持单任务推进，先完成下一项；之后还有 ${Math.max(remaining - 1, 0)} 项。`;
}

/** Workspace V2 daily execution surface with one clear next action. */
export function TodayModule() {
  const repositoryRef = useRef<WorkspaceRepository | null>(null);
  const timelineRef = useRef<HTMLOListElement>(null);
  const [workspace, setWorkspace] = useState<WorkspaceStateV2 | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const dateKey = useMemo(() => localDateKey(new Date()), []);

  useEffect(() => {
    const repository = createBrowserWorkspaceRepository();
    repositoryRef.current = repository;
    setWorkspace(repository.loadWorkspace());
    setHydrated(true);
  }, []);

  const view = useMemo(
    () => (workspace ? buildTodayViewState(workspace, dateKey) : null),
    [dateKey, workspace],
  );
  const nextTask = useMemo(
    () =>
      view?.items.find((item) => item.status === "active") ??
      view?.items.find((item) => item.status === "planned") ??
      null,
    [view],
  );

  function persist(nextWorkspace: WorkspaceStateV2) {
    repositoryRef.current?.saveWorkspace(nextWorkspace);
    setWorkspace(nextWorkspace);
  }

  function startNextTask() {
    if (!workspace || !nextTask) return;
    const now = new Date().toISOString();
    persist(startWorkspaceTask(workspace, nextTask.id, now));
    setAnnouncement(`已开始：${nextTask.title}`);
    window.setTimeout(() => {
      timelineRef.current
        ?.querySelector<HTMLElement>(`[data-task-id="${nextTask.id}"]`)
        ?.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
    }, 30);
  }

  function toggleTask(item: TodayItem) {
    if (!workspace) return;
    const completing = item.status !== "done";
    persist(
      toggleWorkspaceTaskCompletion(
        workspace,
        item.id,
        new Date().toISOString(),
      ),
    );
    setAnnouncement(
      completing ? `已完成：${item.title}` : `已恢复为待完成：${item.title}`,
    );
  }

  if (!hydrated || !view) {
    return <p className="text-sm text-muted-foreground">加载今日安排…</p>;
  }

  const allDone = view.items.length > 0 && view.completed === view.planned;
  const capacity = view.capacityMinutes;
  const workload =
    capacity !== null && capacity > 0
      ? Math.min(100, Math.round((view.totalMinutes / capacity) * 100))
      : null;
  const overCapacity = capacity !== null && view.totalMinutes > capacity;
  const rhythm = [
    { label: "计划", note: "确认目标与容量" },
    { label: "执行", note: "专注下一项" },
    { label: "复盘", note: "记录并调整" },
  ];

  return (
    <section className="space-y-6 sm:space-y-7">
      <header>
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <CalendarDays size={13} aria-hidden="true" />
          {displayDate(view.date)}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-[38px]">
          今日行动
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          {view.items.length
            ? `今天安排了 ${view.planned} 项任务，先把注意力留给下一步。`
            : "先决定今天真正要推进的一件事。"}
        </p>
        <span aria-live="polite" className="sr-only">
          {announcement}
        </span>
      </header>

      <section
        aria-label="今日进度"
        className="grid items-center gap-3 rounded-2xl border border-border bg-card/70 px-4 py-3 sm:grid-cols-[auto_1fr_auto]"
      >
        <div
          className="grid size-14 place-items-center rounded-full text-sm font-semibold text-primary"
          style={{
            background:
              "conic-gradient(var(--color-action-primary) " +
              `${Math.round((view.completed / Math.max(view.planned, 1)) * 360)}deg` +
              ", var(--nav-hover-bg) 0)",
          }}
        >
          <span className="grid size-11 place-items-center rounded-full bg-background">
            {Math.round((view.completed / Math.max(view.planned, 1)) * 100)}%
          </span>
        </div>
        <div>
          <strong className="block text-sm font-semibold">
            已完成 {view.completed} / {view.planned}
          </strong>
          <span className="mt-1 block text-xs text-muted-foreground">
            稳稳推进，不需要赶
          </span>
        </div>
        <span className="text-xs text-muted-foreground sm:text-right">
          <strong className="mr-1 text-lg font-semibold text-foreground">
            {view.totalMinutes}
          </strong>
          分钟
        </span>
      </section>

      {nextTask ? (
        <motion.section
          aria-labelledby="next-action-title"
          className="relative overflow-hidden rounded-[26px] bg-[linear-gradient(145deg,#4263eb,#314cc8_56%,#6d5ce7)] p-5 text-white shadow-[0_18px_42px_rgba(66,99,235,0.24)] sm:p-6"
          layout
          transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-12 size-40 rounded-full bg-primary-foreground/15 blur-2xl"
          />
          <div className="relative">
            <div className="flex items-center justify-between gap-3 text-xs text-white/80">
              <span className="rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-2.5 py-1">
                {nextTask.sourceLabel} · {nextTask.durationMinutes} 分钟
              </span>
              <span>{nextTask.status === "active" ? "进行中" : "下一步"}</span>
            </div>
            <h2
              className="mt-4 max-w-2xl text-xl font-semibold tracking-[-0.025em] sm:text-2xl"
              id="next-action-title"
            >
              {nextTask.title}
            </h2>
            <p className="mt-2 text-xs text-white/75">
              完成后会同步回原学习空间，并进入今日复盘。
            </p>
            <motion.button
              aria-label={`开始任务：${nextTask.title}`}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary-foreground px-4 text-sm font-semibold text-primary shadow-sm sm:w-auto"
              onClick={startNextTask}
              transition={{ duration: 0.12 }}
              type="button"
              whileTap={{ scale: 0.97 }}
            >
              <Play size={15} fill="currentColor" aria-hidden="true" />
              {nextTask.status === "active" ? "正在进行" : "开始专注"}
            </motion.button>
          </div>
        </motion.section>
      ) : allDone ? (
        <section className="rounded-[26px] border border-success/25 bg-success/10 p-5 sm:p-6">
          <h2 className="text-lg font-semibold">今天的任务已经完成</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            趁信息还清晰，记录结果、阻塞和明天的一项调整。
          </p>
          <Link className="primary-action mt-5" href="/review">
            开始复盘 <RotateCcw size={15} aria-hidden="true" />
          </Link>
        </section>
      ) : (
        <section className="rounded-[26px] border border-border bg-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">今天还没有安排</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            从一个 10～60 分钟、能够验证结果的任务开始。
          </p>
          <Link className="primary-action mt-5" href="/learning">
            去学习空间安排 <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      )}

      <section aria-labelledby="rhythm-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="rhythm-title" className="text-xs font-semibold text-foreground">
            今日节奏
          </h2>
          <span className="text-[11px] text-muted-foreground">
            每一步都有明确出口
          </span>
        </div>
        <ol className="rhythm-bar list-none">
          {rhythm.map((step, index) => {
            const status = rhythmStatus(index, view);
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
        <section
          className="calm-surface timeline-panel"
          aria-labelledby="timeline-title"
        >
          <header className="flex items-start justify-between gap-4">
            <div>
              <h2 id="timeline-title" className="text-base font-semibold">
                今日时间线
              </h2>
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

          {view.items.length ? (
            <ol ref={timelineRef} aria-label="今日时间线" className="timeline-list">
              {view.items.map((item, index) => {
                const active = item.status === "active";
                const done = item.status === "done";
                return (
                  <motion.li
                    data-task-id={item.id}
                    className="timeline-item"
                    key={item.id}
                    layout
                    transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    <span className="timeline-slot">
                      {item.dueAt
                        ? new Intl.DateTimeFormat("zh-CN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          }).format(new Date(item.dueAt))
                        : offsetLabel(view.items, index)}
                    </span>
                    <span
                      className={
                        done
                          ? "timeline-marker done"
                          : active
                            ? "timeline-marker active"
                            : "timeline-marker"
                      }
                      aria-hidden="true"
                    >
                      {done ? <Check size={14} /> : <Circle size={12} />}
                    </span>
                    <div className="timeline-content">
                      <div className="timeline-content-row">
                        <div className="timeline-task-copy">
                          <strong
                            className={
                              done ? "text-muted-foreground line-through" : ""
                            }
                          >
                            {item.title}
                          </strong>
                          <small>
                            {item.sourceLabel} · {item.durationMinutes} 分钟
                            {active ? " · 正在进行" : done ? " · 已完成" : ""}
                          </small>
                        </div>
                        <button
                          aria-label={
                            done
                              ? `撤销完成：${item.title}`
                              : `完成任务：${item.title}`
                          }
                          className="timeline-complete"
                          onClick={() => toggleTask(item)}
                          type="button"
                        >
                          {done ? "撤销" : "完成"}
                        </button>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          ) : (
            <div className="py-12 text-center">
              <Clock3
                className="mx-auto text-muted-foreground"
                size={20}
                aria-hidden="true"
              />
              <h3 className="mt-3 text-sm font-semibold">今天还没有安排</h3>
              <Link className="secondary-action mt-5" href="/learning">
                建立今日计划
              </Link>
            </div>
          )}
        </section>

        <aside className="calm-surface p-5" aria-label="今日辅助信息">
          <div className="insight-stack">
            <section className="insight-section">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-primary" aria-hidden="true" />
                <h2>今日来源</h2>
              </div>
              <p>
                {view.items.length
                  ? [...new Set(view.items.map((item) => item.sourceLabel))].join("、")
                  : "尚未安排学习任务。"}
              </p>
            </section>

            <section className="insight-section">
              <div className="flex items-center justify-between gap-3">
                <h2>工作量</h2>
                <span className="text-[11px] text-muted-foreground">
                  {capacity === null
                    ? `已安排 ${view.totalMinutes} 分钟`
                    : `${view.totalMinutes}/${capacity} 分钟`}
                </span>
              </div>
              {workload !== null && capacity !== null ? (
                <div
                  className="workload-track"
                  role="progressbar"
                  aria-label="今日工作量"
                  aria-valuemin={0}
                  aria-valuemax={capacity}
                  aria-valuenow={Math.min(view.totalMinutes, capacity)}
                >
                  <span style={{ width: `${workload}%` }} />
                </div>
              ) : null}
              <p>
                {capacity === null
                  ? "尚未设置今日容量，因此不显示虚假的百分比。"
                  : overCapacity
                    ? "计划已超出容量，请缩小任务范围。"
                    : "保留余量比排满一天更容易完成。"}
              </p>
            </section>

            <section className="insight-section">
              <h2>行动建议</h2>
              <p>{actionSuggestion(view)}</p>
              <small className="mt-2 block text-[10px] text-muted-foreground">
                规则建议，不会自动修改计划
              </small>
            </section>

            <section className="insight-section">
              <h2>晚间复盘</h2>
              <p>
                {view.reviewDue
                  ? "结束前记录结果、阻塞和一个调整。"
                  : "今日复盘已记录，可确认下一天。"}
              </p>
              <Link className="secondary-action mt-4 w-full" href="/review">
                {view.reviewDue ? "进入复盘" : "查看复盘"}
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </section>
          </div>
        </aside>
      </div>
    </section>
  );
}
