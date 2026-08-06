"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BookOpen,
  Database,
  Dumbbell,
  Languages,
  MoreHorizontal,
  RotateCcw,
  Settings,
  Sparkles,
  Sun,
  Target,
} from "lucide-react";
import { moduleRegistry, type ModuleKey } from "@/lib/module-registry";
import { ThemeSwitcher } from "@/components/theme-switcher";

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

// Mobile bottom bar shows the five primary modules; the rest live in a
// "more" drawer (Task 6: responsive nine-module navigation).
const mobilePrimaryKeys: ModuleKey[] = ["today", "learning", "career", "english", "fitness"];
const mobileMoreKeys: ModuleKey[] = ["review", "knowledge", "badge", "settings"];

function isActive(pathname: string, href: string, key: ModuleKey) {
  return pathname === href || (pathname === "/" && key === "today");
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const renderNavItem = (module: (typeof moduleRegistry)[number]) => {
    const Icon = icons[module.key];
    const active = isActive(pathname, module.href, module.key);
    return (
      <Link
        className={active ? "nav-item active" : "nav-item"}
        href={module.href}
        key={module.key}
      >
        <Icon size={18} aria-hidden="true" />
        <span><strong>{module.label}</strong><small>{module.description}</small></span>
      </Link>
    );
  };

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="主导航">
        <Link className="brand" href="/today" aria-label="GrowPilot 首页">
          <span className="brand-mark"><Sparkles size={18} /></span>
          <span><strong>GrowPilot</strong><small>Personal Growth OS</small></span>
        </Link>

        <nav className="nav-list">
          {moduleRegistry.map(renderNavItem)}
        </nav>

        <div className="sidebar-footer">
          <ThemeSwitcher />
          <div className="sidebar-note">
            <span className="status-dot" />
            <span>V2 演示 · 本地数据</span>
          </div>
        </div>
      </aside>

      <div className="workspace">
        <header className="mobile-header">
          <span className="brand-mark mobile-brand-mark"><Sparkles size={16} /></span>
          <strong>GrowPilot</strong>
          <Link className="icon-link" href="/settings" aria-label="设置">
            <Settings size={19} />
          </Link>
        </header>
        <main className="main-content">{children}</main>
      </div>

      <nav className="mobile-nav" aria-label="移动端主导航">
        {moduleRegistry
          .filter((module) => mobilePrimaryKeys.includes(module.key))
          .map((module) => {
            const Icon = icons[module.key];
            const active = isActive(pathname, module.href, module.key);
            return (
              <Link
                className={active ? "mobile-nav-item active" : "mobile-nav-item"}
                href={module.href}
                key={module.key}
              >
                <Icon size={19} aria-hidden="true" />
                <span>{module.shortLabel}</span>
              </Link>
            );
          })}
        <details className="mobile-more">
          <summary className="mobile-nav-item" aria-label="更多模块">
            <MoreHorizontal size={19} aria-hidden="true" />
            <span>更多</span>
          </summary>
          <div className="mobile-more-panel">
            {moduleRegistry
              .filter((module) => mobileMoreKeys.includes(module.key))
              .map(renderNavItem)}
          </div>
        </details>
      </nav>
    </div>
  );
}
