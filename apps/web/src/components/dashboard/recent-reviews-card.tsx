"use client";

import { History } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

/**
 * 最近复盘 — honest empty state until V1 review history is wired through
 * the V2 repository (V3-006). No invented dates or wins.
 */
export function RecentReviewsCard() {
  return (
    <DashboardCard title="最近复盘" icon={<History size={14} className="text-primary" />}>
      <div className="rounded-lg border border-dashed border-border p-4 text-center">
        <p className="text-[13px] text-muted-foreground">还没有复盘记录</p>
        <p className="mt-1 text-[11px] text-muted-foreground/80">
          完成首次复盘后，最近的收获会显示在这里。
        </p>
      </div>
    </DashboardCard>
  );
}
