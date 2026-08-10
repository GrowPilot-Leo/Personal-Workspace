"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Award,
  BookOpen,
  Database,
  Dumbbell,
  Languages,
  RotateCcw,
  Settings,
  Sparkles,
  Sun,
  Target,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { moduleRegistry, type ModuleKey } from "@/lib/module-registry";

const icons: Record<ModuleKey, LucideIcon> = {
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

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
};

/** Mobile module drawer with focus entry, trapping and restoration. */
export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const frame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  const isActive = (href: string, key: ModuleKey) =>
    pathname === href || (pathname === "/" && key === "today");

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <motion.button
            type="button"
            aria-label="关闭导航遮罩"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-black/40"
          />
          <motion.aside
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="模块导航"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 34, stiffness: 420, mass: 0.78 }}
            className="absolute inset-y-0 left-0 flex w-72 max-w-[82vw] flex-col border-r border-border bg-card"
          >
            <header className="flex h-14 items-center gap-2.5 px-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles size={15} />
              </span>
              <span className="text-sm font-semibold">GrowPilot</span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="关闭导航"
                className="ml-auto grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X size={16} />
              </button>
            </header>
            <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
              {moduleRegistry.map((module) => {
                const Icon = icons[module.key];
                const active = isActive(module.href, module.key);
                return (
                  <Link
                    key={module.key}
                    href={module.href}
                    onClick={onClose}
                    className={cn(
                      "flex h-11 items-center gap-3 rounded-xl px-3 text-[14px] transition-[background,color,transform] duration-200 active:scale-[0.98]",
                      active
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                    )}
                  >
                    <Icon size={17} className="shrink-0" aria-hidden="true" />
                    {module.label}
                  </Link>
                );
              })}
            </nav>
            <footer className="border-t border-border p-3">
              <p className="px-1 text-[11px] text-muted-foreground">
                本地数据 · V3 原型验收
              </p>
            </footer>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
