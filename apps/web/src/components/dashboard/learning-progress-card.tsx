"use client";

import { BookOpen } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

/**
 * 学习进度 — honest empty state until the configurable Learning Space
 * (Stage 3) provides real, traceable progress. No invented percentages.
 */
export function LearningProgressCard() {
  return (
    <DashboardCard title="学习进度" icon={<BookOpen size={14} className="text-primary" />}>
      <div className="rounded-lg border border-dashed border-border p-4 text-center">
        <p className="text-[13px] text-muted-foreground">暂无学习记录</p>
        <p className="mt-1 text-[11px] text-muted-foreground/80">
          进入学习中心创建第一个主题后，进度会显示在这里。
        </p>
      </div>
    </DashboardCard>
  );
}
