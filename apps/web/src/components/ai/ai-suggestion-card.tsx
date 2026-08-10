"use client";

import { Compass } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

type ActionSuggestionCardProps = {
  suggestion: string;
};

/** Deterministic action suggestion derived from the real daily-loop state. */
export function AiSuggestionCard({ suggestion }: ActionSuggestionCardProps) {
  return (
    <DashboardCard title="行动建议" icon={<Compass size={14} className="text-primary" />}>
      <p className="text-[13px] leading-relaxed text-foreground/90">{suggestion}</p>
      <p className="mt-2 text-[11px] text-muted-foreground">规则建议，不会自动修改计划</p>
    </DashboardCard>
  );
}
