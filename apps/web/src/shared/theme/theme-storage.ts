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
