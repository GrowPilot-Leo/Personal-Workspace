"use client";

import { Target } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

type FocusCardProps = {
  goal: string;
  completed: number;
  planned: number;
};

/** 今日重点 — top focus summary derived from the daily loop. */
export function TodayFocusCard({ goal, completed, planned }: FocusCardProps) {
  return (
    <DashboardCard title="今日重点" icon={<Target size={14} className="text-primary" />}>
      <p className="line-clamp-2 text-[15px] font-medium leading-snug">
        {goal || "先设定一个阶段目标"}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {completed}/{planned} 个任务已完成
      </p>
    </DashboardCard>
  );
}
