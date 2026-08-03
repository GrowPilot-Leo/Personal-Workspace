export const DAILY_LOOP_STORAGE_KEY = "growpilot.daily-loop.v1";

export type DailyTask = {
  id: string;
  title: string;
  durationMinutes: number;
  completedAt: string | null;
  createdAt: string;
};

export type DailyReview = {
  wins: string;
  blockers: string;
  adjustment: string;
  submittedAt: string;
};

export type DailyArchive = {
  date: string;
  goal: string;
  availableMinutes: number;
  tasks: DailyTask[];
  review: DailyReview | null;
};

export type DailyLoopState = {
  version: 1;
  activeDate: string;
  goal: string;
  availableMinutes: number;
  tasks: DailyTask[];
  review: DailyReview | null;
  history: DailyArchive[];
  updatedAt: string;
};

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function clampMinutes(value: unknown, fallback = 60) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(480, Math.max(10, Math.round(parsed)));
}

function safeText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function validDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function nextDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return todayKey(new Date(year, month - 1, day + 1));
}

export function createEmptyDailyLoopState(date = todayKey()): DailyLoopState {
  return {
    version: 1,
    activeDate: date,
    goal: "",
    availableMinutes: 60,
    tasks: [],
    review: null,
    history: [],
    updatedAt: new Date().toISOString(),
  };
}

export function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeTask(value: unknown): DailyTask | null {
  if (!isRecord(value)) return null;
  const title = safeText(value.title, 120);
  if (!title) return null;
  return {
    id: safeText(value.id, 80) || createId(),
    title,
    durationMinutes: clampMinutes(value.durationMinutes, 25),
    completedAt: typeof value.completedAt === "string" ? value.completedAt : null,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
  };
}

function normalizeReview(value: unknown): DailyReview | null {
  if (!isRecord(value)) return null;
  const wins = safeText(value.wins, 800);
  const blockers = safeText(value.blockers, 800);
  const adjustment = safeText(value.adjustment, 800);
  if (!wins && !blockers && !adjustment) return null;
  return {
    wins,
    blockers,
    adjustment,
    submittedAt:
      typeof value.submittedAt === "string" ? value.submittedAt : new Date().toISOString(),
  };
}

export function normalizeDailyLoopState(value: unknown): DailyLoopState {
  if (!isRecord(value)) return createEmptyDailyLoopState();

  const tasks = Array.isArray(value.tasks)
    ? value.tasks.map(normalizeTask).filter((task): task is DailyTask => Boolean(task)).slice(0, 20)
    : [];

  const history = Array.isArray(value.history)
    ? value.history
        .filter(isRecord)
        .map((entry): DailyArchive => ({
          date: validDateKey(entry.date) ? entry.date : todayKey(),
          goal: safeText(entry.goal, 160),
          availableMinutes: clampMinutes(entry.availableMinutes),
          tasks: Array.isArray(entry.tasks)
            ? entry.tasks
                .map(normalizeTask)
                .filter((task): task is DailyTask => Boolean(task))
                .slice(0, 20)
            : [],
          review: normalizeReview(entry.review),
        }))
        .slice(-30)
    : [];

  return {
    version: 1,
    activeDate: validDateKey(value.activeDate) ? value.activeDate : todayKey(),
    goal: safeText(value.goal, 160),
    availableMinutes: clampMinutes(value.availableMinutes),
    tasks,
    review: normalizeReview(value.review),
    history,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
  };
}

export function loadDailyLoop(storage: StorageLike): DailyLoopState {
  try {
    const raw = storage.getItem(DAILY_LOOP_STORAGE_KEY);
    return raw ? normalizeDailyLoopState(JSON.parse(raw)) : createEmptyDailyLoopState();
  } catch {
    return createEmptyDailyLoopState();
  }
}

export function saveDailyLoop(storage: StorageLike, state: DailyLoopState) {
  storage.setItem(
    DAILY_LOOP_STORAGE_KEY,
    JSON.stringify({ ...state, updatedAt: new Date().toISOString() }),
  );
}

export function plannedMinutes(state: DailyLoopState) {
  return state.tasks.reduce((sum, task) => sum + task.durationMinutes, 0);
}

export function completedTaskCount(state: DailyLoopState) {
  return state.tasks.filter((task) => task.completedAt).length;
}

export function buildNextDaySuggestion(state: DailyLoopState) {
  const incomplete = state.tasks.filter((task) => !task.completedAt);
  if (!state.goal) return "先明确一个阶段目标，再决定明天最值得投入的行动。";
  if (!state.tasks.length) {
    return `围绕“${state.goal}”创建 1～3 个能在 ${state.availableMinutes} 分钟内完成的任务。`;
  }
  if (incomplete.length) {
    return `优先保留 ${incomplete.length} 个未完成任务，并根据复盘缩小任务范围，避免继续堆积。`;
  }
  return "今天的任务已经完成。明天保留同一目标，增加一个需要输出或验证结果的任务。";
}

export function rollDailyLoopForward(state: DailyLoopState): DailyLoopState {
  const archive: DailyArchive = {
    date: state.activeDate,
    goal: state.goal,
    availableMinutes: state.availableMinutes,
    tasks: state.tasks,
    review: state.review,
  };
  const carryOver = state.tasks
    .filter((task) => !task.completedAt)
    .map((task) => ({ ...task, completedAt: null }));

  return {
    ...state,
    activeDate: nextDateKey(state.activeDate),
    tasks: carryOver,
    review: null,
    history: [...state.history, archive].slice(-30),
    updatedAt: new Date().toISOString(),
  };
}
