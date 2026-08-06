"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Award,
  BookOpen,
  Database,
  Dumbbell,
  Languages,
  LayoutDashboard,
  RotateCcw,
  Settings,
  Sparkles,
  Sun,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { moduleRegistry, type ModuleKey } from "@/lib/module-registry";

const icons: Record<ModuleKey, typeof Sun> = {
  today: Sun,
  learning: BookOpen,
  career: Target,
  english: Languages,
  fitness: Dumbbell,
  review: RotateCcw,
  knowledge: Database,
  badge: Award,
  settings: Settings,
};

type SidebarProps = {
  collapsed: boolean;
  onNavigate?: () => void;
};

/** Collapsible left sidebar with smooth width transition (motion). */
export function Sidebar({ collapsed, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, key: ModuleKey) =>
    pathname === href || (pathname === "/" && key === "today");

  return (
    <motion.aside
      className="flex h-full flex-col border-r border-border bg-sidebar"
      animate={{ width: collapsed ? 64 : 248 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      aria-label="主导航"
    >
      <Link
        href="/dashboard"
        className="flex h-14 items-center gap-2.5 px-4 text-sm font-semibold"
        onClick={onNavigate}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles size={15} />
        </span>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden whitespace-nowrap"
            >
              GrowPilot
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      <nav className="flex-1 space-y-0.5 overflow-hidden px-2 py-2">
        {moduleRegistry.map((module) => {
          const Icon = icons[module.key];
          const active = isActive(module.href, module.key);
          return (
            <Link
              key={module.key}
              href={module.href}
              onClick={onNavigate}
              title={collapsed ? module.label : undefined}
              className={cn(
                "flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13px] transition-colors duration-150",
                active
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <Icon size={16} className="shrink-0" aria-hidden="true" />
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {module.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        {!collapsed && (
          <p className="px-1 text-[11px] text-muted-foreground">
            V2 视觉重构 · 本地数据
          </p>
        )}
      </div>
    </motion.aside>
  );
}
