"use client";

import { Zap } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { demoPrompts } from "@/components/dashboard/dashboard-data";

/** 快捷 Prompt — clickable chips (copies prompt to clipboard on click). */
export function QuickPromptsCard() {
  const copyPrompt = (prompt: string) => {
    navigator.clipboard?.writeText(prompt).catch(() => {});
  };

  return (
    <DashboardCard title="快捷 Prompt" icon={<Zap size={14} className="text-primary" />}>
      <div className="flex flex-wrap gap-1.5">
        {demoPrompts.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => copyPrompt(item.prompt)}
            className="rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-[12px] text-foreground/85 transition-colors hover:bg-accent active:scale-[0.98]"
            title={item.prompt}
          >
            {item.label}
          </button>
        ))}
      </div>
    </DashboardCard>
  );
}
