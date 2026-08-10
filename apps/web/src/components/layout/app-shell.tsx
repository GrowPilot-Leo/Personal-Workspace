"use client";

import { useState, type ReactNode } from "react";
import { MotionConfig, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { pageEnter } from "@/lib/motion-variants";
import { useTheme } from "@/shared/theme/theme-provider";

/**
 * Workbench shell: desktop Sidebar + TopBar + main workspace.
 * Mobile (< md): the desktop sidebar is hidden; a bottom nav (4 daily-loop
 * tabs) and a hamburger drawer (5 complementary entries) replace it. Safe-area
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
  const { motion: motionPreference } = useTheme();
  const reducedMotion =
    motionPreference === "full"
      ? "never"
      : motionPreference === "system"
        ? "user"
        : "always";

  return (
    <MotionConfig reducedMotion={reducedMotion}>
      <div className="calm-shell flex h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((v) => !v)}
          onOpenDrawer={() => setDrawerOpen(true)}
        />
        <main className="calm-main flex-1 overflow-y-auto pb-20 md:pb-0">
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
    </MotionConfig>
  );
}
