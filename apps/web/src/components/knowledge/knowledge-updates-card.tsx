"use client";

import { Database } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

/**
 * 知识库最近更新 — honest empty state until the knowledge module
 * provides real entries. No invented titles or timestamps.
 */
export function KnowledgeUpdatesCard() {
  return (
    <DashboardCard title="知识库最近更新" icon={<Database size={14} className="text-primary" />}>
      <div className="rounded-lg border border-dashed border-border p-4 text-center">
        <p className="text-[13px] text-muted-foreground">知识库还没有内容</p>
        <p className="mt-1 text-[11px] text-muted-foreground/80">
          保存第一条资料后，最近的更新会显示在这里。
        </p>
      </div>
    </DashboardCard>
  );
}
