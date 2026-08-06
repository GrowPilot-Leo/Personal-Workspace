"use client";

import { PanelLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";

type TopBarProps = {
  collapsed: boolean;
  onToggleSidebar: () => void;
};

/**
 * Top bar: sidebar toggle, search placeholder, theme switcher.
 * Glass effect applies to the bar itself only (bg-white/90 + blur),
 * never to the content beneath.
 */
export function TopBar({ collapsed, onToggleSidebar }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-black/5 bg-white/90 px-4 backdrop-blur-md">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label={collapsed ? "展开侧边栏" : "折叠侧边栏"}
        className="shrink-0"
      >
        <PanelLeft size={16} />
      </Button>

      <div className="relative max-w-md flex-1">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="搜索…"
          aria-label="全局搜索（占位）"
          className="h-8 w-full rounded-lg border border-black/5 bg-zinc-50 pl-8 pr-3 text-[13px] text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:ring-1 focus:ring-zinc-300"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeSwitcher />
      </div>
    </header>
  );
}
