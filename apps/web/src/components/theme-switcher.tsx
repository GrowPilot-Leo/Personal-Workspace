"use client";

import { useTheme } from "@/shared/theme/theme-provider";
import type { Theme } from "@/shared/theme/theme";

const options: { value: Theme; label: string }[] = [
  { value: "day", label: "日间" },
  { value: "night", label: "夜间" },
  { value: "dusk", label: "暮色" },
];

/**
 * Segmented control for Day/Night/Dusk. Persists via useTheme().setTheme,
 * which also updates html[data-theme] so CSS tokens re-resolve instantly.
 */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="theme-switcher" role="group" aria-label="主题切换">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={theme === option.value ? "theme-option active" : "theme-option"}
          aria-pressed={theme === option.value}
          onClick={() => setTheme(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
