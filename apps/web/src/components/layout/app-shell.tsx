"use client";

import { useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { pageEnter } from "@/lib/motion-variants";

/**
 * Workbench shell: desktop Sidebar + TopBar + main workspace.
 * Mobile (< md): the desktop sidebar is hidden; a bottom nav (5 primary
 * tabs) and a hamburger drawer (all nine entries) replace it. Safe-area
 * insets are handled by the fixed mobile nav.
 *
 * The main content area uses the semantic card surface so text keeps
 * full contrast under every theme; page switches re-animate the outlet
 * with a quiet opacity/y transition that never gates visibility.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="grid-bg radial-fade flex h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((v) => !v)}
          onOpenDrawer={() => setDrawerOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-card pb-16 md:pb-0">
          <motion.div
            key={pathname}
            initial={false}
            animate={pageEnter.animate}
            exit={pageEnter.exit}
            transition={pageEnter.transition}
            className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6"
          >
            {children}
          </motion.div>
        </main>
      </div>

      <MobileNav />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
