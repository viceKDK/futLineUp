import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/src/local-config.js", (route) => route.fulfill({
    body: "window.RESET_ON_BOOT=false;", contentType: "text/javascript",
  }));
  await page.goto("/futbolClub.html#home");
  await page.waitForFunction(() => window.__FC_READY__ === true);
});
test("núcleo modular conserva APIs, Unicode y eventos de persistencia", async ({ page }) => {
  const result = await page.evaluate(() => {
    const events = [];
    const listener = (event) => events.push(event.detail.key);
    window.addEventListener("fc:data-changed", listener);
    window.db.save("roster", [{ id: 1, name: "José ⚽" }]);
    const snapshot = { draft: { mode: 7 }, roster: window.ROSTER };
    const decoded = window.decodeLineupSnapshot(window.encodeLineupSnapshot(snapshot));
    window.removeEventListener("fc:data-changed", listener);
    return { name: decoded.roster[0].name, events, version: window.exportFutbolClubData().schemaVersion };
  });
  expect(result).toEqual({ name: "José ⚽", events: ["roster"], version: 2 });
});
test("replace conserva configuración ajena y elimina datos reconocidos ausentes", async ({ page }) => {
  const result = await page.evaluate(() => {
    window.db.save("authIntroSeen", "1");
    window.db.save("teams", [{ id: "old" }]);
    window.importFutbolClubData({ app: "futbolClub", schemaVersion: 2, data: { roster: [] } });
    return { auth: window.db.load("authIntroSeen"), teams: window.db.load("teams", null) };
  });
  expect(result).toEqual({ auth: "1", teams: null });
});
