"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { createEmptyDailyLoopState, type DailyLoopState } from "@/core/daily-loop";
import { createBrowserWorkspaceRepository } from "@/core/persistence";
import { buildDashboardData } from "@/components/dashboard/dashboard-data";
import { BentoGrid, BentoCell } from "@/components/dashboard/bento-grid";
import { TodayFocusCard } from "@/components/dashboard/today-focus-card";
import { QuickPromptsCard } from "@/components/dashboard/quick-prompts-card";
import { RecentReviewsCard } from "@/components/dashboard/recent-reviews-card";
import { TodayTasksCard } from "@/components/tasks/today-tasks-card";
import { AiSuggestionCard } from "@/components/ai/ai-suggestion-card";
import { formatDateKey } from "@/lib/utils";

/** Dashboard is a concise overview; daily execution remains owned by Today. */
export function DashboardModule() {
  const [state, setState] = useState<DailyLoopState>(() => createEmptyDailyLoopState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(createBrowserWorkspaceRepository().loadDailyLoop());
    setHydrated(true);
  }, []);

  const data = useMemo(() => buildDashboardData(state), [state]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-[0.15em] text-primary">OVERVIEW</span>
          <h1 className="text-2xl font-semibold tracking-tight">工作台</h1>
          <p className="text-sm text-muted-foreground">
            {hydrated ? formatDateKey(data.date) : "加载中…"}
            {data.goal ? ` · ${data.goal}` : " · 尚未设置阶段目标"}
          </p>
        </div>
        <Link className="summer-action-button" href="/today">
          <span className="summer-float-icon" aria-hidden="true">🐤</span>
          进入今日行动 <ArrowRight size={15} aria-hidden="true" />
        </Link>
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

        <BentoCell className="md:col-span-3 lg:col-span-6">
          <QuickPromptsCard />
        </BentoCell>
        <BentoCell className="md:col-span-3 lg:col-span-6">
          <RecentReviewsCard />
        </BentoCell>
      </BentoGrid>
    </div>
  );
}
