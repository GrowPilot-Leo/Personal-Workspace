"use client";

import { FolderKanban } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { demoProjects } from "@/components/dashboard/dashboard-data";

/** 项目进度 — demo rows; status dot signals at-risk items. */
export function ProjectProgressCard() {
  return (
    <DashboardCard title="项目进度" icon={<FolderKanban size={14} className="text-primary" />}>
      <ul className="space-y-3">
        {demoProjects.map((item) => (
          <li key={item.id}>
            <div className="mb-1 flex items-center justify-between text-[12px]">
              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  className={
                    item.status === "at-risk"
                      ? "h-1.5 w-1.5 shrink-0 rounded-full bg-destructive"
                      : item.status === "done"
                        ? "h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                        : "h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50"
                  }
                  aria-hidden="true"
                />
                <span className="truncate">{item.title}</span>
              </span>
              <span className="text-muted-foreground">{item.progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
