import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Languages,
  Sparkles,
} from "lucide-react";

const tasks = [
  { label: "梳理 RAG 检索主线", module: "AI 学习", duration: "45 分钟" },
  { label: "用英文解释 Agent", module: "英语进阶", duration: "25 分钟" },
  { label: "完成一次训练记录", module: "健身训练", duration: "60 分钟" },
];

const growth = [
  { label: "AI 产品能力", value: 62, tone: "purple" },
  { label: "职业英语", value: 48, tone: "blue" },
  { label: "身体训练", value: 56, tone: "green" },
];

// Dashboard consumes summaries only. Real task ownership remains in each
// business module; later APIs should expose a stable DailySummary contract.
export function DashboardModule() {
  return (
    <section className="page-stack">
      <header className="page-header dashboard-header">
        <div>
          <span className="eyebrow">MONDAY · PERSONAL WORKSPACE</span>
          <h1>今天，继续向目标靠近。</h1>
          <p>先完成最重要的三件事，再让 GrowPilot 根据结果调整下一步。</p>
        </div>
        <div className="focus-score">
          <Sparkles size={18} />
          <span>
            <small>今日完成度</small>
            <strong>0 / 3</strong>
          </span>
        </div>
      </header>

      <div className="dashboard-grid">
        <article className="panel task-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">TODAY</span>
              <h2>今日行动</h2>
            </div>
            <span className="subtle-badge"><Clock3 size={14} /> 约 2 小时 10 分</span>
          </div>
          <div className="task-list">
            {tasks.map((task, index) => (
              <div className="task-row" key={task.label}>
                <span className="task-check">{index + 1}</span>
                <div>
                  <strong>{task.label}</strong>
                  <small>{task.module} · {task.duration}</small>
                </div>
                <CheckCircle2 size={20} className="muted-icon" />
              </div>
            ))}
          </div>
        </article>

        <article className="panel coach-panel">
          <span className="eyebrow light">AI COACH</span>
          <h2>今天的建议</h2>
          <p>
            先用自己的话解释 RAG，再去补资料。输出一次比重复阅读更容易暴露真正的知识缺口。
          </p>
          <span className="coach-footnote">当前为演示建议，尚未接入模型。</span>
        </article>

        <article className="panel growth-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">PROGRESS</span>
              <h2>成长维度</h2>
            </div>
            <span className="demo-label">演示数据</span>
          </div>
          <div className="progress-list">
            {growth.map((item) => (
              <div className="progress-item" key={item.label}>
                <div>
                  <span>{item.label}</span>
                  <strong>{item.value}%</strong>
                </div>
                <div className="progress-track">
                  <span className={item.tone} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel modules-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">WORKSPACES</span>
              <h2>快速进入</h2>
            </div>
          </div>
          <div className="quick-links">
            <Link href="/learning"><BookOpen size={18} /><span>AI 学习<small>路线与复盘</small></span><ArrowUpRight size={16} /></Link>
            <Link href="/english"><Languages size={18} /><span>英语进阶<small>阅读与表达</small></span><ArrowUpRight size={16} /></Link>
            <Link href="/fitness"><Dumbbell size={18} /><span>健身训练<small>计划与记录</small></span><ArrowUpRight size={16} /></Link>
          </div>
        </article>
      </div>
    </section>
  );
}
