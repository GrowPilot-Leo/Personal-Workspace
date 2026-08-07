"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Database,
  Dumbbell,
  RotateCcw,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom navigation — exactly five primary tabs, fixed above the
 * safe-area inset. All nine entries stay reachable: the remaining four
 * live in the hamburger drawer (see MobileDrawer).
 */
const tabs: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/today", label: "今日", icon: Sun },
  { href: "/learning", label: "学习", icon: BookOpen },
  { href: "/fitness", label: "健身", icon: Dumbbell },
  { href: "/review", label: "复盘", icon: RotateCcw },
  { href: "/knowledge", label: "知识", icon: Database },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="移动端主导航"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <div className="grid grid-cols-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active =
            pathname === tab.href || (pathname === "/" && tab.href === "/today");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[52px] flex-col items-center justify-center gap-1 text-[10px] transition-colors duration-150",
                active
                  ? "font-medium text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon size={20} aria-hidden="true" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
