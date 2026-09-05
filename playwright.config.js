import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.js",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:8765",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    serviceWorkers: "block",
  },
  webServer: {
    command: "node scripts/test-server.mjs",
    url: "http://localhost:8765/futbolClub.html",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    gracefulShutdown: { signal: "SIGINT", timeout: 1_000 },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, testIgnore: ["pwa.spec.js"] },
    {
      name: "pwa-chromium",
      use: { ...devices["Desktop Chrome"], serviceWorkers: "allow" },
      testMatch: ["pwa.spec.js"],
    },
    {
      name: "msedge",
      use: { ...devices["Desktop Edge"], channel: "msedge" },
      testMatch: ["smoke.spec.js", "guest-free-mode.spec.js", "screenshots.spec.js"],
    },
  ],
});
