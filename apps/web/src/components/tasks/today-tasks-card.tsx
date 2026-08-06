"use client";

import { CheckCircle2, Circle, ListTodo } from "lucide-react";
import type { DailyTask } from "@/core/daily-loop";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { cn } from "@/lib/utils";

type TodayTasksCardProps = {
  tasks: DailyTask[];
};

/** 今日任务 — real V1 task checklist. */
export function TodayTasksCard({ tasks }: TodayTasksCardProps) {
  const done = tasks.filter((t) => t.completedAt).length;
  return (
    <DashboardCard
      title="今日任务"
      icon={<ListTodo size={14} className="text-primary" />}
      action={
        <span className="text-[11px] text-muted-foreground">{done}/{tasks.length}</span>
      }
    >
      {tasks.length === 0 ? (
        <p className="py-2 text-xs text-muted-foreground">今天还没有任务</p>
      ) : (
        <ul className="space-y-1.5">
          {tasks.slice(0, 4).map((task) => (
            <li key={task.id} className="flex items-center gap-2 text-[13px]">
              {task.completedAt ? (
                <CheckCircle2 size={14} className="shrink-0 text-primary" aria-hidden="true" />
              ) : (
                <Circle size={14} className="shrink-0 text-muted-foreground/50" aria-hidden="true" />
              )}
              <span className={cn("min-w-0 truncate", task.completedAt && "text-muted-foreground line-through")}>
                {task.title}
              </span>
              <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                {task.durationMinutes}m
              </span>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
