import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const DAILY_LOOP_KEY = "growpilot.daily-loop.v1";

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

const seededDailyLoop = JSON.stringify({
  version: 1,
  activeDate: "2026-08-10",
  goal: "完成 RAG 方案",
  availableMinutes: 60,
  tasks: [
    {
      id: "task-1",
      title: "整理 RAG 流程",
      durationMinutes: 30,
      completedAt: null,
      createdAt: "2026-08-10T00:00:00.000Z",
    },
  ],
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
  await expect(mobileNav.getByRole("link", { name: "复盘" })).toBeVisible();
  await expect(mobileNav.getByRole("link", { name: "设置" })).toBeVisible();
  await expect(mobileNav.getByRole("link", { name: "健身" })).toHaveCount(0);

  await page.getByRole("button", { name: "打开模块导航" }).click();
  const drawer = page.getByRole("dialog", { name: "模块导航" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("link", { name: "职业成长" })).toBeVisible();
  await expect(drawer.getByRole("link", { name: "设置" })).toBeVisible();
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

test("today starts the next real task and can complete it inline", async ({ page }) => {
  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: DAILY_LOOP_KEY, value: seededDailyLoop },
  );
  await page.goto("/today");

  await page.getByRole("button", { name: /开始下一项/ }).click();
  await expect(page.locator('[aria-live="polite"]')).toContainText("已开始：整理 RAG 流程");

  await page.getByRole("button", { name: "完成任务：整理 RAG 流程" }).click();
  await expect(page.getByRole("button", { name: "撤销完成：整理 RAG 流程" })).toBeVisible();
  await expect(page.getByText("1/1")).toBeVisible();
  await expect(page.getByRole("list", { name: "今日时间线" })).toBeVisible();
  await expect(page.getByText("今日节奏")).toBeVisible();
});

test("review saves real daily review and enables next-day rollover", async ({ page }) => {
  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: DAILY_LOOP_KEY, value: seededDailyLoop },
  );
  await page.goto("/review");

  await page.getByLabel("今天完成了什么、学会了什么？").fill("完成了 RAG 流程整理");
  await page.getByLabel("哪里卡住了？").fill("资料较分散");
  await page.getByLabel("下一次准备怎么调整？").fill("先固定输入输出");
  await page.getByRole("button", { name: "保存今日复盘" }).click();

  await expect(page.getByText("复盘已保存")).toBeVisible();
  await expect(page.getByRole("button", { name: "归档并开始下一天" })).toBeEnabled();
});

test("settings owns appearance and local data controls", async ({ page }) => {
  await page.goto("/settings");
  const main = page.locator("main");

  await main.getByRole("button", { name: "精简动效" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await expect(main.getByRole("button", { name: "导出数据" })).toBeVisible();
  await expect(main.getByRole("button", { name: "导入数据" })).toBeVisible();
  await expect(main.getByRole("button", { name: "清空成长数据" })).toBeVisible();
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
