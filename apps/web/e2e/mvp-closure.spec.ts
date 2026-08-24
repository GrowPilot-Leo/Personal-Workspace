import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

const WORKSPACE_V2_KEY = "growpilot.workspace.v2";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (window.sessionStorage.getItem("growpilot.mvp-test-cleared")) return;
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith("growpilot.")) window.localStorage.removeItem(key);
    }
    window.sessionStorage.setItem("growpilot.mvp-test-cleared", "1");
  });
});

async function createTask(
  page: Page,
  input: {
    title: string;
    priority?: "high" | "medium" | "low";
    tags?: string;
    subtasks?: string[];
  },
) {
  await page.getByLabel("任务标题").fill(input.title);
  if (input.priority) {
    await page.getByLabel("优先级").selectOption(input.priority);
  }
  if (input.tags) {
    await page.getByLabel("标签").fill(input.tags);
  }
  for (const [index, title] of (input.subtasks ?? []).entries()) {
    await page.getByRole("button", { name: "添加子任务" }).click();
    await page
      .getByRole("textbox", { name: "子任务 " + (index + 1), exact: true })
      .fill(title);
  }
  await page.getByRole("button", { name: "创建任务" }).click();
}

test("desktop and mobile complete the local Learning Today Review backup loop", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page).toHaveURL(/\/today$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/today$/);

  const sidebar = page.getByLabel("主导航", { exact: true });
  for (const label of ["今日", "学习中心", "复盘中心", "设置"]) {
    await expect(
      sidebar.getByRole("link", { name: label, exact: true }),
    ).toBeVisible();
  }
  for (const label of ["职业成长", "英语进阶", "健身训练", "知识库", "徽章"]) {
    await expect(
      sidebar.getByRole("link", { name: label, exact: true }),
    ).toHaveCount(0);
  }

  await page.goto("/learning");
  await expect(page.getByRole("heading", { name: "我的学习" })).toBeVisible();
  await createTask(page, {
    title: "完成最小闭环",
    priority: "high",
    tags: "MVP, 闭环",
    subtasks: ["验证执行", "记录结果"],
  });
  await createTask(page, { title: "顺延任务", priority: "medium" });

  await page.goto("/today");
  const timeline = page.getByRole("list", { name: "今日时间线" });
  await expect(timeline).toContainText("高优先级");
  await expect(timeline).toContainText("MVP");
  await page.getByRole("button", { name: "开始任务：完成最小闭环" }).click();
  await page.getByRole("checkbox", { name: "完成子任务：验证执行" }).check();
  await page.getByRole("checkbox", { name: "完成子任务：记录结果" }).check();
  await page.getByRole("button", { name: "完成任务：完成最小闭环" }).click();
  await page.getByRole("button", { name: "撤销完成：完成最小闭环" }).click();
  await page.getByRole("button", { name: "完成任务：完成最小闭环" }).click();

  const eventCount = await page.evaluate((key) => {
    const workspace = JSON.parse(window.localStorage.getItem(key)!);
    return workspace.events.filter(
      (event: { eventType: string; entityId: string }) =>
        event.eventType === "learning.task.completed" &&
        event.entityId ===
          workspace.tasks.find(
            (task: { title: string }) => task.title === "完成最小闭环",
          ).id,
    ).length;
  }, WORKSPACE_V2_KEY);
  expect(eventCount).toBe(1);

  await page.goto("/review");
  await page.getByLabel("今天完成了什么、学到了什么？").fill("闭环可以独立运行");
  await page.getByLabel("明天需要调整什么？").fill("只保留一条主线");
  await page.getByRole("button", { name: "保存今日复盘" }).click();
  await expect(page.getByRole("article", { name: "今日完成明细" })).toContainText(
    "完成最小闭环",
  );
  await page
    .getByRole("button", { name: "将未完成任务顺延到明天" })
    .click();

  await page.reload();
  const persisted = await page.evaluate((key) => {
    const workspace = JSON.parse(window.localStorage.getItem(key)!);
    const task = workspace.tasks.find(
      (candidate: { title: string }) => candidate.title === "顺延任务",
    );
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const localDate =
      tomorrow.getFullYear() +
      "-" +
      String(tomorrow.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(tomorrow.getDate()).padStart(2, "0");
    return {
      spaces: workspace.learningSpaces.length,
      tasks: workspace.tasks.length,
      reviews: workspace.reviews.length,
      rolloverDate: task.scheduledDate,
      expectedDate: localDate,
    };
  }, WORKSPACE_V2_KEY);
  expect(persisted).toEqual({
    spaces: 1,
    tasks: 2,
    reviews: 1,
    rolloverDate: persisted.expectedDate,
    expectedDate: persisted.expectedDate,
  });

  await page.goto("/settings");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出数据" }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const exported = JSON.parse(await readFile(downloadPath!, "utf8"));
  expect(exported.workspace.learningSpaces).toHaveLength(1);
  expect(exported.workspace.tasks).toHaveLength(2);
  expect(exported.workspace.reviews).toHaveLength(1);

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "清空成长数据" }).click();
  await expect(
    page.getByText("成长数据已清空。主题与动效设置仍然保留。"),
  ).toBeVisible();

  await page.getByLabel("选择 GrowPilot 备份文件").setInputFiles({
    name: "growpilot-mvp.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(exported)),
  });
  await expect(
    page.getByText("准备导入：1 个学习空间、2 个任务、1 条复盘。"),
  ).toBeVisible();
  await page.getByRole("button", { name: "确认导入" }).click();
  await expect(
    page.getByText("导入成功，当前成长数据已恢复。"),
  ).toBeVisible();

  const restored = await page.evaluate((key) => {
    const workspace = JSON.parse(window.localStorage.getItem(key)!);
    return {
      spaces: workspace.learningSpaces.length,
      tasks: workspace.tasks.length,
      reviews: workspace.reviews.length,
    };
  }, WORKSPACE_V2_KEY);
  expect(restored).toEqual({ spaces: 1, tasks: 2, reviews: 1 });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/today");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const mobileNav = page.getByRole("navigation", { name: "移动端主导航" });
  for (const label of ["今日", "学习", "复盘", "设置"]) {
    await expect(
      mobileNav.getByRole("link", { name: label, exact: true }),
    ).toBeVisible();
  }
  await expect(
    page.getByRole("button", { name: "打开模块导航" }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});