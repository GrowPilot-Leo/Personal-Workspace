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

  for (const route of ["/dashboard", "/today", "/learning", "/settings"]) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
  }

  expect(errors).toEqual([]);
});

test("390px mobile shell keeps content in the viewport and exposes all modules", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/today");

  await expect(page.getByRole("heading", { name: "今日行动" })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);

  await page.getByRole("button", { name: "打开模块导航" }).click();
  const drawer = page.getByRole("dialog", { name: "模块导航" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("link", { name: "职业成长" })).toBeVisible();
  await expect(drawer.getByRole("link", { name: "设置" })).toBeVisible();
});

test("three themes remain readable and persist on refresh", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/today");

  for (const [label, value] of [
    ["日间", "day"],
    ["夜间", "night"],
    ["暮色", "dusk"],
  ] as const) {
    await page.getByRole("button", { name: label }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", value);
    await expect(page.getByRole("heading", { name: "今日行动" })).toBeVisible();

    const colors = await page.getByRole("heading", { name: "今日行动" }).evaluate((node) => {
      const style = getComputedStyle(node);
      return { color: style.color, background: getComputedStyle(document.body).backgroundColor };
    });
    expect(colors.color).not.toBe("rgb(255, 255, 255)");
    expect(colors.background).not.toBe("rgb(255, 255, 255)");
  }

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dusk");
});

test("today action gives visible and announced feedback", async ({ page }) => {
  await page.goto("/today");

  const start = page.getByRole("button", { name: "开始今日行动" });
  await start.click();

  await expect(page.getByRole("button", { name: /行动进行中/ })).toBeVisible();
  await expect(page.locator('[aria-live="polite"]')).toContainText("已开始今日行动");
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
  await expect(page.getByText("复制失败")).toBeVisible();
});

test("critical and serious axe violations are absent on Today", async ({ page }) => {
  await page.goto("/today");

  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter((violation) =>
    violation.impact === "critical" || violation.impact === "serious",
  );

  expect(blocking).toEqual([]);
});
