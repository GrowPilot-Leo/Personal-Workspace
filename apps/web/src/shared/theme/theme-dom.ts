import type { Motion, Theme } from "./theme.ts";

/**
 * Apply theme/motion to the document element. Guards for SSR and test
 * environments without a DOM. Pure helpers kept outside the React provider
 * so rule tests can run them under node.
 */
export function applyThemeToDocument(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

export function applyMotionToDocument(motion: Motion): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-motion", motion);
}
