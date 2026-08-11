"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createBrowserWorkspaceRepository } from "@/core/persistence";
import type { WorkspaceRepository } from "@/core/persistence";
import type { WorkspaceStateV2 } from "@/core/workspace-state";
import {
  createLearningPlanHierarchy,
  createLearningSpace,
  type LearningSpace,
} from "./public";
import {
  LearningSpaceDialog,
  type CreateLearningSpaceValues,
} from "./learning-space-dialog";

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

    repositoryRef.current.saveWorkspace(nextWorkspace);
    setWorkspace(nextWorkspace);
    setSelectedSpaceId(hierarchy.space.id);
    setAnnouncement(`已创建学习空间：${hierarchy.space.name}`);
  }

  if (!hydrated || !workspace) {
    return (
      <section aria-busy="true" className="page-stack">
        <div className="panel loading-panel">正在加载学习空间…</div>
      </section>
    );
  }

  const selectedSpace =
    workspace.learningSpaces.find((space) => space.id === selectedSpaceId) ??
    workspace.learningSpaces[0] ??
    null;

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
              <span className="local-badge">{workspace.learningSpaces.length} 个空间</span>
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
            <article
              aria-labelledby="selected-learning-space-title"
              className="calm-surface rounded-3xl p-5 sm:p-6"
            >
              <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <span className="eyebrow">SELECTED SPACE</span>
                  <h2
                    className="mt-2 break-words text-2xl font-semibold tracking-tight"
                    id="selected-learning-space-title"
                  >
                    {selectedSpace.name}
                  </h2>
                </div>
                <span className="local-badge self-start">
                  {statusLabels[selectedSpace.status]}
                </span>
              </div>

              <section aria-labelledby="learning-space-goal-title" className="py-6">
                <h3 className="text-sm font-semibold" id="learning-space-goal-title">
                  学习目标
                </h3>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">
                  {selectedSpace.goal || "尚未设置学习目标"}
                </p>
              </section>

              <dl className="grid gap-3 border-t border-border pt-5 sm:grid-cols-2">
                <div className="rounded-2xl bg-muted/55 p-4">
                  <dt className="text-xs font-semibold text-muted-foreground">当前状态</dt>
                  <dd className="mt-2 text-sm font-medium">
                    {statusLabels[selectedSpace.status]}
                  </dd>
                </div>
                <div className="rounded-2xl bg-muted/55 p-4">
                  <dt className="text-xs font-semibold text-muted-foreground">空间模板</dt>
                  <dd className="mt-2 text-sm font-medium">
                    {templateLabels[selectedSpace.templateId]}
                  </dd>
                </div>
              </dl>
            </article>
          )}
        </div>
      )}

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}
