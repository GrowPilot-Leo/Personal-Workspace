"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  Database,
  Download,
  Palette,
  ShieldCheck,
  Trash2,
  Upload,
  Waves,
} from "lucide-react";
import {
  createEmptyDailyLoopState,
  normalizeDailyLoopState,
  type DailyLoopState,
} from "@/core/daily-loop";
import { createBrowserWorkspaceRepository } from "@/core/persistence";
import { useTheme } from "@/shared/theme/theme-provider";
import {
  isMotion,
  isTheme,
  type Motion,
  type Theme,
} from "@/shared/theme/theme";

const themeOptions: { value: Theme; label: string; description: string }[] = [
  { value: "day", label: "夏日", description: "海水蓝、阳光黄与浅沙色" },
  { value: "night", label: "夜间", description: "低亮度深海工作环境" },
  { value: "dusk", label: "暮色", description: "温暖的海边日落色调" },
];

const motionOptions: { value: Motion; label: string }[] = [
  { value: "system", label: "跟随系统" },
  { value: "full", label: "完整动效" },
  { value: "reduced", label: "精简动效" },
  { value: "off", label: "关闭动效" },
];

type DataSummary = {
  tasks: number;
  archives: number;
  updatedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Real appearance and local-data controls. Provider configuration remains explicitly unavailable. */
export function SettingsModule() {
  const { theme, motion, setTheme, setMotion } = useTheme();
  const [summary, setSummary] = useState<DataSummary>({ tasks: 0, archives: 0, updatedAt: "" });
  const [status, setStatus] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  const refreshSummary = (state?: DailyLoopState) => {
    const current = state ?? createBrowserWorkspaceRepository().loadDailyLoop();
    setSummary({
      tasks: current.tasks.length,
      archives: current.history.length,
      updatedAt: current.updatedAt,
    });
  };

  useEffect(() => {
    refreshSummary();
  }, []);

  const exportData = () => {
    const dailyLoop = createBrowserWorkspaceRepository().loadDailyLoop();
    const payload = {
      schema: "growpilot.workspace.export",
      version: 1,
      exportedAt: new Date().toISOString(),
      appearance: { theme, motion },
      dailyLoop,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `growpilot-backup-${dailyLoop.activeDate}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("数据已导出。请妥善保存备份文件。");
  };

  const importData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isRecord(parsed)) throw new Error("invalid payload");
      const candidate = "dailyLoop" in parsed ? parsed.dailyLoop : parsed;
      if (!isRecord(candidate) || candidate.version !== 1) {
        throw new Error("unsupported data version");
      }
      const next = normalizeDailyLoopState(candidate);
      if (!window.confirm("导入会覆盖当前成长数据，是否继续？")) return;

      createBrowserWorkspaceRepository().saveDailyLoop(next);
      const appearance = isRecord(parsed.appearance) ? parsed.appearance : null;
      if (appearance && isTheme(appearance.theme)) setTheme(appearance.theme);
      if (appearance && isMotion(appearance.motion)) setMotion(appearance.motion);
      refreshSummary(next);
      setStatus("导入成功，当前任务和历史记录已恢复。");
    } catch {
      setStatus("导入失败：请选择 GrowPilot 导出的有效 JSON 文件。");
    }
  };

  const clearData = () => {
    if (!window.confirm("确定清空目标、任务、复盘和历史记录吗？此操作无法撤销。")) return;
    const empty = createEmptyDailyLoopState();
    createBrowserWorkspaceRepository().saveDailyLoop(empty);
    refreshSummary(empty);
    setStatus("成长数据已清空。主题与动效设置仍然保留。");
  };

  return (
    <section className="space-y-5">
      <header>
        <span className="text-[10px] font-bold tracking-[0.15em] text-primary">SETTINGS</span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">设置</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          外观设置立即生效；成长数据目前只保存在这个浏览器中，请定期导出备份。
        </p>
      </header>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">APPEARANCE</span>
            <h2>主题</h2>
          </div>
          <Palette size={18} className="text-primary" aria-hidden="true" />
        </div>
        <div className="segmented-control cols-3 mt-5" role="group" aria-label="外观主题">
          {themeOptions.map((option) => (
            <button
              aria-pressed={theme === option.value}
              className={theme === option.value ? "segmented-option active" : "segmented-option"}
              key={option.value}
              onClick={() => setTheme(option.value)}
              title={option.description}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {themeOptions.find((option) => option.value === theme)?.description}
        </p>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">MOTION</span>
            <h2>交互动效</h2>
          </div>
          <Waves size={18} className="text-primary" aria-hidden="true" />
        </div>
        <div className="segmented-control cols-4 mt-5" role="group" aria-label="动效偏好">
          {motionOptions.map((option) => (
            <button
              aria-pressed={motion === option.value}
              className={motion === option.value ? "segmented-option active" : "segmented-option"}
              key={option.value}
              onClick={() => setMotion(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          完整动效使用短位移和低弹跳；跟随系统会自动尊重设备的“减少动态效果”设置。
        </p>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">LOCAL DATA</span>
            <h2>数据与备份</h2>
          </div>
          <Database size={18} className="text-primary" aria-hidden="true" />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-secondary p-4">
            <strong className="block text-xl">{summary.tasks}</strong>
            <span className="text-xs text-muted-foreground">当前任务</span>
          </div>
          <div className="rounded-2xl bg-secondary p-4">
            <strong className="block text-xl">{summary.archives}</strong>
            <span className="text-xs text-muted-foreground">历史归档</span>
          </div>
          <div className="rounded-2xl bg-secondary p-4">
            <strong className="block text-sm">仅此设备</strong>
            <span className="text-xs text-muted-foreground">未启用云同步</span>
          </div>
        </div>

        <div className="settings-actions mt-5">
          <button className="secondary-button" onClick={exportData} type="button">
            <Download size={16} aria-hidden="true" /> 导出数据
          </button>
          <button className="secondary-button" onClick={() => importRef.current?.click()} type="button">
            <Upload size={16} aria-hidden="true" /> 导入数据
          </button>
          <input
            ref={importRef}
            accept="application/json,.json"
            className="sr-only"
            onChange={importData}
            type="file"
          />
          <button className="danger-button" onClick={clearData} type="button">
            <Trash2 size={16} aria-hidden="true" /> 清空成长数据
          </button>
        </div>
        <p aria-live="polite" className="mt-4 text-xs text-muted-foreground">{status}</p>
        {summary.updatedAt ? (
          <p className="mt-2 text-[11px] text-muted-foreground">
            最近数据更新时间：{new Date(summary.updatedAt).toLocaleString("zh-CN")}
          </p>
        ) : null}
      </article>

      <article className="summer-glass-card flex gap-3 rounded-3xl p-5">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold">隐私边界</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            当前版本没有登录和云同步。AI Provider 尚未接入，因此也不会在这里收集或保存模型密钥。
          </p>
        </div>
      </article>
    </section>
  );
}
