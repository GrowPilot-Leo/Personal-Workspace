"use client";

import { Menu, PanelLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";

type TopBarProps = {
  collapsed: boolean;
  onToggleSidebar: () => void;
  onOpenDrawer: () => void;
};

/**
 * Top bar: sidebar toggle (desktop collapse / mobile drawer), search
 * placeholder, theme switcher. Glass effect applies to the bar itself
 * only (bg-background/90 + blur), never to the content beneath. Colors
 * come from semantic tokens only.
 */
export function TopBar({ collapsed, onToggleSidebar, onOpenDrawer }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label={collapsed ? "展开侧边栏" : "折叠侧边栏"}
        className="hidden shrink-0 md:inline-flex"
      >
        <PanelLeft size={16} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenDrawer}
        aria-label="打开模块导航"
        className="shrink-0 md:hidden"
      >
        <Menu size={18} />
      </Button>

      <div className="relative max-w-md flex-1">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="搜索即将开放…"
          aria-label="全局搜索（即将开放）"
          disabled
          className="h-8 w-full cursor-not-allowed rounded-lg border border-border bg-muted pl-8 pr-3 text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          即将开放
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeSwitcher />
      </div>
    </header>
  );
}
