"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Pencil,
  Plus,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import {
  createBrowserWorkspaceRepository,
  type WorkspaceRepository,
} from "@/core/persistence";
import type { Task, TaskPriority, TaskSubtask } from "@/core/tasks";
import type { WorkspaceStateV2 } from "@/core/workspace-state";
import {
  createLearningWorkspaceTask,
  ensureDefaultLearningWorkspace,
  removeUnfinishedLearningTask,
  updateLearningWorkspaceTask,
  type LearningTaskDraft,
} from "./mvp-actions";

type SubtaskDraft = {
  id?: string;
  title: string;
  completed?: boolean;
};

const priorityLabels: Record<TaskPriority, string> = {
  high: "高优先级",
  medium: "中优先级",
  low: "低优先级",
};

function localDateKey(date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function tagsFromText(value: string): string[] {
  return value
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function taskSubtasks(task: Task): SubtaskDraft[] {
  return task.subtasks.map((subtask) => ({ ...subtask }));
}

export function LearningModule() {
  const repositoryRef = useRef<WorkspaceRepository | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceStateV2 | null>(null);
  const [spaceId, setSpaceId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState(localDateKey);
  const [duration, setDuration] = useState("25");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [tags, setTags] = useState("");
  const [subtasks, setSubtasks] = useState<SubtaskDraft[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState("加载本地任务…");

  useEffect(() => {
    try {
      const repository = createBrowserWorkspaceRepository();
      repositoryRef.current = repository;
      const loaded = repository.loadWorkspace();
      const selected = ensureDefaultLearningWorkspace(
        loaded,
        new Date().toISOString(),
      );
      if (selected.workspace !== loaded) {
        repository.saveWorkspace(selected.workspace);
      }
      setWorkspace(selected.workspace);
      setSpaceId(selected.space.id);
      setStatus("");
    } catch {
      setStatus("本地数据加载失败，请刷新后重试。");
    }
  }, []);

  function repository(): WorkspaceRepository {
    if (!repositoryRef.current) {
      repositoryRef.current = createBrowserWorkspaceRepository();
    }
    return repositoryRef.current;
  }

  function persist(next: WorkspaceStateV2, message: string) {
    try {
      repository().saveWorkspace(next);
      setWorkspace(next);
      setStatus(message);
    } catch {
      setStatus("保存失败：本地数据无法写入，请重试。");
    }
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setScheduledDate(localDateKey());
    setDuration("25");
    setPriority("medium");
    setTags("");
    setSubtasks([]);
    setEditingId(null);
  }

  function draftFromForm(): LearningTaskDraft {
    const durationMinutes = Number(duration);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      throw new Error("预计时长必须大于 0 分钟。");
    }
    return {
      title,
      description,
      scheduledDate,
      durationMinutes,
      priority,
      tags: tagsFromText(tags),
      subtasks,
    };
  }

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace) return;
    try {
      const draft = draftFromForm();
      const next = editingId
        ? updateLearningWorkspaceTask(
            workspace,
            editingId,
            draft,
            new Date().toISOString(),
          )
        : createLearningWorkspaceTask(
            workspace,
            draft,
            new Date().toISOString(),
          );
      if (next === workspace) {
        setStatus("当前任务不可编辑。");
        return;
      }
      persist(next, editingId ? "任务已更新。" : "任务已创建并进入执行计划。");
      resetForm();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "任务内容无效，请检查后重试。",
      );
    }
  }

  function editTask(task: Task) {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setScheduledDate(task.scheduledDate);
    setDuration(String(task.durationMinutes));
    setPriority(task.priority);
    setTags(task.tags.join(", "));
    setSubtasks(taskSubtasks(task));
    setStatus("正在编辑任务。");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteTask(task: Task) {
    if (!workspace || !window.confirm("确定删除这个未完成任务吗？")) return;
    const next = removeUnfinishedLearningTask(
      workspace,
      task.id,
      new Date().toISOString(),
    );
    if (next === workspace) {
      setStatus("当前任务不可删除。");
      return;
    }
    persist(next, "任务已删除。");
    if (editingId === task.id) resetForm();
  }

  function addSubtask() {
    setSubtasks((current) => [...current, { title: "" }]);
  }

  function updateSubtask(index: number, title: string) {
    setSubtasks((current) =>
      current.map((subtask, currentIndex) =>
        currentIndex === index ? { ...subtask, title } : subtask,
      ),
    );
  }

  function removeSubtask(index: number) {
    setSubtasks((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  const ownedTasks =
    workspace?.tasks.filter(
      (task) =>
        task.ownerModuleId === "learning" && task.ownerEntityId === spaceId,
    ) ?? [];
  const unfinished = ownedTasks.filter((task) => task.status !== "done");
  const completed = ownedTasks.filter((task) => task.status === "done");

  return (
    <section className="space-y-5">
      <header>
        <span className="eyebrow">LEARNING</span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          我的学习
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          在这里创建和整理任务；执行统一在“今日”，完成后进入复盘。
        </p>
      </header>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">
              {editingId ? "EDIT TASK" : "NEW TASK"}
            </span>
            <h2>{editingId ? "编辑任务" : "创建学习任务"}</h2>
          </div>
          {editingId ? (
            <button
              className="secondary-button"
              onClick={resetForm}
              type="button"
            >
              <X size={15} aria-hidden="true" /> 取消编辑
            </button>
          ) : null}
        </div>

        <form className="mt-5 grid gap-4" onSubmit={submitTask}>
          <label className="field">
            <span>任务标题</span>
            <input
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例如：复习今天的英语语法"
              required
              value={title}
            />
          </label>

          <label className="field">
            <span>任务备注</span>
            <textarea
              maxLength={500}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="可选：记录资料、目标或完成标准"
              rows={2}
              value={description}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="field">
              <span>执行日期</span>
              <input
                onChange={(event) => setScheduledDate(event.target.value)}
                required
                type="date"
                value={scheduledDate}
              />
            </label>
            <label className="field">
              <span>预计时长（分钟）</span>
              <input
                min="5"
                onChange={(event) => setDuration(event.target.value)}
                required
                step="5"
                type="number"
                value={duration}
              />
            </label>
            <label className="field">
              <span>优先级</span>
              <select
                onChange={(event) =>
                  setPriority(event.target.value as TaskPriority)
                }
                value={priority}
              >
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>标签</span>
            <input
              onChange={(event) => setTags(event.target.value)}
              placeholder="最多 3 个，用逗号分隔"
              value={tags}
            />
          </label>

          <div className="rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <strong className="text-sm">子任务</strong>
                <p className="mt-1 text-xs text-muted-foreground">
                  只作为当前任务的一层检查清单。
                </p>
              </div>
              <button
                className="secondary-button"
                onClick={addSubtask}
                type="button"
              >
                <Plus size={15} aria-hidden="true" /> 添加子任务
              </button>
            </div>
            {subtasks.length ? (
              <div className="mt-3 space-y-2">
                {subtasks.map((subtask, index) => (
                  <div className="flex items-center gap-2" key={subtask.id ?? index}>
                    <label className="field min-w-0 flex-1">
                      <span className="sr-only">子任务 {index + 1}</span>
                      <input
                        aria-label={"子任务 " + (index + 1)}
                        onChange={(event) =>
                          updateSubtask(index, event.target.value)
                        }
                        placeholder={"子任务 " + (index + 1)}
                        value={subtask.title}
                      />
                    </label>
                    <button
                      aria-label={"删除子任务 " + (index + 1)}
                      className="icon-button"
                      onClick={() => removeSubtask(index)}
                      type="button"
                    >
                      <X size={15} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <button className="primary-button" type="submit">
            <Plus size={16} aria-hidden="true" />
            {editingId ? "保存修改" : "创建任务"}
          </button>
        </form>
        <p aria-live="polite" className="mt-3 text-xs text-muted-foreground">
          {status}
        </p>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">PLANNED</span>
            <h2>待执行任务</h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {unfinished.length} 项
          </span>
        </div>

        {unfinished.length ? (
          <div className="mt-4 space-y-3">
            {unfinished.map((task) => (
              <TaskCard
                key={task.id}
                onDelete={() => deleteTask(task)}
                onEdit={() => editTask(task)}
                task={task}
              />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            还没有待执行任务。先创建一项今天真正准备完成的学习任务。
          </p>
        )}
      </article>

      <details className="panel">
        <summary className="cursor-pointer text-sm font-semibold">
          已完成任务（{completed.length}）
        </summary>
        {completed.length ? (
          <div className="mt-4 space-y-3">
            {completed.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            完成任务后会保留在这里，并进入对应日期的复盘。
          </p>
        )}
      </details>
    </section>
  );
}

function TaskCard({
  task,
  onEdit,
  onDelete,
}: {
  task: Task;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <article
      aria-label={"任务：" + task.title}
      className="rounded-2xl border border-border bg-card p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <strong className="text-sm">{task.title}</strong>
          {task.description ? (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {task.description}
            </p>
          ) : null}
        </div>
        {onEdit && onDelete ? (
          <div className="flex gap-2">
            <button
              aria-label={"编辑任务：" + task.title}
              className="icon-button"
              onClick={onEdit}
              type="button"
            >
              <Pencil size={15} aria-hidden="true" />
            </button>
            <button
              aria-label={"删除任务：" + task.title}
              className="icon-button"
              onClick={onDelete}
              type="button"
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <CheckCircle2 size={17} className="text-primary" aria-hidden="true" />
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1">
          <CalendarDays size={12} aria-hidden="true" /> {task.scheduledDate}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1">
          <Clock3 size={12} aria-hidden="true" /> {task.durationMinutes} 分钟
        </span>
        <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
          {priorityLabels[task.priority]}
        </span>
        {task.tags.map((tag) => (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1"
            key={tag}
          >
            <Tag size={11} aria-hidden="true" /> {tag}
          </span>
        ))}
      </div>

      {task.subtasks.length ? (
        <ul className="mt-3 list-none space-y-1 text-xs text-muted-foreground">
          {task.subtasks.map((subtask: TaskSubtask) => (
            <li className="flex items-center gap-2" key={subtask.id}>
              <span aria-hidden="true">{subtask.completed ? "✓" : "○"}</span>
              {subtask.title}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
