"use client";

import { Sparkles } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

type AiSuggestionCardProps = {
  suggestion: string;
};

/** AI 建议 — driven by the real V1 next-day suggestion rule. */
export function AiSuggestionCard({ suggestion }: AiSuggestionCardProps) {
  return (
    <DashboardCard title="AI 建议" icon={<Sparkles size={14} className="text-ai-accent" />}>
      <p className="text-[13px] leading-relaxed text-foreground/90">{suggestion}</p>
      <p className="mt-2 text-[11px] text-muted-foreground">基于真实任务状态生成</p>
    </DashboardCard>
  );
}
