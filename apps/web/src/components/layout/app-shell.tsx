"use client";

import { useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { pageEnter } from "@/lib/motion-variants";

/**
 * Workbench shell: collapsible Sidebar + TopBar + main workspace.
 * Page switches re-animate the outlet with a quiet opacity/y transition.
 *
 * Background note: the outer container uses a plain background only
 * (no mask-image, no covering overlay). The main content area sits on
 * white so text keeps full contrast.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="grid-bg radial-fade flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar collapsed={collapsed} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar collapsed={collapsed} onToggleSidebar={() => setCollapsed((v) => !v)} />
        <main className="flex-1 overflow-y-auto bg-white">
          <motion.div
            key={pathname}
            initial={false}
            animate={pageEnter.animate}
            exit={pageEnter.exit}
            transition={pageEnter.transition}
            className="mx-auto w-full max-w-6xl px-6 py-6"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
