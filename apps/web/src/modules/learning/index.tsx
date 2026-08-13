"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { activePlanData, type Plan } from "@/core/plans";
import { createBrowserWorkspaceRepository } from "@/core/persistence";
import type { WorkspaceRepository } from "@/core/persistence";
import {
  replaceLearningPlan,
  upsertLearningSpace,
  upsertTask,
  type WorkspaceStateV2,
} from "@/core/workspace-state";
import {
  buildLearningSpaceExport,
  createLearningPlanHierarchy,
  createLearningSpace,
  removeLearningSpaceBundle,
  reviseLearningPlan,
  scheduleLearningTask,
  setLearningSpaceStatus,
  type LearningPlanData,
  type LearningSpace,
} from "./public";
import {
  LearningSpaceDialog,
  type CreateLearningSpaceValues,
} from "./learning-space-dialog";
import { LearningDeleteDialog } from "./learning-delete-dialog";

const statusLabels: Record<LearningSpace["status"], string> = {
  draft: "草稿",
  planned: "已规划",
  active: "进行中",
  paused: "已暂停",
  completed: "已完成",
  archived: "已归档",
};

const templateLabels: Record<LearningSpace["templateId"], string> = {
  blank: "空白空间",
  "three-horizon": "三层计划模板",
};

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function planFor(
  workspace: WorkspaceStateV2,
  spaceId: string,
  horizon: Plan<LearningPlanData>["horizon"],
): Plan<LearningPlanData> | null {
  return (
    workspace.plans.find(
      (plan) =>
        plan.ownerModuleId === "learning" &&
        plan.ownerEntityId === spaceId &&
        plan.horizon === horizon,
    ) ?? null
  );
}

function safeFileSegment(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "space"
  );
}

