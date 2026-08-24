import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "3000";
const baseURL = "http://127.0.0.1:" + port;
const webServerCommand =
  process.env.PLAYWRIGHT_USE_BUILD === "1"
    ? "npm --workspace apps/web run start -- --hostname 127.0.0.1 --port " + port
    : "npm --workspace apps/web run dev -- --hostname 127.0.0.1 --port " + port;

export default defineConfig({
  testDir: "./apps/web/e2e",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
