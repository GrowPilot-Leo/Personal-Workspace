"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  buildNextDaySuggestion,
  completedTaskCount,
  createEmptyDailyLoopState,
  createId,
  plannedMinutes,
  rollDailyLoopForward,
  type DailyLoopState,
} from "@/core/daily-loop";
import { createBrowserWorkspaceRepository } from "@/core/persistence";

type ReviewDraft = {
  wins: string;
  blockers: string;
  adjustment: string;
};

const emptyReview: ReviewDraft = { wins: "", blockers: "", adjustment: "" };

export function LearningModule() {
  const [state, setState] = useState<DailyLoopState>(() => createEmptyDailyLoopState());
  const [hydrated, setHydrated] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskMinutes, setTaskMinutes] = useState(25);
  const [review, setReview] = useState<ReviewDraft>(emptyReview);

  useEffect(() => {
    const stored = createBrowserWorkspaceRepository().loadDailyLoop();
    setState(stored);
    setReview(stored.review ?? emptyReview);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) createBrowserWorkspaceRepository().saveDailyLoop(state);
  }, [hydrated, state]);

  const completed = completedTaskCount(state);
  const totalMinutes = plannedMinutes(state);
  const overBudget = totalMinutes > state.availableMinutes;
  const completion = state.tasks.length
    ? Math.round((completed / state.tasks.length) * 100)
    : 0;

  const suggestion = useMemo(() => buildNextDaySuggestion(state), [state]);

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
  }

  function toggleTask(id: string) {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === id
          ? { ...task, completedAt: task.completedAt ? null : new Date().toISOString() }
          : task,
      ),
      review: null,
      updatedAt: new Date().toISOString(),
    }));
  }

  function removeTask(id: string) {
    setState((current) => ({
      ...current,
      tasks: current.tasks.filter((task) => task.id !== id),
      review: null,
      updatedAt: new Date().toISOString(),
    }));
  }

  function saveReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!review.wins.trim() && !review.blockers.trim() && !review.adjustment.trim()) return;
    setState((current) => ({
      ...current,
      review: {
        wins: review.wins.trim(),
        blockers: review.blockers.trim(),
        adjustment: review.adjustment.trim(),
        submittedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    }));
  }

  function startNextDay() {
    setState((current) => rollDailyLoopForward(current));
    setReview(emptyReview);
  }

  if (!hydrated) {
    return <div className="panel loading-panel">正在加载你的成长记录…</div>;
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">LEARNING · {state.activeDate}</span>
          <h1>把目标变成今天能完成的行动</h1>
          <p>首个 MVP 只验证一条真实闭环：目标、任务、完成记录、复盘和次日调整。</p>
        </div>
        <span className="local-badge">仅保存在当前设备</span>
      </header>

      <article className="panel setup-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">STEP 1</span>
            <h2>目标与时间预算</h2>
          </div>
          <span className="save-status"><Check size={14} /> 自动保存</span>
        </div>
        <div className="form-grid">
          <label className="field field-wide">
            <span>阶段目标</span>
            <input
              maxLength={160}
              onChange={(event) =>
                setState((current) => ({ ...current, goal: event.target.value }))
              }
              placeholder="例如：能够独立讲清楚并设计一个基础 RAG 方案"
              value={state.goal}
            />
          </label>
          <label className="field">
            <span>今日可用时间（分钟）</span>
            <input
              max={480}
              min={10}
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  availableMinutes: Math.min(480, Math.max(10, Number(event.target.value) || 10)),
                }))
              }
              type="number"
              value={state.availableMinutes}
            />
          </label>
        </div>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">STEP 2</span>
            <h2>今日行动</h2>
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
          <button className="primary-button add-task-button" type="submit">
            <Plus size={16} /> 添加
          </button>
        </form>

        {overBudget && (
          <p className="inline-warning">任务时长已经超过今天的预算。建议缩小范围或删掉优先级最低的任务。</p>
        )}

        {state.tasks.length ? (
          <div className="editable-task-list">
            {state.tasks.map((task) => (
              <div className="editable-task-row" key={task.id}>
                <button
                  aria-label={task.completedAt ? "标记为未完成" : "标记为已完成"}
                  className={task.completedAt ? "complete-button done" : "complete-button"}
                  onClick={() => toggleTask(task.id)}
                  type="button"
                >
                  {task.completedAt ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
                <div>
                  <strong className={task.completedAt ? "completed-text" : ""}>{task.title}</strong>
                  <small>{task.durationMinutes} 分钟</small>
                </div>
                <button
                  aria-label={`删除任务：${task.title}`}
                  className="delete-button"
                  onClick={() => removeTask(task.id)}
                  type="button"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state"><p>从一个 10～60 分钟内可以验证结果的任务开始。</p></div>
        )}

        <div className="completion-row">
          <div className="progress-track large">
            <span className="purple" style={{ width: `${completion}%` }} />
          </div>
          <strong>{completed} / {state.tasks.length} 完成</strong>
        </div>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">STEP 3</span>
            <h2>每日复盘</h2>
          </div>
          {state.review && <span className="save-status"><Check size={14} /> 已记录</span>}
        </div>
        <form className="review-form" onSubmit={saveReview}>
          <label className="field">
            <span>今天完成了什么、学会了什么？</span>
            <textarea
              maxLength={800}
              onChange={(event) => setReview((current) => ({ ...current, wins: event.target.value }))}
              placeholder="写事实和输出结果，不写空泛感受。"
              rows={3}
              value={review.wins}
            />
          </label>
          <label className="field">
            <span>哪里卡住了？</span>
            <textarea
              maxLength={800}
              onChange={(event) => setReview((current) => ({ ...current, blockers: event.target.value }))}
              placeholder="记录真正的阻塞原因。"
              rows={3}
              value={review.blockers}
            />
          </label>
          <label className="field">
            <span>下一次准备怎么调整？</span>
            <textarea
              maxLength={800}
              onChange={(event) => setReview((current) => ({ ...current, adjustment: event.target.value }))}
              placeholder="例如：先做一个最小检索示例，再补理论。"
              rows={3}
              value={review.adjustment}
            />
          </label>
          <button className="primary-button" type="submit">保存复盘 <ArrowRight size={16} /></button>
        </form>
      </article>

      <article className="panel next-day-panel">
        <div>
          <span className="eyebrow">NEXT DAY</span>
          <h2>次日调整建议</h2>
          <p>{suggestion}</p>
        </div>
        <button
          className="secondary-button"
          disabled={!state.review}
          onClick={startNextDay}
          type="button"
        >
          <RotateCcw size={16} /> 归档并开始下一天
        </button>
        {!state.review && <small>完成今日复盘后才能结转，避免丢失行动依据。</small>}
      </article>
    </section>
  );
}
