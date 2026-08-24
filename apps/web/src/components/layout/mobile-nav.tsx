"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  RotateCcw,
  Settings,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  mvpModuleRegistry,
  type ModuleKey,
} from "@/lib/module-registry";

const tabIcons: Partial<Record<ModuleKey, LucideIcon>> = {
  today: Sun,
  learning: BookOpen,
  review: RotateCcw,
  settings: Settings,
};

/** The same four MVP destinations as the desktop sidebar. */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="移动端主导航"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_20px_rgba(25,27,24,0.05)] backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto grid w-full max-w-md grid-cols-4 px-2">
        {mvpModuleRegistry.map((module) => {
          const Icon = tabIcons[module.key] ?? Sun;
          const active =
            pathname === module.href ||
            (pathname === "/" && module.key === "today");
          return (
            <Link
              key={module.href}
              href={module.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex min-h-[64px] min-w-0 flex-col items-center justify-start gap-0.5 px-1 pb-1 pt-2 text-center text-[10px] leading-none transition-[color,transform] duration-200 active:scale-95",
                active
                  ? "font-semibold text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-10 shrink-0 place-items-center rounded-[13px] transition-colors duration-200",
                  active ? "bg-primary/10" : "group-hover:bg-accent/50",
                )}
              >
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className="block w-full truncate text-center">
                {module.shortLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
