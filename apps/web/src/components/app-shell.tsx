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
  Menu,
  Sparkles,
} from "lucide-react";
import { moduleRegistry, type ModuleKey } from "@/lib/module-registry";

const icons: Record<ModuleKey, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  learning: BookOpen,
  english: Languages,
  fitness: Dumbbell,
  knowledge: Database,
  "llm-provider": BrainCircuit,
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="主导航">
        <Link className="brand" href="/dashboard" aria-label="GrowPilot 首页">
          <span className="brand-mark"><Sparkles size={18} /></span>
          <span>
            <strong>GrowPilot</strong>
            <small>Personal Growth OS</small>
          </span>
        </Link>

        <nav className="nav-list">
          {moduleRegistry.map((module) => {
            const Icon = icons[module.key];
            const active =
              pathname === module.href ||
              (pathname === "/" && module.key === "dashboard");

            return (
              <Link
                className={active ? "nav-item active" : "nav-item"}
                href={module.href}
                key={module.key}
              >
                <Icon size={18} aria-hidden="true" />
                <span>
                  <strong>{module.label}</strong>
                  <small>{module.description}</small>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-note">
          <span className="status-dot" />
          <span>V0.1 模块骨架</span>
        </div>
      </aside>

      <div className="workspace">
        <header className="mobile-header">
          <Menu size={20} aria-hidden="true" />
          <strong>GrowPilot</strong>
          <span className="header-badge">V0.1</span>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
