import {
  isMotion,
  isTheme,
  MOTION_STORAGE_KEY,
  THEME_STORAGE_KEY,
  type Motion,
  type Theme,
} from "./theme.ts";

export type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function loadTheme(storage: StorageLike): Theme {
  const raw = storage.getItem(THEME_STORAGE_KEY);
  return isTheme(raw) ? raw : "day";
}

export function saveTheme(storage: StorageLike, theme: Theme): void {
  storage.setItem(THEME_STORAGE_KEY, theme);
}

export function loadMotion(storage: StorageLike): Motion {
  const raw = storage.getItem(MOTION_STORAGE_KEY);
  return isMotion(raw) ? raw : "system";
}

export function saveMotion(storage: StorageLike, motion: Motion): void {
  storage.setItem(MOTION_STORAGE_KEY, motion);
}

/**
 * SSR-safe loaders: useState initializers run during server pre-render where
 * window.localStorage is undefined. These return defaults instead of throwing.
 */
export function safeLoadTheme(): Theme {
  if (typeof window === "undefined" || !window.localStorage) return "day";
  return loadTheme(window.localStorage);
}

export function safeLoadMotion(): Motion {
  if (typeof window === "undefined" || !window.localStorage) return "system";
  return loadMotion(window.localStorage);
}
