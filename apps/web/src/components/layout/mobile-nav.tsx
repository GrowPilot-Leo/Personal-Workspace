"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Database,
  RotateCcw,
  Settings,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Five high-frequency daily-loop destinations. Lower-readiness modules stay in the drawer. */
const tabs: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/today", label: "今日", icon: Sun },
  { href: "/learning", label: "学习", icon: BookOpen },
  { href: "/review", label: "复盘", icon: RotateCcw },
  { href: "/knowledge", label: "知识", icon: Database },
  { href: "/settings", label: "设置", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="移动端主导航"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_32px_rgba(7,59,76,0.06)] backdrop-blur-xl md:hidden"
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
                "flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl text-[10px] transition-[color,background,transform] duration-200 active:scale-95",
                active
                  ? "font-semibold text-primary"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
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
