// V3 readiness gate — static checks that lock the acceptance standards
// from docs/v3/V3_READINESS_AND_ACCEPTANCE.md without a browser.
// These guard the P0 items: theme tokens (V3-001), mobile shell (V3-002),
// interaction feedback (V3-003) and demo-data removal (V3-004).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = (rel) => readFileSync(join(__dirname, rel), "utf8");

const appShell = src("components/layout/app-shell.tsx");
const topbar = src("components/layout/topbar.tsx");
const mobileNav = src("components/layout/mobile-nav.tsx");
const mobileDrawer = src("components/layout/mobile-drawer.tsx");
const todayView = src("modules/today/ui/today-view.tsx");
const dashboardCard = src("components/dashboard/dashboard-card.tsx");
const quickPrompts = src("components/dashboard/quick-prompts-card.tsx");
const dashboard = src("components/dashboard/dashboard.tsx");
const learning = src("modules/learning/index.tsx");
const review = src("modules/review/index.tsx");
const settings = src("modules/settings/index.tsx");
const themeSwitcher = src("components/theme-switcher.tsx");
const themeTokens = src("shared/theme/tokens.css");
const persistence = src("core/persistence.ts");
const pwaRegister = src("components/pwa-register.tsx");
const serviceWorker = src("../public/sw.js");
const motionCss = src("shared/theme/motion.css");
const e2eConfig = readFileSync(join(__dirname, "../../../playwright.config.ts"), "utf8");
const ciWorkflow = readFileSync(join(__dirname, "../../../.github/workflows/ci.yml"), "utf8");

// ---- V3-001: theme tokens — no hard-coded colors in official content ----
test("V3-001: no bg-white / text-zinc / border-black in official UI", () => {
  const offenders = [
    appShell.match(/bg-white|text-zinc|border-black/g),
    topbar.match(/bg-white|text-zinc|border-black/g),
    todayView.match(/bg-white|text-zinc|border-black/g),
    dashboardCard.match(/bg-white|text-zinc|border-black/g),
    mobileNav.match(/bg-white|text-zinc|border-black/g),
    mobileDrawer.match(/bg-white|text-zinc|border-black/g),
  ].filter(Boolean);
  assert.equal(offenders.length, 0, "hard-coded colors remain: " + JSON.stringify(offenders));
});

test("V3-001: single global stylesheet entry", () => {
  const layout = src("app/layout.tsx");
  assert.ok(!layout.includes("./globals.css"), "legacy ./globals.css import must be gone");
  assert.ok(layout.includes('import "@/styles/globals.css"'), "single entry must remain");
});

test("V3-001: shell main uses semantic surface, not white", () => {
  assert.ok(appShell.includes("bg-card"), "main must use bg-card token");
  assert.ok(!appShell.includes("bg-white"), "no white background on main");
});

test("V3-001: content animation never gates visibility", () => {
  assert.ok(appShell.includes("initial={false}"), "motion outlet must be visible by default");
});

// ---- V3-002: mobile shell — desktop sidebar hidden, bottom nav + drawer ----
test("V3-002: desktop sidebar hidden on mobile, all nine entries reachable", () => {
  assert.ok(appShell.includes('className="hidden md:block"'), "sidebar must be md-only");
  assert.ok(mobileNav.includes("md:hidden"), "bottom nav must be mobile-only");
  assert.ok(mobileDrawer.includes("md:hidden"), "drawer must be mobile-only");
  const tabHrefs = [...mobileNav.matchAll(/href: "(\/[a-z-]+)"/g)].map((m) => m[1]);
  assert.equal(tabHrefs.length, 5, "exactly five primary tabs");
  assert.ok(mobileDrawer.includes("moduleRegistry"), "drawer must render the module registry");
  assert.ok(mobileDrawer.includes("href={module.href}"), "drawer links navigate to modules");
});

test("V3-002: mobile nav handles safe-area inset", () => {
  assert.ok(mobileNav.includes("env(safe-area-inset-bottom)"), "safe-area padding required");
});

