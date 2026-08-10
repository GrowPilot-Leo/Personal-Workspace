"use client";

import { useTheme } from "@/shared/theme/theme-provider";
import type { Theme } from "@/shared/theme/theme";

const options: { value: Theme; label: string; hint: string }[] = [
  { value: "day", label: "日间", hint: "暖灰白工作环境" },
  { value: "night", label: "夜间", hint: "低亮度专注环境" },
  { value: "dusk", label: "暮色", hint: "温暖低饱和环境" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="theme-switcher" role="group" aria-label="主题切换">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={theme === option.value ? "theme-option active" : "theme-option"}
          aria-label={option.label}
          aria-pressed={theme === option.value}
          title={option.hint}
          onClick={() => setTheme(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
