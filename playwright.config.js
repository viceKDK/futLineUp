import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  fullyParallel: false,
  // Un worker prioriza estabilidad en equipos de desarrollo modestos y CI compartido.
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
    reuseExistingServer: true,
    timeout: 30_000,
    gracefulShutdown: { signal: "SIGINT", timeout: 1_000 },
  },
  projects: [
    // Proyecto por defecto: corre toda la suite (funcional + screenshots desktop y mobile).
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: ["pwa.spec.js"],
    },
    {
      name: "pwa-chromium",
      use: {
        ...devices["Desktop Chrome"],
        serviceWorkers: "allow",
      },
      testMatch: ["pwa.spec.js"],
    },
    // Chequeo de compatibilidad en Edge: funcional + screenshots desktop (a screenshots/msedge/,
    // no pisa la galería canónica de Chrome). Se salta el spec mobile para no duplicar capturas
    // que ya son puramente un resize de viewport, sin diferencias de motor entre canales Chromium.
    {
      name: "msedge",
      use: { ...devices["Desktop Edge"], channel: "msedge" },
      testMatch: [
        "smoke.spec.js",
        "guest-free-mode.spec.js",
        "screenshots.spec.js",
      ],
    },
  ],
});
