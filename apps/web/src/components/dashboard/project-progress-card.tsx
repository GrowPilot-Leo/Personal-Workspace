"use client";

import { FolderKanban } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

/**
 * 项目进度 — honest empty state until projects carry real, traceable
 * status. No invented percentages or risk states.
 */
export function ProjectProgressCard() {
  return (
    <DashboardCard title="项目进度" icon={<FolderKanban size={14} className="text-primary" />}>
      <div className="rounded-lg border border-dashed border-border p-4 text-center">
        <p className="text-[13px] text-muted-foreground">暂无项目进度</p>
        <p className="mt-1 text-[11px] text-muted-foreground/80">
          项目功能接入后，进度和风险状态会显示在这里。
        </p>
      </div>
    </DashboardCard>
  );
}
