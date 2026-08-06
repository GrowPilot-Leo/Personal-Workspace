"use client";

import { Database } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { demoKnowledgeUpdates } from "@/components/dashboard/dashboard-data";

/** 知识库最近更新 — demo rows (RAG backend lands in Stage 4). */
export function KnowledgeUpdatesCard() {
  return (
    <DashboardCard title="知识库最近更新" icon={<Database size={14} className="text-primary" />}>
      <ul className="space-y-2.5">
        {demoKnowledgeUpdates.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 text-[13px]">
            <span className="min-w-0 truncate">{item.title}</span>
            <span className="shrink-0 text-[11px] text-muted-foreground">{item.updatedAt}</span>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
