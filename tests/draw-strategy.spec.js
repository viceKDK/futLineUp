import { test, expect } from "@playwright/test";

test("sorteo permite cambiar estrategia y conserva a todos los jugadores", async ({ page }) => {
  await page.route("**/src/local-config.js", (route) => route.fulfill({ body: "window.RESET_ON_BOOT=false;", contentType: "text/javascript" }));
  await page.goto("/futbolClub.html#draw");
  await page.waitForFunction(() => window.__FC_READY__ === true);
  await page.getByRole("button", { name: "Rating" }).click();
  await page.getByRole("button", { name: "Sortear todos" }).click();
  const result = await page.evaluate(() => {
    const state = window.db.load("draw", null);
    const roster = window.db.load("roster", window.DEFAULT_ROSTER);
    return { strategy: state.strategy, assigned: Object.keys(state.assignments).length, players: roster.length };
  });
  expect(result.strategy).toBe("rating");
  expect(result.assigned).toBe(result.players);
});
