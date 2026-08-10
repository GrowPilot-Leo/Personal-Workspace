"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cardHover } from "@/lib/motion-variants";
import { cn } from "@/lib/utils";

type DashboardCardProps = {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** Bento card wrapper: quiet shadow, subtle lift on hover (motion). */
export function DashboardCard({ title, icon, action, className, children }: DashboardCardProps) {
  return (
    <motion.div
      whileHover={cardHover.whileHover}
      transition={cardHover.transition}
      className={cn("h-full", className)}
    >
      <Card className="h-full border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px] font-medium">
            {icon}
            {title}
          </CardTitle>
          {action}
        </CardHeader>
        <CardContent className="pt-1">{children}</CardContent>
      </Card>
    </motion.div>
  );
}
