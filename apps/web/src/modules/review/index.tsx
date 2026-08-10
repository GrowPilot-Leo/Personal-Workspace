"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Archive,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock3,
  RotateCcw,
  Waves,
} from "lucide-react";
import {
  completedTaskCount,
  createEmptyDailyLoopState,
  rollDailyLoopForward,
  type DailyLoopState,
} from "@/core/daily-loop";
import { createBrowserWorkspaceRepository } from "@/core/persistence";

type ReviewDraft = {
  wins: string;
  blockers: string;
  adjustment: string;
};

const emptyDraft: ReviewDraft = { wins: "", blockers: "", adjustment: "" };

function formatDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(year, month - 1, day));
}

/** Real daily review centre backed by the same repository as Today and Learning. */
export function ReviewModule() {
  const [state, setState] = useState<DailyLoopState>(() => createEmptyDailyLoopState());
  const [draft, setDraft] = useState<ReviewDraft>(emptyDraft);
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const loaded = createBrowserWorkspaceRepository().loadDailyLoop();
    setState(loaded);
    setDraft(
      loaded.review
        ? {
            wins: loaded.review.wins,
            blockers: loaded.review.blockers,
            adjustment: loaded.review.adjustment,
          }
        : emptyDraft,
    );
    setHydrated(true);
  }, []);

  const summary = useMemo(() => {
    const days = [
      ...state.history,
      {
        date: state.activeDate,
        goal: state.goal,
        availableMinutes: state.availableMinutes,
        tasks: state.tasks,
        review: state.review,
      },
    ].slice(-7);
    return {
      days: days.length,
      planned: days.reduce((sum, day) => sum + day.tasks.length, 0),
      completed: days.reduce(
        (sum, day) => sum + day.tasks.filter((task) => task.completedAt).length,
        0,
      ),
      reviewed: days.filter((day) => day.review).length,
    };
  }, [state]);

  const recentReviews = useMemo(
    () => state.history.filter((entry) => entry.review).slice(-6).reverse(),
    [state.history],
  );

  const saveReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleaned = {
      wins: draft.wins.trim(),
      blockers: draft.blockers.trim(),
      adjustment: draft.adjustment.trim(),
    };
    if (!cleaned.wins && !cleaned.blockers && !cleaned.adjustment) {
      setStatus("至少记录一项事实、阻塞或调整。");
      return;
    }

    const next: DailyLoopState = {
      ...state,
      review: {
        ...cleaned,
        submittedAt: state.review?.submittedAt ?? new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };
    createBrowserWorkspaceRepository().saveDailyLoop(next);
    setState(next);
    setDraft(cleaned);
    setStatus("复盘已保存");
  };

  const startNextDay = () => {
    if (!state.review) return;
    const next = rollDailyLoopForward(state);
    createBrowserWorkspaceRepository().saveDailyLoop(next);
    setState(next);
    setDraft(emptyDraft);
    setStatus("今日已归档，未完成任务已结转到下一天。");
  };

  if (!hydrated) {
    return <p className="text-sm text-muted-foreground">加载复盘记录…</p>;
  }

  return (
    <section className="space-y-5">
      <header>
        <span className="text-[10px] font-bold tracking-[0.15em] text-primary">REVIEW CENTER</span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">复盘中心</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          记录事实、识别阻塞、确认下一步。复盘保存后才允许结转，避免计划失去依据。
        </p>
      </header>

      <ul className="grid list-none gap-4 sm:grid-cols-3" aria-label="最近七日摘要">
        <li className="summer-glass-card rounded-2xl p-5">
          <Clock3 size={16} className="text-primary" aria-hidden="true" />
          <strong className="mt-3 block text-2xl">{summary.completed}/{summary.planned}</strong>
          <span className="text-xs text-muted-foreground">任务完成</span>
        </li>
        <li className="summer-glass-card rounded-2xl p-5">
          <CalendarCheck size={16} className="text-primary" aria-hidden="true" />
          <strong className="mt-3 block text-2xl">{summary.reviewed}/{summary.days}</strong>
          <span className="text-xs text-muted-foreground">有记录的天数</span>
        </li>
        <li className="summer-glass-card rounded-2xl p-5">
          <CheckCircle2 size={16} className="text-primary" aria-hidden="true" />
          <strong className="mt-3 block text-2xl">{completedTaskCount(state)}/{state.tasks.length}</strong>
          <span className="text-xs text-muted-foreground">今日任务完成</span>
        </li>
      </ul>

      <motion.article
        className="panel"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 34 }}
      >
        <div className="panel-heading">
          <div>
            <span className="eyebrow">TODAY · {formatDate(state.activeDate)}</span>
            <h2>今日复盘</h2>
          </div>
          {state.review ? (
            <span className="save-status"><Check size={14} /> 已记录</span>
          ) : null}
        </div>

        <form className="review-form" onSubmit={saveReview}>
          <label className="field">
            <span>今天完成了什么、学会了什么？</span>
            <textarea
              maxLength={800}
              onChange={(event) => setDraft((current) => ({ ...current, wins: event.target.value }))}
              placeholder="只写事实和输出结果，例如：完成一张可讲解的检索流程图。"
              rows={3}
              value={draft.wins}
            />
          </label>
          <label className="field">
            <span>哪里卡住了？</span>
            <textarea
              maxLength={800}
              onChange={(event) => setDraft((current) => ({ ...current, blockers: event.target.value }))}
              placeholder="记录真正的阻塞原因，而不是笼统写“时间不够”。"
              rows={3}
              value={draft.blockers}
            />
          </label>
          <label className="field">
            <span>下一次准备怎么调整？</span>
            <textarea
              maxLength={800}
              onChange={(event) => setDraft((current) => ({ ...current, adjustment: event.target.value }))}
              placeholder="给出一个可执行调整，例如：先固定输入输出，再补理论。"
              rows={3}
              value={draft.adjustment}
            />
          </label>
          <button className="primary-button" type="submit">
            <Waves size={16} aria-hidden="true" /> 保存今日复盘
          </button>
        </form>

        <p aria-live="polite" className="mt-3 text-xs text-muted-foreground">{status}</p>
      </motion.article>

      <article className="panel next-day-panel">
        <div>
          <span className="eyebrow">NEXT DAY</span>
          <h2>确认下一天</h2>
          <p>
            {state.review
              ? "复盘已具备行动依据。归档后，已完成任务进入历史，未完成任务自动结转。"
              : "先保存今日复盘，再决定哪些任务需要结转。"}
          </p>
        </div>
        <button
          className="secondary-button"
          disabled={!state.review}
          onClick={startNextDay}
          type="button"
        >
          <Archive size={16} aria-hidden="true" /> 归档并开始下一天
        </button>
      </article>

      <article className="summer-glass-card rounded-3xl p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <RotateCcw size={16} className="text-primary" aria-hidden="true" />
          <h2 className="text-base font-semibold">最近复盘</h2>
        </div>
        {recentReviews.length ? (
          <ul className="mt-4 list-none space-y-3">
            {recentReviews.map((entry) => (
              <li key={entry.date} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm">{formatDate(entry.date)}</strong>
                  <span className="text-[11px] text-muted-foreground">
                    {entry.tasks.filter((task) => task.completedAt).length}/{entry.tasks.length} 完成
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {entry.review?.wins || entry.review?.adjustment || "已完成复盘"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            还没有历史复盘。完成今日复盘并结转后，这里会保留真实记录。
          </p>
        )}
      </article>
    </section>
  );
}
