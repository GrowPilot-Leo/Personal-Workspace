"use client";

import { Menu, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";

type TopBarProps = {
  collapsed: boolean;
  onToggleSidebar: () => void;
  onOpenDrawer: () => void;
};

/** Quiet application chrome. Non-functional search stays absent until it has a real workflow. */
export function TopBar({ collapsed, onToggleSidebar, onOpenDrawer }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-md">
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

      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-xs font-semibold tracking-wide text-foreground">
          PERSONAL WORKSPACE
        </span>
        <span className="hidden text-xs text-muted-foreground sm:inline">· 清晰地完成今天</span>
      </div>

      <div className="ml-auto flex items-center">
        <ThemeSwitcher />
      </div>
    </header>
  );
}
