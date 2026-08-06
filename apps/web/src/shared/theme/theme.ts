export type Theme = "day" | "night" | "dusk";
export type Motion = "full" | "reduced" | "off" | "system";

export const DEFAULT_THEME: Theme = "day";
export const DEFAULT_MOTION: Motion = "system";
export const THEME_STORAGE_KEY = "growpilot.theme.v1";
export const MOTION_STORAGE_KEY = "growpilot.motion.v1";

export function isTheme(value: unknown): value is Theme {
  return value === "day" || value === "night" || value === "dusk";
}

export function isMotion(value: unknown): value is Motion {
  return value === "full" || value === "reduced" || value === "off" || value === "system";
}

export function normalizeTheme(value: unknown, fallback: Theme = DEFAULT_THEME): Theme {
  return isTheme(value) ? value : fallback;
}

export function normalizeMotion(value: unknown, fallback: Motion = DEFAULT_MOTION): Motion {
  return isMotion(value) ? value : fallback;
}
