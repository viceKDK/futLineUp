import { test, expect } from "@playwright/test";

async function openGuestApp(page) {
  await page.route("**/src/local-config.js", (route) =>
    route.fulfill({
      body: "window.RESET_ON_BOOT=false;",
      contentType: "text/javascript",
    }),
  );
  // #home evita la pantalla de login/registro que se muestra en la primera visita sin hash.
  await page.goto("/futbolClub.html#home");
  await page.waitForFunction(() => window.__FC_READY__ === true);
}

async function readFirstSlot(page, selector) {
  const transform = await page
    .locator(selector + " .slot")
    .first()
    .getAttribute("transform");
  const values = transform.match(/translate\(([-\d.]+),([-\d.]+)\)/);
  return { x: Number(values[1]), y: Number(values[2]) };
}

test("el flujo principal se puede usar sin cuenta", async ({ page }) => {
  await openGuestApp(page);

  await expect(page.getByLabel("Modo sin cuenta")).toContainText("sin cuenta");
  await expect(page.getByLabel("Modo sin cuenta")).toContainText(
    "este dispositivo",
  );

  await page.getByRole("button", { name: "Backup y sincronización" }).click();
  await expect(page.locator("#page-settings")).toContainText(
    "Estás usando futbolClub sin cuenta",
  );
  await expect(
    page.getByRole("button", { name: "Iniciar sesión / Crear cuenta" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Conectar Google para sincronizar" }),
  ).toBeDisabled();

  await page.click('[data-page="home"]');
  await expect(page.locator("#page-home")).toHaveClass(/active/);
});

test("Libre persiste y el enlace abre igual sin cuenta ni datos locales", async ({
  page,
  browser,
}) => {
  test.slow(); // abre dos contextos completos y cada uno carga/transpila el shell CDN
  await openGuestApp(page);
  await page.evaluate(() => {
    window.db.save("teams", []);
    window.db.save("editor", {
      teamId: null,
      name: "Libre sin cuenta",
      mode: 5,
      formIdx: 0,
      freeMode: false,
      kit: { design: "solid", primary: "#e11d48", secondary: "#0f172a" },
      assignedIds: [1, 2, 3, 4, 5],
      freePositions: { "5:0": [[12, 88], [76, 70], null, null, null] },
      captainId: 1,
      substituteIds: [],
    });
    window.go("editor");
  });

  const libre = page.locator('#page-editor input[type="checkbox"]').first();
  await libre.check();
  await expect(libre).toBeChecked();

  const editorSlot = await readFirstSlot(
    page,
    "#page-editor .editor-pitch-wrap",
  );
  expect(editorSlot.x).toBeCloseTo(12, 4);
  expect(editorSlot.y).toBeCloseTo(21.8, 4);

  await page.getByRole("button", { name: /Guardar/ }).click();
  await expect(page.locator("#page-share")).toHaveClass(/active/);
  await expect(page.locator(".share-card-pitch .pitch-wrap")).toHaveClass(
    /free/,
  );

  await page.click('[data-page="home"]');
  await page
    .locator("#page-home")
    .getByText("Libre sin cuenta", { exact: true })
    .click();
  await expect(
    page.locator('#page-editor input[type="checkbox"]').first(),
  ).toBeChecked();
  await page.getByRole("button", { name: /Guardar/ }).click();

  const shareURL = await page.locator(".share-link-row input").inputValue();
  expect(shareURL).toContain("#share=");

  const cleanContext = await browser.newContext();
  try {
    const cleanPage = await cleanContext.newPage();
    await cleanPage.route("**/src/local-config.js", (route) =>
      route.fulfill({
        body: "window.RESET_ON_BOOT=false;",
        contentType: "text/javascript",
      }),
    );
    await cleanPage.goto(shareURL);
    await cleanPage.waitForSelector(".share-card-pitch .pitch-wrap");

    await expect(cleanPage.locator("#page-share")).toHaveClass(/active/);
    await expect(
      cleanPage.locator(".share-card-pitch .pitch-wrap"),
    ).toHaveClass(/free/);
    const sharedSlot = await readFirstSlot(cleanPage, ".share-card-pitch");
    expect(sharedSlot.x).toBeCloseTo(12, 4);
    expect(sharedSlot.y).toBeCloseTo(21.8, 4);
    expect(await cleanPage.evaluate(() => window.fcAuth.configured)).toBe(
      false,
    );
  } finally {
    await cleanContext.close();
  }
});
