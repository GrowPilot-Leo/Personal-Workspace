"use client";

import { History } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { demoReviews } from "@/components/dashboard/dashboard-data";

/** 最近复盘 — demo rows from V1 review history. */
export function RecentReviewsCard() {
  return (
    <DashboardCard title="最近复盘" icon={<History size={14} className="text-primary" />}>
      <ul className="space-y-2.5">
        {demoReviews.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-[13px]">
            <span className="shrink-0 text-[11px] text-muted-foreground">{item.date.slice(5)}</span>
            <span className="min-w-0 truncate">{item.wins}</span>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