function downloadLearningSpace(
  workspace: WorkspaceStateV2,
  space: LearningSpace,
): void {
  const exportedAt = new Date().toISOString();
  const payload = buildLearningSpaceExport(workspace, space.id, exportedAt);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `growpilot-learning-${safeFileSegment(space.name)}-${localDateKey(
    new Date(),
  )}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

type LearningSpaceWorkspaceProps = {
  workspace: WorkspaceStateV2;
  space: LearningSpace;
  onSave: (workspace: WorkspaceStateV2, announcement: string) => void;
  onAnnounce: (announcement: string) => void;
  onDelete: (space: LearningSpace) => void;
};

function LearningSpaceWorkspace({
  workspace,
  space,
  onSave,
  onAnnounce,
  onDelete,
}: LearningSpaceWorkspaceProps) {
  const monthlyPlan = planFor(workspace, space.id, "monthly");
  const weeklyPlan = planFor(workspace, space.id, "weekly");
  const dailyPlan = planFor(workspace, space.id, "daily");
  const [monthlyGoal, setMonthlyGoal] = useState(
    monthlyPlan ? activePlanData(monthlyPlan).goal : "",
  );
  const [weeklyGoal, setWeeklyGoal] = useState(
    weeklyPlan ? activePlanData(weeklyPlan).goal : "",
  );
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDuration, setTaskDuration] = useState("25");
  const [scheduledDate, setScheduledDate] = useState(localDateKey(new Date()));
  const [deleteOpen, setDeleteOpen] = useState(false);
  const archived = space.status === "archived";
  const canSchedule = space.status === "active";
  const tasks = workspace.tasks.filter(
    (task) =>
      task.ownerModuleId === "learning" && task.ownerEntityId === space.id,
  );

  function savePlanGoal(
    plan: Plan<LearningPlanData> | null,
    goal: string,
    label: string,
  ) {
    if (!plan) return;
    const now = new Date().toISOString();
    const revised = reviseLearningPlan(
      space,
      plan,
      { goal: goal.trim() },
      "user-edit",
      now,
    );
    onSave(
      replaceLearningPlan(workspace, revised, now),
      `${label}已保存`,
    );
  }

  function changeStatus(
    status: LearningSpace["status"],
    announcement: string,
  ) {
    const now = new Date().toISOString();
    const updated = setLearningSpaceStatus(space, status, now);
    onSave(upsertLearningSpace(workspace, updated, now), announcement);
  }

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dailyPlan || !canSchedule) return;

    const now = new Date().toISOString();
    const scheduled = scheduleLearningTask(space, dailyPlan, {
      title: taskTitle,
      durationMinutes: Number(taskDuration),
      scheduledDate,
      now,
    });
    const withPlan = replaceLearningPlan(workspace, scheduled.plan, now);
    onSave(
      upsertTask(withPlan, scheduled.task, now),
      `已添加每日任务：${scheduled.task.title}`,
    );
    setTaskTitle("");
  }

  function exportSpace() {
    downloadLearningSpace(workspace, space);
    onAnnounce(`已导出学习空间：${space.name}`);
  }

  return (
    <article
      aria-labelledby="selected-learning-space-title"
      className="calm-surface rounded-3xl p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <span className="eyebrow">SELECTED SPACE</span>
            <h2
              className="mt-2 break-words text-2xl font-semibold tracking-tight"
              id="selected-learning-space-title"
            >
              {space.name}
            </h2>
          </div>
          <span className="local-badge self-start">{statusLabels[space.status]}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {space.status === "draft" && (
            <button
              className="primary-action"
              onClick={() =>
                changeStatus("active", `已开始学习：${space.name}`)
              }
              type="button"
            >
              开始学习
            </button>
          )}
          {(space.status === "planned" || space.status === "active") && (
            <button
              className="secondary-action"
              onClick={() =>
                changeStatus("paused", `已暂停学习空间：${space.name}`)
              }
              type="button"
            >
              暂停空间
            </button>
          )}
          {space.status === "paused" && (
            <button
              className="primary-action"
              onClick={() =>
                changeStatus("active", `已继续学习：${space.name}`)
              }
              type="button"
            >
              继续学习
            </button>
          )}
          {!archived && (
            <button
              className="secondary-action"
              onClick={() =>
                changeStatus("archived", `已归档学习空间：${space.name}`)
              }
              type="button"
            >
              归档空间
            </button>
          )}
          <button className="secondary-action" onClick={exportSpace} type="button">
            导出空间
          </button>
          <button
            className="secondary-action text-destructive"
            onClick={() => setDeleteOpen(true)}
            type="button"
          >
            删除空间
          </button>
        </div>
      </div>

      <section aria-labelledby="learning-space-goal-title" className="py-6">
        <h3 className="text-sm font-semibold" id="learning-space-goal-title">
          学习目标
        </h3>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">
          {space.goal || "尚未设置学习目标"}
        </p>
      </section>

      <div className="grid gap-4 border-t border-border py-6 md:grid-cols-2">
        <section aria-labelledby="monthly-direction-title" className="rounded-2xl bg-muted/55 p-4">
          <h3 className="font-semibold" id="monthly-direction-title">月度方向</h3>
          {archived ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {monthlyGoal || "尚未设置月度目标"}
            </p>
          ) : monthlyPlan ? (
            <form
              className="mt-4 grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                savePlanGoal(monthlyPlan, monthlyGoal, "月度目标");
              }}
            >
              <label className="field">
                <span>月度目标</span>
                <textarea
                  maxLength={500}
                  onChange={(event) => setMonthlyGoal(event.target.value)}
                  rows={3}
                  value={monthlyGoal}
                />
              </label>
              <button className="secondary-action justify-self-start" type="submit">
                保存月度目标
              </button>
            </form>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">当前空间没有月度计划。</p>
          )}
        </section>

        <section aria-labelledby="weekly-focus-title" className="rounded-2xl bg-muted/55 p-4">
          <h3 className="font-semibold" id="weekly-focus-title">本周重点</h3>
          {archived ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {weeklyGoal || "尚未设置本周目标"}
            </p>
          ) : weeklyPlan ? (
            <form
              className="mt-4 grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                savePlanGoal(weeklyPlan, weeklyGoal, "本周目标");
              }}
            >
              <label className="field">
                <span>本周目标</span>
                <textarea
                  maxLength={500}
                  onChange={(event) => setWeeklyGoal(event.target.value)}
                  rows={3}
                  value={weeklyGoal}
                />
              </label>
              <button className="secondary-action justify-self-start" type="submit">
                保存本周目标
              </button>
            </form>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">当前空间没有每周计划。</p>
          )}
        </section>
      </div>

      <section aria-labelledby="daily-tasks-title" className="border-t border-border pt-6">
        <div>
          <span className="eyebrow">DAILY PLAN</span>
          <h3 className="mt-2 text-lg font-semibold" id="daily-tasks-title">
            每日任务
          </h3>
        </div>

        {!archived && dailyPlan && (
          <form className="mt-4 grid gap-4" onSubmit={addTask}>
            <fieldset
              className="grid gap-4 sm:grid-cols-3"
              disabled={!canSchedule}
            >
              <label className="field sm:col-span-3">
                <span>任务标题</span>
                <input
                  maxLength={120}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  required
                  value={taskTitle}
                />
              </label>
              <label className="field">
                <span>预计分钟</span>
                <input
                  max={1440}
                  min={1}
                  onChange={(event) => setTaskDuration(event.target.value)}
                  required
                  type="number"
                  value={taskDuration}
                />
              </label>
              <label className="field">
                <span>计划日期</span>
                <input
                  onChange={(event) => setScheduledDate(event.target.value)}
                  required
                  type="date"
                  value={scheduledDate}
                />
              </label>
              <button className="primary-action self-end" type="submit">
                添加每日任务
              </button>
            </fieldset>
            {!canSchedule && (
              <p className="text-sm text-muted-foreground">
                {space.status === "paused"
                  ? "空间已暂停，继续学习后才能安排新任务。"
                  : "开始学习后才能安排每日任务。"}
              </p>
            )}
          </form>
        )}

        {tasks.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">还没有每日任务。</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {tasks.map((task) => (
              <li
                className="flex flex-col gap-2 rounded-2xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                key={task.id}
              >
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {task.scheduledDate} · {task.durationMinutes} 分钟
                  </p>
                </div>
                <span className="local-badge self-start">
                  {task.status === "done" ? "已完成" : "待执行"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <LearningDeleteDialog
        onConfirm={() => onDelete(space)}
        onExport={exportSpace}
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
        spaceName={space.name}
      />
    </article>
  );
}

export function LearningModule() {
  const repositoryRef = useRef<WorkspaceRepository | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceStateV2 | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const repository = createBrowserWorkspaceRepository();
    const loadedWorkspace = repository.loadWorkspace();

    repositoryRef.current = repository;
    setWorkspace(loadedWorkspace);
    setSelectedSpaceId(loadedWorkspace.learningSpaces[0]?.id ?? null);
    setHydrated(true);
  }, []);

  function saveWorkspace(
    nextWorkspace: WorkspaceStateV2,
    nextAnnouncement: string,
  ) {
    if (!repositoryRef.current) return;
    repositoryRef.current.saveWorkspace(nextWorkspace);
    setWorkspace(nextWorkspace);
    setAnnouncement(nextAnnouncement);
  }

  function createSpace(values: CreateLearningSpaceValues) {
    if (!workspace || !repositoryRef.current) return;

    const now = new Date().toISOString();
    const space = createLearningSpace({
      name: values.name,
      goal: values.goal,
      templateId: values.templateId,
      now,
    });
    const hierarchy = createLearningPlanHierarchy(
      space,
      values.templateId,
      localDateKey(new Date()),
      now,
    );
    const nextWorkspace: WorkspaceStateV2 = {
      ...workspace,
      learningSpaces: [...workspace.learningSpaces, hierarchy.space],
      plans: [...workspace.plans, ...hierarchy.plans],
      updatedAt: now,
    };

    saveWorkspace(
      nextWorkspace,
      `已创建学习空间：${hierarchy.space.name}`,
    );
    setSelectedSpaceId(hierarchy.space.id);
  }

  function deleteSpace(space: LearningSpace) {
    if (!workspace) return;
    const now = new Date().toISOString();
    const nextWorkspace = removeLearningSpaceBundle(workspace, space.id, now);
    saveWorkspace(nextWorkspace, `已删除学习空间：${space.name}`);
    setSelectedSpaceId(nextWorkspace.learningSpaces[0]?.id ?? null);
  }

  const selectedSpace =
    workspace?.learningSpaces.find((space) => space.id === selectedSpaceId) ??
    workspace?.learningSpaces[0] ??
    null;

  if (!hydrated || !workspace) {
    return (
      <section aria-busy="true" className="page-stack">
        <div className="panel loading-panel">正在加载学习空间…</div>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">LEARNING SPACES</span>
          <h1>学习空间</h1>
          <p>把不同学习方向分开规划，保持目标、计划和后续执行来源清晰。</p>
        </div>
        {workspace.learningSpaces.length > 0 && (
          <LearningSpaceDialog onCreate={createSpace} />
        )}
      </header>

      {workspace.learningSpaces.length === 0 ? (
        <article className="panel">
          <div className="mx-auto flex max-w-xl flex-col items-start gap-5 py-5 sm:items-center sm:py-8 sm:text-center">
            <div>
              <span className="eyebrow">START SMALL</span>
              <h2 className="mt-2 text-xl font-semibold">建立第一个学习空间</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                使用你自己的名称和目标开始；系统不会预置课程、进度或完成证明。
              </p>
            </div>
            <LearningSpaceDialog onCreate={createSpace} />
          </div>
        </article>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)]">
          <aside aria-label="学习空间列表" className="panel self-start">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">SPACES</span>
                <h2>学习方向</h2>
              </div>
              <span className="local-badge">
                {workspace.learningSpaces.length} 个空间
              </span>
            </div>
            <ul className="mt-5 grid gap-3">
              {workspace.learningSpaces.map((space) => {
                const selected = space.id === selectedSpace?.id;
                return (
                  <li key={space.id}>
                    <button
                      aria-label={space.name}
                      aria-pressed={selected}
                      className={`w-full rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        selected
                          ? "border-primary/40 bg-primary/10"
                          : "border-border bg-background/60 hover:bg-muted/70"
                      }`}
                      onClick={() => setSelectedSpaceId(space.id)}
                      type="button"
                    >
                      <span className="block font-semibold">{space.name}</span>
                      <span className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{statusLabels[space.status]}</span>
                        <span aria-hidden="true">·</span>
                        <span>{templateLabels[space.templateId]}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {selectedSpace && (
            <LearningSpaceWorkspace
              key={selectedSpace.id}
              onAnnounce={setAnnouncement}
              onDelete={deleteSpace}
              onSave={saveWorkspace}
              space={selectedSpace}
              workspace={workspace}
            />
          )}
        </div>
      )}

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}
