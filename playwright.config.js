import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: false,
  // La app carga varios scripts externos por CDN (React, Babel, fuentes, etc.) — con
  // más paralelismo el arranque se vuelve flaky por contención de red/CPU. 2 workers
  // corre estable en desarrollo local; ajustar con --workers si el entorno lo permite.
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8765',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx http-server -p 8765 -c-1 .',
    url: 'http://localhost:8765/futbolClub.html',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    // Proyecto por defecto: corre toda la suite (funcional + screenshots desktop y mobile).
    { name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    // Chequeo de compatibilidad en Edge: funcional + screenshots desktop (a screenshots/msedge/,
    // no pisa la galería canónica de Chrome). Se salta el spec mobile para no duplicar capturas
    // que ya son puramente un resize de viewport, sin diferencias de motor entre canales Chromium.
    {
      name: 'msedge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
      testMatch: ['smoke.spec.js', 'guest-free-mode.spec.js', 'screenshots.spec.js'],
    },
  ],
});
