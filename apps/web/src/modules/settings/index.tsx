"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
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
  createBrowserWorkspaceRepository,
  type WorkspaceRepository,
} from "@/core/persistence";
import { createEmptyWorkspaceStateV2 } from "@/core/workspace-state";
import type { WorkspaceStateV2 } from "@/core/workspace-state";
import { useTheme } from "@/shared/theme/theme-provider";
import type { Motion, Theme } from "@/shared/theme/theme";
import {
  buildWorkspaceExport,
  parseWorkspaceImport,
  type ParsedWorkspaceImport,
} from "./data";

const themeOptions: { value: Theme; label: string; description: string }[] = [
  { value: "day", label: "日间", description: "暖灰白画布与克制蓝色操作" },
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
  spaces: number;
  tasks: number;
  reviews: number;
  updatedAt: string;
};

function summarize(workspace: WorkspaceStateV2): DataSummary {
  return {
    spaces: workspace.learningSpaces.length,
    tasks: workspace.tasks.length,
    reviews: workspace.reviews.length,
    updatedAt: workspace.updatedAt,
  };
}

/** Appearance and local Workspace V2 data controls. */
export function SettingsModule() {
  const { theme, motion, setTheme, setMotion } = useTheme();
  const repositoryRef = useRef<WorkspaceRepository | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState<DataSummary>({
    spaces: 0,
    tasks: 0,
    reviews: 0,
    updatedAt: "",
  });
  const [status, setStatus] = useState("");
  const [pendingImport, setPendingImport] =
    useState<ParsedWorkspaceImport | null>(null);

  useEffect(() => {
    const repository = createBrowserWorkspaceRepository();
    repositoryRef.current = repository;
    setSummary(summarize(repository.loadWorkspace()));
  }, []);

  function repository(): WorkspaceRepository {
    if (!repositoryRef.current) {
      repositoryRef.current = createBrowserWorkspaceRepository();
    }
    return repositoryRef.current;
  }

  function exportData() {
    try {
      const exportedAt = new Date().toISOString();
      const payload = buildWorkspaceExport(
        repository().loadWorkspace(),
        { theme, motion },
        exportedAt,
      );
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "growpilot-backup-" + exportedAt.slice(0, 10) + ".json";
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus("数据已导出。请妥善保存备份文件。");
    } catch {
      setStatus("导出失败：无法读取本地成长数据。");
    }
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    try {
      const parsed = parseWorkspaceImport(
        JSON.parse(await file.text()),
        new Date().toISOString(),
      );
      if (!parsed) throw new Error("invalid workspace export");
      setPendingImport(parsed);
      setStatus("备份文件有效，请确认导入。");

    } catch {
      setStatus("导入失败：请选择 GrowPilot 导出的有效 JSON 文件。");
    }
  }

  function confirmImport() {
    if (!pendingImport) return;
    try {
      repository().saveWorkspace(pendingImport.workspace);
      if (pendingImport.appearance.theme) {
        setTheme(pendingImport.appearance.theme);
      }
      if (pendingImport.appearance.motion) {
        setMotion(pendingImport.appearance.motion);
      }
      setSummary(summarize(pendingImport.workspace));
      setPendingImport(null);
      setStatus("导入成功，当前成长数据已恢复。");
    } catch {
      setStatus("导入失败：本地数据无法写入，请重试。");
    }
  }

  function cancelImport() {
    setPendingImport(null);
    setStatus("已取消导入，当前数据未改变。");
  }

  function clearData() {
    if (
      !window.confirm(
        "确定清空学习空间、计划、任务和复盘吗？此操作无法撤销。",
      )
    ) {
      return;
    }
    const empty = createEmptyWorkspaceStateV2(new Date().toISOString());
    try {
      repository().saveWorkspace(empty);
      setSummary(summarize(empty));
      setPendingImport(null);
      setStatus("成长数据已清空。主题与动效设置仍然保留。");
    } catch {
      setStatus("清空失败：本地数据无法写入，请重试。");
    }
  }

  return (
    <section className="space-y-5">
      <header>
        <span className="text-[10px] font-bold tracking-[0.15em] text-primary">
          SETTINGS
        </span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          设置
        </h1>
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
        <div
          className="segmented-control cols-3 mt-5"
          role="group"
          aria-label="外观主题"
        >
          {themeOptions.map((option) => (
            <button
              aria-pressed={theme === option.value}
              className={
                theme === option.value
                  ? "segmented-option active"
                  : "segmented-option"
              }
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
        <div
          className="segmented-control cols-4 mt-5"
          role="group"
          aria-label="动效偏好"
        >
          {motionOptions.map((option) => (
            <button
              aria-pressed={motion === option.value}
              className={
                motion === option.value
                  ? "segmented-option active"
                  : "segmented-option"
              }
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
            <strong className="block text-xl">{summary.spaces}</strong>
            <span className="text-xs text-muted-foreground">学习空间</span>
          </div>
          <div className="rounded-2xl bg-secondary p-4">
            <strong className="block text-xl">{summary.tasks}</strong>
            <span className="text-xs text-muted-foreground">计划任务</span>
          </div>
          <div className="rounded-2xl bg-secondary p-4">
            <strong className="block text-xl">{summary.reviews}</strong>
            <span className="text-xs text-muted-foreground">复盘记录</span>
          </div>
        </div>

        <div className="settings-actions mt-5">
          <button
            className="secondary-button"
            onClick={exportData}
            type="button"
          >
            <Download size={16} aria-hidden="true" /> 导出数据
          </button>
          <button
            className="secondary-button"
            onClick={() => importRef.current?.click()}
            type="button"
          >
            <Upload size={16} aria-hidden="true" /> 导入数据
          </button>
          <input
            ref={importRef}
            accept="application/json,.json"
            aria-label="选择 GrowPilot 备份文件"
            className="sr-only"
            onChange={importData}
            type="file"
          />
          <button className="danger-button" onClick={clearData} type="button">
            <Trash2 size={16} aria-hidden="true" /> 清空成长数据
          </button>
        </div>

        {pendingImport ? (
          <div className="mt-4 rounded-2xl border border-border bg-secondary p-4">
            <p className="text-sm font-medium">
              准备导入：{pendingImport.summary.spaces} 个学习空间、
              {pendingImport.summary.tasks} 个任务、
              {pendingImport.summary.reviews} 条复盘。
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              确认后会覆盖当前成长数据，主题设置只在备份值有效时更新。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="primary-button"
                onClick={confirmImport}
                type="button"
              >
                确认导入
              </button>
              <button
                className="secondary-button"
                onClick={cancelImport}
                type="button"
              >
                取消
              </button>
            </div>
          </div>
        ) : null}

        <p aria-live="polite" className="mt-4 text-xs text-muted-foreground">
          {status}
        </p>
        {summary.updatedAt ? (
          <p className="mt-2 text-[11px] text-muted-foreground">
            最近数据更新时间：
            {new Date(summary.updatedAt).toLocaleString("zh-CN")}
          </p>
        ) : null}
      </article>

      <article className="calm-surface flex gap-3 rounded-3xl p-5">
        <ShieldCheck
          size={18}
          className="mt-0.5 shrink-0 text-primary"
          aria-hidden="true"
        />
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
