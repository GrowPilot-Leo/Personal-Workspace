"use client";

import {
  createContext,
  useCallback,
  useContext,
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
 * The FOUC-prevention bootstrap script in layout.tsx sets the initial
 * attributes before React hydrates; this provider then takes over.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() =>
    loadTheme(window.localStorage),
  );
  const [motion, setMotionState] = useState<Motion>(() =>
    loadMotion(window.localStorage),
  );

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
