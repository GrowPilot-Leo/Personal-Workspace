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
 * Read the initial theme from the html attribute set by the FOUC bootstrap
 * script in layout.tsx. Server-render has no document, so it returns the
 * static default — matching the SSR HTML exactly (hydration-safe).
 */
function initialThemeFromDom(): Theme {
  if (typeof document === "undefined") return "day";
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "night" || attr === "dusk" ? attr : "day";
}

function initialMotionFromDom(): Motion {
  if (typeof document === "undefined") return "system";
  const attr = document.documentElement.getAttribute("data-motion");
  return attr === "full" || attr === "reduced" || attr === "off" ? attr : "system";
}

/**
 * ThemeProvider owns theme and motion preference state, persists it through
 * the settings storage keys, and keeps html[data-theme]/data-motion in sync.
 *
 * Hydration-safe strategy:
 * - Initial state reads the html attribute already set by the FOUC bootstrap
 *   script, so server HTML and first client render agree (no mismatch).
 * - Stored preference is loaded in useEffect to keep state authoritative.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initialThemeFromDom);
  const [motion, setMotionState] = useState<Motion>(initialMotionFromDom);

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
