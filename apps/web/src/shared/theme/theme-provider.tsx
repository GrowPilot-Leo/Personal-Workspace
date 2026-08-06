"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  loadMotion,
  loadTheme,
  saveMotion,
  saveTheme,
} from "./theme-storage.ts";
import type { Motion, Theme } from "./theme.ts";
import { applyMotionToDocument, applyThemeToDocument } from "./theme-dom.ts";

type ThemeContextValue = {
  theme: Theme;
  motion: Motion;
  setTheme: (theme: Theme) => void;
  setMotion: (motion: Motion) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * ThemeProvider owns theme and motion preference state, persists it through
 * the settings storage keys, and keeps html[data-theme]/data-motion in sync.
 *
 * Hydration-safe strategy (fixes the "theme-option active" mismatch):
 * - Initial state is the STATIC default ("day"/"system"), which exactly
 *   matches the server-rendered HTML. React hydration therefore always
 *   agrees — no mismatch, no abandoned tree, no dead buttons.
 * - The FOUC bootstrap script in layout.tsx already set html[data-theme]
 *   from localStorage before hydration, so the visual theme is correct on
 *   first paint with no flash.
 * - The real stored preference is loaded in useEffect and applied to both
 *   React state and the DOM attribute (authoritative, idempotent).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("day");
  const [motion, setMotionState] = useState<Motion>("system");

  useEffect(() => {
    const storedTheme = loadTheme(window.localStorage);
    const storedMotion = loadMotion(window.localStorage);
    setThemeState(storedTheme);
    setMotionState(storedMotion);
    applyThemeToDocument(storedTheme);
    applyMotionToDocument(storedMotion);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyThemeToDocument(next);
    saveTheme(window.localStorage, next);
  }, []);

  const setMotion = useCallback((next: Motion) => {
    setMotionState(next);
    applyMotionToDocument(next);
    saveMotion(window.localStorage, next);
  }, []);

  const value = useMemo(
    () => ({ theme, motion, setTheme, setMotion }),
    [theme, motion, setTheme, setMotion],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
