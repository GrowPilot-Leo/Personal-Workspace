import { readFile } from "node:fs/promises";
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const DAILY_LOOP_KEY = "growpilot.daily-loop.v1";
const WORKSPACE_V2_KEY = "growpilot.workspace.v2";

const emptyDailyLoop = JSON.stringify({
  version: 1,
  activeDate: "2026-08-10",
  goal: "",
  availableMinutes: 60,
  tasks: [],
  review: null,
  history: [],
  updatedAt: "2026-08-10T00:00:00.000Z",
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: DAILY_LOOP_KEY, value: emptyDailyLoop },
  );
});

async function createLearningSpace(
  page: Page,
  name: string,
  goal = "",
) {
  await page.getByRole("button", { name: "新建学习空间" }).click();
  const dialog = page.getByRole("dialog", { name: "新建学习空间" });
  await dialog.getByRole("radio", { name: "三层计划模板" }).check();
  await dialog.getByLabel("空间名称").fill(name);
  await dialog.getByLabel("学习目标").fill(goal);
  await dialog.getByRole("button", { name: "创建学习空间" }).click();
}

test("learning MVP creates a direct enriched task", async ({ page }) => {
  await page.goto("/learning");
  await expect(page.getByRole("heading", { name: "我的学习" })).toBeVisible();
  await expect(page.getByRole("button", { name: "新建学习空间" })).toHaveCount(0);

  await page.getByLabel("任务标题").fill("复习语法");
  await page.getByLabel("任务备注").fill("整理错题");
  await page.getByLabel("优先级").selectOption("high");
  await page.getByLabel("标签").fill("英语, 语法, 英语");
  await page.getByRole("button", { name: "添加子任务" }).click();
  await page.getByRole("textbox", { name: "子任务 1", exact: true }).fill("整理例句");
  await page.getByRole("button", { name: "创建任务" }).click();

  const card = page.getByRole("article", { name: "任务：复习语法" });
  await expect(card).toContainText("高优先级");
  await expect(card).toContainText("英语");
  await expect(card).toContainText("语法");
  await expect(card).toContainText("整理例句");

  const stored = await page.evaluate((key) => {
    const workspace = JSON.parse(window.localStorage.getItem(key)!);
    return {
      spaces: workspace.learningSpaces.length,
      task: workspace.tasks[0],
      scheduledEvents: workspace.events.filter(
        (event: { eventType: string }) =>
          event.eventType === "learning.task.scheduled",
      ).length,
    };
  }, WORKSPACE_V2_KEY);
  expect(stored.spaces).toBe(1);
  expect(stored.task).toMatchObject({
    title: "复习语法",
    description: "整理错题",
    priority: "high",
    tags: ["英语", "语法"],
    subtasks: [{ title: "整理例句", completed: false }],
  });
  expect(stored.scheduledEvents).toBe(1);
});

test("core routes load without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  for (const route of ["/dashboard", "/today", "/learning", "/review", "/settings"]) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
  }

  expect(errors).toEqual([]);
});

test("390px mobile shell keeps content in the viewport and prioritizes daily-loop tabs", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/today");

  await expect(page.getByRole("heading", { name: "今日行动" })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);

  const mobileNav = page.getByRole("navigation", { name: "移动端主导航" });
  for (const label of ["今日", "学习", "复盘", "知识"]) {
    await expect(mobileNav.getByRole("link", { name: label, exact: true })).toBeVisible();
  }
  await expect(mobileNav.getByRole("link", { name: "设置", exact: true })).toHaveCount(0);
  await expect(mobileNav.getByRole("link", { name: "职业", exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "打开模块导航" }).click();
  const drawer = page.getByRole("dialog", { name: "模块导航" });
  await expect(drawer).toBeVisible();
  for (const label of ["职业成长", "英语进阶", "健身训练", "徽章", "设置"]) {
    await expect(drawer.getByRole("link", { name: label, exact: true })).toBeVisible();
  }
  for (const label of ["今日", "学习中心", "复盘中心", "知识库"]) {
    await expect(drawer.getByRole("link", { name: label, exact: true })).toHaveCount(0);
  }
});

