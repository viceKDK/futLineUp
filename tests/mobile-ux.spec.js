import { test, expect } from "@playwright/test";

const RESPONSIVE_VIEWPORTS = [
  { name: "Android compacto", width: 360, height: 800 },
  { name: "iPhone", width: 390, height: 844 },
  { name: "teléfono horizontal", width: 844, height: 390 },
  { name: "tablet", width: 768, height: 1024 },
];

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/src/local-config.js", (route) =>
    route.fulfill({
      body: "window.RESET_ON_BOOT=false;",
      contentType: "text/javascript",
    }),
  );
  await page.goto("/futbolClub.html#home");
  await page.waitForFunction(() => window.__FC_READY__ === true);
});

test("menú móvil abre, navega y no desborda el viewport", async ({ page }) => {
  const menu = page.getByRole("button", { name: /Abrir menú de navegación/i });
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(page.locator("#nav")).toBeVisible();
  await page.locator('#nav [data-page="league"]').click();
  await expect(page.locator("#page-league")).toHaveClass(/active/);
  await expect(page.locator("#nav")).toBeHidden();
  const viewport = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.width);
});

test("acciones principales de inicio permanecen visibles en móvil", async ({
  page,
}) => {
  for (const name of ["+ Resultado", "Sortear ahora", "+ Nuevo equipo"]) {
    const box = await page
      .getByRole("button", { name, exact: true })
      .boundingBox();
    expect(box).not.toBeNull();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  }
});

for (const viewport of RESPONSIVE_VIEWPORTS) {
  test(`sin desborde horizontal en ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const pageId of ["home", "coach", "league", "settings"]) {
      await page.evaluate((id) => window.go(id), pageId);
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }));
      expect(dimensions.content, `${pageId} desborda`).toBeLessThanOrEqual(
        dimensions.viewport,
      );
    }
  });
}
