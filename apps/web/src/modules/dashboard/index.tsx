"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock3,
  Dumbbell,
  Languages,
  Sparkles,
} from "lucide-react";
import {
  buildNextDaySuggestion,
  completedTaskCount,
  createEmptyDailyLoopState,
  loadDailyLoop,
  plannedMinutes,
  type DailyLoopState,
} from "@/core/daily-loop";

function displayDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(year, month - 1, day));
}

export function DashboardModule() {
  const [state, setState] = useState<DailyLoopState>(() => createEmptyDailyLoopState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadDailyLoop(window.localStorage));
    setHydrated(true);
  }, []);

  const completed = completedTaskCount(state);
  const total = state.tasks.length;
  const completion = total ? Math.round((completed / total) * 100) : 0;

  return (
    <section className="page-stack">
      <header className="page-header dashboard-header">
        <div>
          <span className="eyebrow">{displayDate(state.activeDate)}</span>
          <h1>{state.goal ? "今天，继续向目标靠近。" : "先确定今天真正重要的事。"}</h1>
          <p>
            {state.goal
              ? `当前目标：${state.goal}`
              : "进入 AI 学习模块，设置一个阶段目标和今天可以投入的时间。"}
          </p>
        </div>
        <div className="focus-score">
          <Sparkles size={18} />
          <span>
            <small>今日完成度</small>
            <strong>{hydrated ? `${completed} / ${total}` : "加载中"}</strong>
          </span>
        </div>
      </header>

      <div className="dashboard-grid">
        <article className="panel task-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">TODAY</span><h2>今日行动</h2></div>
            <span className="subtle-badge"><Clock3 size={14} /> {plannedMinutes(state)} 分钟</span>
          </div>
          {state.tasks.length ? (
            <div className="task-list">
              {state.tasks.map((task) => (
                <div className="task-row" key={task.id}>
                  <span className={task.completedAt ? "task-check done" : "task-check"}>
                    {task.completedAt ? <CheckCircle2 size={16} /> : <Circle size={14} />}
                  </span>
                  <div>
                    <strong className={task.completedAt ? "completed-text" : ""}>{task.title}</strong>
                    <small>AI 学习 · {task.durationMinutes} 分钟</small>
                  </div>
                  <span className="task-status">{task.completedAt ? "完成" : "待办"}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>还没有今天的行动任务。</p>
              <Link className="text-link" href="/learning">创建今日任务 <ArrowUpRight size={15} /></Link>
            </div>
          )}
        </article>

        <article className="panel coach-panel">
          <span className="eyebrow light">RULE-BASED GUIDE</span>
          <h2>下一步建议</h2>
          <p>{buildNextDaySuggestion(state)}</p>
          <span className="coach-footnote">当前由透明规则生成，尚未调用模型。</span>
        </article>

        <article className="panel growth-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">LOOP STATUS</span><h2>今日闭环</h2></div>
            <strong>{completion}%</strong>
          </div>
          <div className="progress-track large"><span className="purple" style={{ width: `${completion}%` }} /></div>
          <div className="loop-checks">
            <span className={state.goal ? "ready" : ""}>目标</span>
            <span className={state.tasks.length ? "ready" : ""}>行动</span>
            <span className={state.review ? "ready" : ""}>复盘</span>
            <span className={state.history.length ? "ready" : ""}>调整</span>
          </div>
        </article>

        <article className="panel modules-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">WORKSPACES</span><h2>快速进入</h2></div>
          </div>
          <div className="quick-links">
            <Link href="/learning"><BookOpen size={18} /><span>AI 学习<small>目标、任务与复盘</small></span><ArrowUpRight size={16} /></Link>
            <Link href="/english"><Languages size={18} /><span>英语进阶<small>下一阶段开放</small></span><ArrowUpRight size={16} /></Link>
            <Link href="/fitness"><Dumbbell size={18} /><span>健身训练<small>下一阶段开放</small></span><ArrowUpRight size={16} /></Link>
          </div>
        </article>
      </div>
    </section>
  );
}
