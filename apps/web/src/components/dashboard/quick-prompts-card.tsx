"use client";

import { useState } from "react";
import { Check, Copy, X, Zap } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { demoPrompts, type PromptItem } from "@/components/dashboard/dashboard-data";

type Feedback = { id: string; status: "success" | "error" } | null;

/**
 * 快捷 Prompt — clickable chips that copy the prompt to the clipboard.
 * Success and failure are both surfaced (never silently swallowed): the
 * chip shows 已复制/复制失败 and an aria-live region announces the result.
 */
export function QuickPromptsCard() {
  const [feedback, setFeedback] = useState<Feedback>(null);

  const copyPrompt = async (item: PromptItem) => {
    if (!navigator.clipboard) {
      setFeedback({ id: item.id, status: "error" });
      window.setTimeout(() => setFeedback(null), 2000);
      return;
    }
    try {
      await navigator.clipboard.writeText(item.prompt);
      setFeedback({ id: item.id, status: "success" });
    } catch {
      setFeedback({ id: item.id, status: "error" });
    }
    window.setTimeout(() => setFeedback(null), 2000);
  };

  return (
    <DashboardCard title="快捷 Prompt" icon={<Zap size={14} className="text-primary" />}>
      <div className="flex flex-wrap gap-1.5">
        {demoPrompts.map((item) => {
          const state = feedback?.id === item.id ? feedback.status : null;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => void copyPrompt(item)}
              aria-label={`${item.label}，点击复制到剪贴板`}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-colors active:scale-[0.98] ${
                state === "success"
                  ? "border-transparent bg-[var(--color-success)]/15 text-[var(--color-success)]"
                  : state === "error"
                    ? "border-transparent bg-[var(--color-danger)]/15 text-[var(--color-danger)]"
                    : "border-border bg-secondary/60 text-foreground/85 hover:bg-accent"
              }`}
              title={item.prompt}
            >
              {state === "success" ? (
                <Check size={12} aria-hidden="true" />
              ) : state === "error" ? (
                <X size={12} aria-hidden="true" />
              ) : (
                <Copy size={12} aria-hidden="true" />
              )}
              {state === "success"
                ? "已复制"
                : state === "error"
                  ? "复制失败"
                  : item.label}
            </button>
          );
        })}
      </div>
      <span aria-live="polite" className="sr-only">
        {feedback
          ? feedback.status === "success"
            ? "提示词已复制到剪贴板"
            : "复制失败，请检查剪贴板权限"
          : ""}
      </span>
    </DashboardCard>
  );
}
