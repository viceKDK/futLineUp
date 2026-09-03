import { test, expect } from "@playwright/test";

test("mide LCP, CLS e INP con datos reales del navegador", async ({ page }) => {
  await page.route("**/src/local-config.js", (route) =>
    route.fulfill({
      body: "window.RESET_ON_BOOT=false;",
      contentType: "text/javascript",
    }),
  );
  await page.goto("/futbolClub.html#home");
  await page.waitForFunction(() => window.__FC_READY__ === true);

  await page.evaluate(() => {
    const shift = document.createElement("div");
    shift.textContent = "Medición de estabilidad visual";
    shift.style.cssText = "height:80px;background:#111;color:white";
    document.body.prepend(shift);
  });
  await page.locator('[data-page="mode"]').click();
  await page.waitForTimeout(1_000);

  await expect
    .poll(() =>
      page.evaluate(() => Object.keys(window.fcObservability.getVitals())),
    )
    .toEqual(expect.arrayContaining(["LCP", "CLS", "INP"]));

  const vitals = await page.evaluate(() => window.fcObservability.getVitals());
  for (const name of ["LCP", "CLS", "INP"]) {
    expect(vitals[name].value).toBeGreaterThanOrEqual(0);
    expect(["good", "needs-improvement", "poor"]).toContain(
      vitals[name].rating,
    );
  }
  console.log(`WEB_VITALS ${JSON.stringify(vitals)}`);
});

test("registra errores, release y oculta secretos", async ({ page }) => {
  await page.route("**/src/local-config.js", (route) =>
    route.fulfill({
      body: "window.RESET_ON_BOOT=false;",
      contentType: "text/javascript",
    }),
  );
  await page.goto("/futbolClub.html#home");
  await page.waitForFunction(() => window.__FC_READY__ === true);

  const result = await page.evaluate(() => {
    window.fcObservability.log("error", "prueba controlada", {
      token: "no-debe-aparecer",
      detail: "visible",
    });
    const entry = window.fcObservability.getLogs().at(-1);
    return { entry, release: window.FC_RELEASE };
  });

  expect(result.release.version).toMatch(/^\d+\.\d+\.\d+/);
  expect(result.entry.context.token).toBe("[redacted]");
  expect(result.entry.context.detail).toBe("visible");
});