test("desktop sidebar and mobile bottom navigation are mutually exclusive", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/learning");
  await expect(page.getByLabel("主导航", { exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "移动端主导航" })).toBeHidden();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel("主导航", { exact: true })).toBeHidden();
  await expect(page.getByRole("navigation", { name: "移动端主导航" })).toBeVisible();
});

test("calm day theme is the default and themes persist on refresh", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/today");

  await page.getByRole("button", { name: "日间" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
  await expect(page.locator(".calm-shell")).toBeVisible();

  for (const [label, value] of [
    ["夜间", "night"],
    ["暮色", "dusk"],
    ["日间", "day"],
  ] as const) {
    await page.getByRole("button", { name: label }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", value);
    await expect(page.getByRole("heading", { name: "今日行动" })).toBeVisible();
  }

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
});

test("configurable learning space is created and persists on reload", async ({ page }) => {
  const context = page.context();
  await page.close();
  const learningPage = await context.newPage();
  const goal = "建立一套可复用的 AI 产品评测方法";

  await learningPage.goto("/learning");
  await learningPage.getByRole("button", { name: "新建学习空间" }).click();

  const dialog = learningPage.getByRole("dialog", { name: "新建学习空间" });
  await dialog.getByRole("radio", { name: "三层计划模板" }).check();
  await dialog.getByLabel("空间名称").fill("AI 产品评测");
  await dialog.getByLabel("学习目标").fill(goal);
  await dialog.getByRole("button", { name: "创建学习空间" }).click();

  await expect(learningPage).toHaveURL(/\/learning$/);
  await expect(learningPage.getByRole("button", { name: "AI 产品评测" })).toBeVisible();
  await expect(learningPage.getByRole("heading", { name: "AI 产品评测" })).toBeVisible();
  await expect(learningPage.getByText(goal, { exact: true })).toBeVisible();

  await learningPage.reload();

  await expect(learningPage).toHaveURL(/\/learning$/);
  await expect(learningPage.getByRole("button", { name: "AI 产品评测" })).toBeVisible();
  await expect(learningPage.getByRole("heading", { name: "AI 产品评测" })).toBeVisible();
  await expect(learningPage.getByText(goal, { exact: true })).toBeVisible();
});

test("configurable learning space plans tasks and enforces lifecycle", async ({ page }) => {
  await page.goto("/learning");
  await createLearningSpace(page, "AI 产品评测", "建立可复用的评测方法");

  await page.getByLabel("月度目标").fill("完成评测框架");
  await page.getByRole("button", { name: "保存月度目标" }).click();
  await page.getByLabel("本周目标").fill("验证三种评测方法");
  await page.getByRole("button", { name: "保存本周目标" }).click();
  await page.getByRole("button", { name: "开始学习" }).click();

  const scheduledDate = await page.evaluate(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  await page.getByLabel("任务标题").fill("整理评测维度");
  await page.getByLabel("预计分钟").fill("45");
  await expect(page.getByLabel("计划日期")).toHaveValue(scheduledDate);
  await page.getByRole("button", { name: "添加每日任务" }).click();
  await expect(page.getByText("整理评测维度", { exact: true })).toBeVisible();

  const stored = await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, WORKSPACE_V2_KEY);
  const space = stored.learningSpaces.find(
    (candidate: { name: string }) => candidate.name === "AI 产品评测",
  );
  const ownedPlans = stored.plans.filter(
    (plan: { ownerEntityId: string }) => plan.ownerEntityId === space.id,
  );
  const monthly = ownedPlans.find(
    (plan: { horizon: string }) => plan.horizon === "monthly",
  );
  const weekly = ownedPlans.find(
    (plan: { horizon: string }) => plan.horizon === "weekly",
  );
  const daily = ownedPlans.find(
    (plan: { horizon: string }) => plan.horizon === "daily",
  );
  const task = stored.tasks.find(
    (candidate: { title: string }) => candidate.title === "整理评测维度",
  );

  expect(space.status).toBe("active");
  expect(monthly.versions.at(-1).reason).toBe("user-edit");
  expect(monthly.versions.at(-1).data.goal).toBe("完成评测框架");
  expect(weekly.versions.at(-1).reason).toBe("user-edit");
  expect(weekly.versions.at(-1).data.goal).toBe("验证三种评测方法");
  expect(task).toMatchObject({
    ownerModuleId: "learning",
    ownerEntityId: space.id,
    durationMinutes: 45,
    scheduledDate,
  });
  expect(daily.versions.at(-1).data.taskIds).toContain(task.id);

  await page.getByRole("button", { name: "暂停空间" }).click();
  await expect(page.getByRole("button", { name: "添加每日任务" })).toBeDisabled();
  await page.getByRole("button", { name: "继续学习" }).click();
  await expect(page.getByRole("button", { name: "暂停空间" })).toBeVisible();

  await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return;
    const workspace = JSON.parse(raw);
    const space = workspace.learningSpaces.find(
      (candidate: { name: string }) => candidate.name === "AI 产品评测",
    );
    space.status = "planned";
    window.localStorage.setItem(key, JSON.stringify(workspace));
  }, WORKSPACE_V2_KEY);
  await page.reload();
  await page.getByRole("button", { name: "AI 产品评测" }).click();
  await page.getByRole("button", { name: "暂停空间" }).click();
  await expect(page.getByRole("button", { name: "添加每日任务" })).toBeDisabled();
  await page.getByRole("button", { name: "继续学习" }).click();
  await page.getByRole("button", { name: "归档空间" }).click();

  await expect(page.getByText("已归档", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "保存月度目标" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "添加每日任务" })).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: "AI 产品评测" }).click();
  await expect(page.getByText("已归档", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("整理评测维度", { exact: true })).toBeVisible();
});