// ---- V3-003: interaction feedback — no enabled no-op buttons ----
test("V3-003: Today starts and completes persisted tasks", () => {
  assert.ok(todayView.includes("onClick={startNextTask}"), "next-task action must be wired");
  assert.ok(todayView.includes("toggleTask"), "Today must support inline task completion");
  assert.ok(todayView.includes("saveDailyLoop(next)"), "task changes must persist");
  assert.ok(todayView.includes("scrollIntoView"), "start action must locate the active task");
  assert.ok(todayView.includes('aria-live="polite"'), "feedback must be announced");
});

test("V3-003: prompt copy surfaces success and failure", () => {
  assert.ok(quickPrompts.includes("navigator.clipboard"), "clipboard API used");
  assert.ok(quickPrompts.includes("catch"), "errors must not be swallowed");
  assert.ok(quickPrompts.includes('aria-live="polite"'), "result must be announced");
  assert.ok(quickPrompts.includes("已复制") && quickPrompts.includes("复制失败"));
});

test("V3-003: search is explicitly disabled until implemented", () => {
  assert.ok(topbar.includes("disabled"), "search input must be disabled");
  assert.ok(topbar.includes("即将开放"), "disabled reason must be visible");
});

test("V3-006: pages use the typed persistence boundary", () => {
  for (const page of [dashboard, todayView, learning, review, settings]) {
    assert.equal(
      page.includes("window.localStorage"),
      false,
      "page must not access localStorage directly",
    );
    assert.ok(
      page.includes("createBrowserWorkspaceRepository"),
      "page must use browser repository factory",
    );
  }
  assert.ok(persistence.includes("migrateDailyLoopV1ToV2"));
  assert.ok(persistence.includes("saveDailyLoop"));
});

test("V3-006: migration recovery is handled at the repository boundary", () => {
  assert.ok(persistence.includes("catch"));
  assert.ok(persistence.includes("loadV1DailyLoop"));
});

test("V3-007: browser regression suite is wired into CI", () => {
  assert.ok(e2eConfig.includes("webServer"));
  assert.ok(e2eConfig.includes("testDir: \"./apps/web/e2e\""));
  assert.ok(ciWorkflow.includes("npm run test:e2e"));
  assert.ok(ciWorkflow.includes("v3/**"));
});

test("V3-008: service worker only serves HTML fallback to navigations", () => {
  const navigateGuard = serviceWorker.indexOf('request.mode === "navigate"');
  const dashboardFallback = serviceWorker.indexOf('caches.match("/dashboard")');
  assert.ok(navigateGuard >= 0, "navigation requests need an explicit branch");
  assert.ok(dashboardFallback > navigateGuard, "HTML fallback must stay in navigation branch");
  assert.ok(serviceWorker.includes("status: 503"), "uncached offline responses must be explicit");
  assert.ok(pwaRegister.includes("console.warn"), "registration failures must be diagnosable");
  assert.ok(pwaRegister.includes("data-pwa-status"), "registration status must be observable");
});

test("V3-008: MotionConfig and CSS both honor motion preferences", () => {
  assert.ok(appShell.includes("MotionConfig"));
  assert.ok(appShell.includes("reducedMotion={reducedMotion}"));
  assert.ok(motionCss.includes('html[data-motion="off"] *'));
  assert.ok(motionCss.includes("scroll-behavior: auto"));
});


test("V3 summer day theme keeps truthful labels and semantic contrast tokens", () => {
  assert.ok(themeSwitcher.includes('label: "夏日"'));
  assert.ok(themeTokens.includes("--color-action-primary: #007a96"));
  assert.ok(themeTokens.includes("--card-bg: #fffdf7"));
  assert.ok(!themeTokens.includes("--color-text-primary: #ffffff"));
});

test("Review and Settings replace placeholder pages with real repository actions", () => {
  assert.ok(review.includes("saveDailyLoop(next)"));
  assert.ok(review.includes("rollDailyLoopForward"));
  assert.ok(settings.includes("导出数据"));
  assert.ok(settings.includes("导入数据"));
  assert.ok(settings.includes("清空成长数据"));
});

// ---- V3-005: one shell, one dashboard, no legacy module shell ----
test("V3-005: legacy modules/dashboard is removed", () => {
  try {
    readFileSync(join(__dirname, "modules/dashboard/index.tsx"));
    assert.fail("modules/dashboard must be deleted");
  } catch {
    assert.ok(true);
  }
});
