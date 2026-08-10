"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Plus,
  Trash2,
} from "lucide-react";
import {
  createEmptyDailyLoopState,
  createId,
  plannedMinutes,
  type DailyLoopState,
} from "@/core/daily-loop";
import { createBrowserWorkspaceRepository } from "@/core/persistence";

export function LearningModule() {
  const [state, setState] = useState<DailyLoopState>(() => createEmptyDailyLoopState());
  const [hydrated, setHydrated] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskMinutes, setTaskMinutes] = useState(25);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setState(createBrowserWorkspaceRepository().loadDailyLoop());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) createBrowserWorkspaceRepository().saveDailyLoop(state);
  }, [hydrated, state]);

  const totalMinutes = plannedMinutes(state);
  const pendingTasks = state.tasks.filter((task) => !task.completedAt);
  const overBudget = totalMinutes > state.availableMinutes;

  function updateGoal(goal: string) {
    setState((current) => ({
      ...current,
      goal,
      updatedAt: new Date().toISOString(),
    }));
  }

  function updateAvailableMinutes(value: number) {
    setState((current) => ({
      ...current,
      availableMinutes: Math.min(480, Math.max(10, value || 10)),
      updatedAt: new Date().toISOString(),
    }));
  }

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!title) return;

    setState((current) => ({
      ...current,
      tasks: [
        ...current.tasks,
        {
          id: createId(),
          title: title.slice(0, 120),
          durationMinutes: Math.min(480, Math.max(10, Math.round(taskMinutes))),
          completedAt: null,
          createdAt: new Date().toISOString(),
        },
      ].slice(0, 20),
      review: null,
      updatedAt: new Date().toISOString(),
    }));
    setTaskTitle("");
    setStatus(`已加入今日：${title}`);
  }

  function removeTask(id: string, title: string) {
    setState((current) => ({
      ...current,
      tasks: current.tasks.filter((task) => task.id !== id || Boolean(task.completedAt)),
      review: null,
      updatedAt: new Date().toISOString(),
    }));
    setStatus(`已从今日移除：${title}`);
  }

  if (!hydrated) {
    return <div className="panel loading-panel">正在加载学习计划…</div>;
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">LEARNING PLAN · {state.activeDate}</span>
          <h1>把学习目标拆成今天能执行的任务</h1>
          <p>这里只负责确定目标、控制投入和拆解任务；任务执行进入“今日”，结果复盘进入“复盘中心”。</p>
        </div>
        <span className="local-badge">自动保存在当前设备</span>
      </header>

      <article className="panel setup-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">STEP 1 · PLAN</span>
            <h2>学习目标与时间容量</h2>
          </div>
          <span className="save-status"><Check size={14} /> 自动保存</span>
        </div>
        <div className="form-grid">
          <label className="field field-wide">
            <span>阶段目标</span>
            <input
              maxLength={160}
              onChange={(event) => updateGoal(event.target.value)}
              placeholder="例如：能够独立讲清楚并设计一个基础 RAG 方案"
              value={state.goal}
            />
          </label>
          <label className="field">
            <span>今日可用时间（分钟）</span>
            <input
              max={480}
              min={10}
              onChange={(event) => updateAvailableMinutes(Number(event.target.value))}
              type="number"
              value={state.availableMinutes}
            />
          </label>
        </div>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">STEP 2 · HANDOFF</span>
            <h2>拆解并加入今日</h2>
          </div>
          <span className={overBudget ? "budget-badge warning" : "budget-badge"}>
            <Clock3 size={14} /> {totalMinutes} / {state.availableMinutes} 分钟
          </span>
        </div>

        <form className="task-form" onSubmit={addTask}>
          <label className="field task-title-field">
            <span>具体任务</span>
            <input
              maxLength={120}
              onChange={(event) => setTaskTitle(event.target.value)}
              placeholder="例如：用自己的话画出 RAG 检索流程"
              value={taskTitle}
            />
          </label>
          <label className="field duration-field">
            <span>预计分钟</span>
            <input
              max={480}
              min={10}
              onChange={(event) => setTaskMinutes(Number(event.target.value) || 10)}
              type="number"
              value={taskMinutes}
            />
          </label>
          <button className="primary-action add-task-button" type="submit">
            <Plus size={16} /> 加入今日
          </button>
        </form>

        {overBudget && (
          <p className="inline-warning">计划时长已经超过今天的容量。建议缩小范围或移除优先级最低的任务。</p>
        )}

        {state.tasks.length ? (
          <div className="editable-task-list">
            {state.tasks.map((task) => {
              const completed = Boolean(task.completedAt);
              return (
                <div className="editable-task-row" key={task.id}>
                  <span
                    aria-label={completed ? "已在今日完成" : "等待今日执行"}
                    className={completed ? "complete-button done" : "complete-button"}
                  >
                    {completed ? <CheckCircle2 size={20} /> : <Clock3 size={18} />}
                  </span>
                  <div>
                    <strong className={completed ? "completed-text" : ""}>{task.title}</strong>
                    <small>
                      {task.durationMinutes} 分钟 · {completed ? "已完成" : "等待今日执行"}
                    </small>
                  </div>
                  {completed ? (
                    <span className="task-status">已完成</span>
                  ) : (
                    <button
                      aria-label={`从今日移除：${task.title}`}
                      className="delete-button"
                      onClick={() => removeTask(task.id, task.title)}
                      type="button"
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state"><p>从一个 10～60 分钟、能够验证结果的任务开始。</p></div>
        )}

        <div className="mt-5 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <strong className="text-sm">
              {pendingTasks.length ? `${pendingTasks.length} 项等待执行` : "还没有待执行任务"}
            </strong>
            <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
              {status || "任务加入后会出现在今日时间线，这里不执行也不复盘。"}
            </p>
          </div>
          <Link className="primary-action shrink-0" href="/today">
            前往今日执行 <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </article>
    </section>
  );
}