test("configurable learning space exports and deletes only the confirmed bundle", async ({ page }) => {
  await page.goto("/learning");
  await createLearningSpace(page, "RAG Lab", "验证检索质量");
  await createLearningSpace(page, "Keep Space", "保留的数据");
  await page.getByRole("button", { name: "RAG Lab" }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出空间" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /^growpilot-learning-rag-lab-\d{4}-\d{2}-\d{2}\.json$/,
  );
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const exported = JSON.parse(await readFile(downloadPath!, "utf8"));
  expect(exported.space.name).toBe("RAG Lab");
  expect(exported.plans).toHaveLength(3);
  expect(exported.plans.every(
    (plan: { ownerEntityId: string }) => plan.ownerEntityId === exported.space.id,
  )).toBe(true);

  await page.getByRole("button", { name: "删除空间" }).click();
  const dialog = page.getByRole("dialog", { name: "删除学习空间" });
  await expect(dialog.getByRole("button", { name: "先导出" })).toBeVisible();
  const confirmDelete = dialog.getByRole("button", { name: "确认删除" });
  await expect(confirmDelete).toBeDisabled();
  await dialog.getByLabel("输入空间名称以确认").fill("rag lab");
  await expect(confirmDelete).toBeDisabled();
  await dialog.getByLabel("输入空间名称以确认").fill("RAG Lab");
  await expect(confirmDelete).toBeEnabled();
  await confirmDelete.click();

  await expect(page.getByRole("button", { name: "RAG Lab" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Keep Space" })).toBeVisible();
  const remaining = await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, WORKSPACE_V2_KEY);
  const remainingNames = remaining.learningSpaces.map(
    (candidate: { name: string }) => candidate.name,
  );
  const keptSpace = remaining.learningSpaces.find(
    (candidate: { name: string }) => candidate.name === "Keep Space",
  );
  expect(remainingNames).toContain("Keep Space");
  expect(remainingNames).not.toContain("RAG Lab");
  expect(remaining.plans.some(
    (plan: { ownerEntityId: string }) => plan.ownerEntityId === exported.space.id,
  )).toBe(false);
  expect(remaining.plans.filter(
    (plan: { ownerEntityId: string }) => plan.ownerEntityId === keptSpace.id,
  )).toHaveLength(3);
});

test("source-tagged learning task round trips through Today", async ({ page }) => {
  const spaceName = "AI 产品评测";
  const taskTitle = "整理评测维度";

  await page.goto("/learning");
  await createLearningSpace(page, spaceName, "建立可复用的评测方法");
  await page.getByRole("button", { name: "开始学习" }).click();
  await page.getByLabel("任务标题").fill(taskTitle);
  await page.getByLabel("预计分钟").fill("45");
  await page.getByRole("button", { name: "添加每日任务" }).click();

  await page.goto("/today");
  const taskItem = page.getByRole("listitem").filter({ hasText: taskTitle });
  await expect(taskItem).toContainText(spaceName);
  await page.getByRole("button", { name: `开始任务：${taskTitle}` }).click();
  await expect(page.locator('[aria-live="polite"]')).toContainText(
    `已开始：${taskTitle}`,
  );
  await page.getByRole("button", { name: `完成任务：${taskTitle}` }).click();
  await expect(
    page.getByRole("button", { name: `撤销完成：${taskTitle}` }),
  ).toBeVisible();

  await page.goto("/learning");
  await page.getByRole("button", { name: spaceName }).click();
  const learningTask = page.getByRole("listitem").filter({ hasText: taskTitle });
  await expect(learningTask).toContainText("已完成");

  const storedTask = await page.evaluate(
    ({ key, title }) => {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      const workspace = JSON.parse(raw);
      return workspace.tasks.find(
        (task: { title: string }) => task.title === title,
      );
    },
    { key: WORKSPACE_V2_KEY, title: taskTitle },
  );
  expect(storedTask).toMatchObject({ status: "done" });
  expect(storedTask.completedAt).toEqual(expect.any(String));
});

test("review saves Workspace V2 and rolls only eligible Learning tasks forward", async ({
  page,
}) => {
  const activeTitle = "结转任务";
  const pausedTitle = "暂停任务";

  await page.goto("/learning");
  await createLearningSpace(page, "Active Loop", "验证结转");
  await page.getByRole("button", { name: "开始学习" }).click();
  await page.getByLabel("任务标题").fill(activeTitle);
  await page.getByRole("button", { name: "添加每日任务" }).click();

  await createLearningSpace(page, "Paused Loop", "保持暂停");
  await page.getByRole("button", { name: "开始学习" }).click();
  await page.getByLabel("任务标题").fill(pausedTitle);
  await page.getByRole("button", { name: "添加每日任务" }).click();
  await page.getByRole("button", { name: "暂停空间" }).click();

  const before = await page.evaluate(
    ({ key, activeTitle, pausedTitle }) => {
      const workspace = JSON.parse(window.localStorage.getItem(key)!);
      const taskByTitle = (title: string) =>
        workspace.tasks.find((task: { title: string }) => task.title === title);
      return {
        activeTask: taskByTitle(activeTitle),
        pausedTask: taskByTitle(pausedTitle),
        plans: JSON.stringify(workspace.plans),
      };
    },
    { key: WORKSPACE_V2_KEY, activeTitle, pausedTitle },
  );

  await page.goto("/review");
  await page.getByLabel("今天完成了什么、学会了什么？").fill("完成了结转验证");
  await page.getByLabel("哪里卡住了？").fill("暂无");
  await page.getByLabel("下一次准备怎么调整？").fill("保持单任务推进");
  await page.getByRole("button", { name: "保存今日复盘" }).click();

  await expect(page.getByText("复盘已保存")).toBeVisible();
  const rollover = page.getByRole("button", { name: "归档并开始下一天" });
  await expect(rollover).toBeEnabled();
  await rollover.click();
  await expect(page.locator('[aria-live="polite"]')).toContainText(
    "今日已归档，未完成任务已结转到下一天。",
  );

  const after = await page.evaluate(
    ({ key, activeTitle, pausedTitle }) => {
      const workspace = JSON.parse(window.localStorage.getItem(key)!);
      const now = new Date();
      const dateKey = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return year + "-" + month + "-" + day;
      };
      const nextDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      );
      const taskByTitle = (title: string) =>
        workspace.tasks.find((task: { title: string }) => task.title === title);
      return {
        fromDate: dateKey(now),
        toDate: dateKey(nextDate),
        activeTask: taskByTitle(activeTitle),
        pausedTask: taskByTitle(pausedTitle),
        plans: JSON.stringify(workspace.plans),
        reviews: workspace.reviews.filter(
          (review: {
            ownerModuleId: string;
            ownerEntityId: string | null;
            horizon: string;
            periodKey: string;
          }) =>
            review.ownerModuleId === "workspace" &&
            review.ownerEntityId === null &&
            review.horizon === "daily" &&
            review.periodKey === dateKey(now),
        ),
      };
    },
    { key: WORKSPACE_V2_KEY, activeTitle, pausedTitle },
  );

  expect(after.reviews).toHaveLength(1);
  expect(after.reviews[0]).toMatchObject({
    wins: "完成了结转验证",
    blockers: "暂无",
    adjustment: "保持单任务推进",
  });
  expect(after.activeTask).toMatchObject({
    id: before.activeTask.id,
    scheduledDate: after.toDate,
    status: "planned",
  });
  expect(after.pausedTask).toMatchObject({
    id: before.pausedTask.id,
    scheduledDate: after.fromDate,
  });
  expect(after.plans).toBe(before.plans);
});
test("workspace data export, import, and clear preserve local boundaries", async ({
  page,
}) => {
  await page.goto("/learning");
  await createLearningSpace(page, "Backup Space", "验证本地备份");
  await page.getByRole("button", { name: "开始学习" }).click();
  await page.getByLabel("任务标题").fill("备份任务");
  await page.getByRole("button", { name: "添加每日任务" }).click();

  await page.goto("/review");
  await page.getByLabel("今天完成了什么、学会了什么？").fill("记录备份证据");
  await page.getByRole("button", { name: "保存今日复盘" }).click();
  await expect(page.getByText("复盘已保存")).toBeVisible();

  await page.goto("/settings");
  const main = page.locator("main");
  await main.getByRole("button", { name: "暮色", exact: true }).click();
  await main.getByRole("button", { name: "精简动效", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dusk");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");

  const beforeState = await page.evaluate((key) => {
    window.localStorage.setItem(
      "growpilot.daily-loop.v1.backup",
      "legacy-backup",
    );
    window.localStorage.setItem(
      "growpilot.workspace.v2.corrupt.backup",
      "corrupt-backup",
    );
    return {
      workspace: window.localStorage.getItem(key),
      migration: window.localStorage.getItem("growpilot.migrations.v1"),
    };
  }, WORKSPACE_V2_KEY);

  const downloadPromise = page.waitForEvent("download");
  await main.getByRole("button", { name: "导出数据" }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const exportedText = await readFile(downloadPath!, "utf8");
  const exported = JSON.parse(exportedText);
  expect(exported).toMatchObject({
    schema: "growpilot.workspace.export",
    version: 2,
    appearance: { theme: "dusk", motion: "reduced" },
  });
  expect(exported.workspace.learningSpaces).toHaveLength(2);
  expect(exported.workspace.tasks).toHaveLength(1);
  expect(exported.workspace.reviews).toHaveLength(1);

  const importInput = main.getByLabel("选择 GrowPilot 备份文件");
  await importInput.setInputFiles({
    name: "invalid-workspace.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        ...exported,
        workspace: { ...exported.workspace, events: null },
      }),
    ),
  });
  await expect(
    page.getByText("导入失败：请选择 GrowPilot 导出的有效 JSON 文件。"),
  ).toBeVisible();
  expect(
    await page.evaluate((key) => window.localStorage.getItem(key), WORKSPACE_V2_KEY),
  ).toBe(beforeState.workspace);

  page.once("dialog", (dialog) => dialog.accept());
  await main.getByRole("button", { name: "清空成长数据" }).click();
  await expect(page.getByText("成长数据已清空。主题与动效设置仍然保留。")).toBeVisible();

  const cleared = await page.evaluate((key) => {
    const workspace = JSON.parse(window.localStorage.getItem(key)!);
    return {
      lengths: [
        workspace.learningSpaces.length,
        workspace.plans.length,
        workspace.tasks.length,
        workspace.reviews.length,
        workspace.events.length,
      ],
      theme: window.localStorage.getItem("growpilot.theme.v1"),
      motion: window.localStorage.getItem("growpilot.motion.v1"),
      migration: window.localStorage.getItem("growpilot.migrations.v1"),
      legacyBackup: window.localStorage.getItem(
        "growpilot.daily-loop.v1.backup",
      ),
      corruptBackup: window.localStorage.getItem(
        "growpilot.workspace.v2.corrupt.backup",
      ),
    };
  }, WORKSPACE_V2_KEY);
  expect(cleared).toEqual({
    lengths: [0, 0, 0, 0, 0],
    theme: "dusk",
    motion: "reduced",
    migration: beforeState.migration,
    legacyBackup: "legacy-backup",
    corruptBackup: "corrupt-backup",
  });

  await importInput.setInputFiles({
    name: "workspace-v2.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        ...exported,
        appearance: { theme: "day", motion: "off" },
      }),
    ),
  });
  await expect(
    page.getByText("准备导入：2 个学习空间、1 个任务、1 条复盘。"),
  ).toBeVisible();
  await page.getByRole("button", { name: "确认导入" }).click();
  await expect(
    page.getByText("导入成功，当前成长数据已恢复。"),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");

  const restored = await page.evaluate((key) => {
    const workspace = JSON.parse(window.localStorage.getItem(key)!);
    return {
      spaces: workspace.learningSpaces.length,
      tasks: workspace.tasks.length,
      reviews: workspace.reviews.length,
    };
  }, WORKSPACE_V2_KEY);
  expect(restored).toEqual({ spaces: 2, tasks: 1, reviews: 1 });
  for (const label of ["学习空间", "计划任务", "复盘记录"]) {
    await expect(main.getByText(label, { exact: true })).toBeVisible();
  }
});
test("rule-generated copy is labelled as an action suggestion", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText("行动建议")).toBeVisible();
  await expect(page.getByText("规则建议，不会自动修改计划")).toBeVisible();
});

test("quick prompt reports copy failure instead of swallowing the error", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => { throw new Error("permission denied"); } },
    });
  });
  await page.goto("/dashboard");

  await page.getByRole("button", { name: /复盘今日/ }).click();
  await expect(page.getByRole("button", { name: "复盘今日，点击复制到剪贴板" })).toContainText("复制失败");
  await expect(page.locator('[aria-live="polite"]')).toContainText("复制失败");
});

test("critical and serious axe violations are absent on core daily-loop pages", async ({ page }) => {
  for (const route of ["/today", "/review", "/settings"]) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter((violation) =>
      violation.impact === "critical" || violation.impact === "serious",
    );
    expect(blocking, route).toEqual([]);
  }
});
