"use client";

import { useEffect, useMemo, useState } from "react";
import { createEmptyDailyLoopState, type DailyLoopState } from "@/core/daily-loop";
import { createWorkspaceRepository } from "@/core/persistence";
import { buildDashboardData } from "@/components/dashboard/dashboard-data";
import { BentoGrid, BentoCell } from "@/components/dashboard/bento-grid";
import { TodayFocusCard } from "@/components/dashboard/today-focus-card";
import { LearningProgressCard } from "@/components/dashboard/learning-progress-card";
import { ProjectProgressCard } from "@/components/dashboard/project-progress-card";
import { QuickPromptsCard } from "@/components/dashboard/quick-prompts-card";
import { RecentReviewsCard } from "@/components/dashboard/recent-reviews-card";
import { TodayTasksCard } from "@/components/tasks/today-tasks-card";
import { KnowledgeUpdatesCard } from "@/components/knowledge/knowledge-updates-card";
import { AiSuggestionCard } from "@/components/ai/ai-suggestion-card";
import { formatDateKey } from "@/lib/utils";

/**
 * Dashboard home — Bento Grid of eight modules. Real data where the V1
 * daily loop provides it; demo rows elsewhere until their owning stages.
 */
export function DashboardModule() {
  const [state, setState] = useState<DailyLoopState>(() => createEmptyDailyLoopState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(createWorkspaceRepository(window.localStorage).loadDailyLoop());
    setHydrated(true);
  }, []);

  const data = useMemo(() => buildDashboardData(state), [state]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">工作台</h1>
        <p className="text-sm text-muted-foreground">
          {hydrated ? formatDateKey(data.date) : "加载中…"}
          {data.goal ? ` · ${data.goal}` : ""}
        </p>
      </header>

      <BentoGrid>
        <BentoCell className="md:col-span-3 lg:col-span-4">
          <TodayFocusCard goal={data.goal} completed={data.completed} planned={data.planned} />
        </BentoCell>
        <BentoCell className="md:col-span-3 lg:col-span-4">
          <TodayTasksCard tasks={state.tasks} />
        </BentoCell>
        <BentoCell className="md:col-span-6 lg:col-span-4">
          <AiSuggestionCard suggestion={data.suggestion} />
        </BentoCell>

        <BentoCell className="md:col-span-3 lg:col-span-4">
          <LearningProgressCard />
        </BentoCell>
        <BentoCell className="md:col-span-3 lg:col-span-4">
          <ProjectProgressCard />
        </BentoCell>
        <BentoCell className="md:col-span-6 lg:col-span-4">
          <KnowledgeUpdatesCard />
        </BentoCell>

        <BentoCell className="md:col-span-3 lg:col-span-4">
          <QuickPromptsCard />
        </BentoCell>
        <BentoCell className="md:col-span-3 lg:col-span-4">
          <RecentReviewsCard />
        </BentoCell>
        <BentoCell className="md:col-span-6 lg:col-span-4">
          <div className="h-full rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            更多模块即将上线
          </div>
        </BentoCell>
      </BentoGrid>
    </div>
  );
}
