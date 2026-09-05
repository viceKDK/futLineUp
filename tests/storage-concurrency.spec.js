import { test, expect } from "@playwright/test";

test("dos pestañas invalidan snapshots locales sin recargar", async ({ context }) => {
  const a = await context.newPage();
  const b = await context.newPage();
  for (const page of [a, b]) {
    await page.route("**/src/local-config.js", (route) => route.fulfill({ body: "window.RESET_ON_BOOT=false;", contentType: "text/javascript" }));
    await page.goto("/futbolClub.html#home");
    await page.waitForFunction(() => window.__FC_READY__ === true);
  }
  await a.evaluate(() => window.db.save("profile", { displayName: "pestaña-a" }));
  await expect.poll(() => b.evaluate(() => window.db.load("profile", null)?.displayName)).toBe("pestaña-a");
  await b.evaluate(() => window.db.save("profile", { displayName: "pestaña-b" }));
  await expect.poll(() => a.evaluate(() => window.db.load("profile", null)?.displayName)).toBe("pestaña-b");
  await a.evaluate(() => window.db.remove("profile"));
  await expect.poll(() => b.evaluate(() => window.db.load("profile", null))).toBe(null);
});
