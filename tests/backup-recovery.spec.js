import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/src/local-config.js", (route) =>
    route.fulfill({
      body: "window.RESET_ON_BOOT=false;",
      contentType: "text/javascript",
    }),
  );
  await page.goto("/futbolClub.html#home");
  await page.waitForFunction(() => window.__FC_READY__ === true);
});

test("crea, altera y restaura un backup automático real", async ({ page }) => {
  const result = await page.evaluate(async () => {
    window.db.save("profile", {
      ...window.DEFAULT_PROFILE,
      displayName: "Estado respaldado",
    });
    const backup = await window.fcBackups.create("restore-test", {
      force: true,
    });
    window.db.save("profile", {
      ...window.DEFAULT_PROFILE,
      displayName: "Estado modificado",
    });
    await window.fcBackups.restore(backup.id);
    return {
      profile: window.db.load("profile", null),
      backups: await window.fcBackups.list(),
      restoredId: backup.id,
    };
  });

  expect(result.profile.displayName).toBe("Estado respaldado");
  expect(result.backups.some((item) => item.id === result.restoredId)).toBe(
    true,
  );
  expect(result.backups.some((item) => item.reason === "before-restore")).toBe(
    true,
  );
});
