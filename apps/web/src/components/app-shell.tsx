"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  BrainCircuit,
  Database,
  Dumbbell,
  Languages,
  LayoutDashboard,
  Settings,
  Sparkles,
} from "lucide-react";
import { moduleRegistry, type ModuleKey } from "@/lib/module-registry";
import { ThemeSwitcher } from "@/components/theme-switcher";

const icons: Record<ModuleKey, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  learning: BookOpen,
  english: Languages,
  fitness: Dumbbell,
  knowledge: Database,
  "llm-provider": BrainCircuit,
};

const mobileKeys: ModuleKey[] = ["dashboard", "learning", "english", "fitness", "knowledge"];

function isActive(pathname: string, href: string, key: ModuleKey) {
  return pathname === href || (pathname === "/" && key === "dashboard");
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="主导航">
        <Link className="brand" href="/dashboard" aria-label="GrowPilot 首页">
          <span className="brand-mark"><Sparkles size={18} /></span>
          <span><strong>GrowPilot</strong><small>Personal Growth OS</small></span>
        </Link>

        <nav className="nav-list">
          {moduleRegistry.map((module) => {
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
          })}
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
          <Link className="icon-link" href="/llm-providers" aria-label="模型设置">
            <Settings size={19} />
          </Link>
        </header>
        <main className="main-content">{children}</main>
      </div>

      <nav className="mobile-nav" aria-label="移动端主导航">
        {moduleRegistry
          .filter((module) => mobileKeys.includes(module.key))
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
      </nav>
    </div>
  );
}
