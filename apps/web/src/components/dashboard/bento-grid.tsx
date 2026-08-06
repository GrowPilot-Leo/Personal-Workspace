"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BentoCellProps = {
  className?: string;
  children: ReactNode;
};

/** A single bento cell. Span classes come from the caller. */
export function BentoCell({ className, children }: BentoCellProps) {
  return <div className={cn("min-h-0", className)}>{children}</div>;
}

/**
 * Bento grid: 12-column responsive layout.
 *   desktop: 12 cols; tablet: 6; mobile: 1
 * Cells express their span via className (e.g. "md:col-span-6 lg:col-span-4").
 */
export function BentoGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 md:grid-cols-6 lg:grid-cols-12",
        className,
      )}
    >
      {children}
    </div>
  );
}
