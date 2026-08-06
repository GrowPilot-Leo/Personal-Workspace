"use client";

import { PanelLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";

type TopBarProps = {
  collapsed: boolean;
  onToggleSidebar: () => void;
};

/** Top bar: sidebar toggle, search placeholder, theme switcher. */
export function TopBar({ collapsed, onToggleSidebar }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
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
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="搜索…"
          aria-label="全局搜索（占位）"
          className="h-8 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeSwitcher />
      </div>
    </header>
  );
}
