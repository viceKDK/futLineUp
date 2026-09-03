import { test, expect } from "@playwright/test";

test("la PWA registra el shell y vuelve a abrir sin conexión", async ({
  page,
  context,
}) => {
  await page.route("**/src/local-config.js", (route) =>
    route.fulfill({
      body: "window.RESET_ON_BOOT=false;",
      contentType: "text/javascript",
    }),
  );
  await page.goto("/futbolClub.html#home");
  await page.waitForFunction(() => window.__FC_READY__ === true);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "manifest.webmanifest",
  );

  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);

  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__FC_READY__ === true);
    await expect(page.getByLabel("Modo sin cuenta")).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
