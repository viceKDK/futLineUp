import { test } from "@playwright/test";
import { shootFull, openSeededApp } from "./helpers/screenshot-utils.js";

// Capturas a ancho de teléfono (390x844, iPhone 12/13/14 aprox.) de las pantallas
// clave — sobre todo las tres rediseñadas — para verificar el layout responsive.
const MOBILE_VIEWPORT = { width: 390, height: 844 };

const SHOTS = [
  { id: "home", file: "01-home.png" },
  { id: "coach", file: "09-coach.png" },
  { id: "league", file: "10-league.png" },
  { id: "crests", file: "05b-crests.png" },
];

test("captura screenshots mobile de las secciones clave", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize(MOBILE_VIEWPORT);
  await openSeededApp(page);

  for (const shot of SHOTS) {
    await page.evaluate((pageId) => window.go(pageId), shot.id);
    await page.waitForTimeout(250);
    await shootFull(page, `screenshots/mobile/${shot.file}`);
  }

  // Ficha del jugador (Entrenador)
  await page.evaluate(() => window.go("coach"));
  await page.locator(".roster-overview-card").first().click();
  await page.waitForTimeout(250);
  await shootFull(page, "screenshots/mobile/09b-coach-ficha.png");

  // Fixture por fecha (Liga amateur)
  await page.evaluate(() => window.go("league"));
  const fixtureTab = page.getByRole("tab", { name: "Fixture" });
  if (await fixtureTab.count()) {
    await fixtureTab.click();
    await page.waitForTimeout(250);
  }
  await shootFull(page, "screenshots/mobile/10b-league-fixture.png");

  // La navegación directa evita que el estado abierto/cerrado del menú altere la captura.
  await page.evaluate(() => window.go("settings"));
  await page.waitForTimeout(200);
  await shootFull(page, "screenshots/mobile/11-settings.png");
});
