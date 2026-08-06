"use client";

import { BookOpen } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { demoLearningProgress } from "@/components/dashboard/dashboard-data";

/** 学习进度 — demo rows with progress bars (backend lands in Stage 3). */
export function LearningProgressCard() {
  return (
    <DashboardCard title="学习进度" icon={<BookOpen size={14} className="text-primary" />}>
      <ul className="space-y-3">
        {demoLearningProgress.map((item) => (
          <li key={item.id}>
            <div className="mb-1 flex items-center justify-between text-[12px]">
              <span className="truncate">{item.title}</span>
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
