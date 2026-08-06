export type ThemePreference = "day" | "night" | "dusk";

export type MotionPreference = "full" | "reduced" | "off" | "system";

export type WallpaperPreference = {
  kind: "builtin" | "seasonal" | "upload";
  assetId: string;
  overlayStrength: number;
  blur: number;
  brightness: number;
};

export const THEME_STORAGE_KEY = "growpilot.theme.v1";
export const MOTION_STORAGE_KEY = "growpilot.motion.v1";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "day" || value === "night" || value === "dusk";
}

export function isMotionPreference(value: unknown): value is MotionPreference {
  return value === "full" || value === "reduced" || value === "off" || value === "system";
}

export function readStoredTheme(storage: Pick<Storage, "getItem">): ThemePreference {
  const raw = storage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(raw) ? raw : "day";
}

export function writeStoredTheme(
  storage: Pick<Storage, "setItem">,
  theme: ThemePreference,
) {
  storage.setItem(THEME_STORAGE_KEY, theme);
}

export function readStoredMotion(storage: Pick<Storage, "getItem">): MotionPreference {
  const raw = storage.getItem(MOTION_STORAGE_KEY);
  return isMotionPreference(raw) ? raw : "system";
}

export function writeStoredMotion(
  storage: Pick<Storage, "setItem">,
  motion: MotionPreference,
) {
  storage.setItem(MOTION_STORAGE_KEY, motion);
}
