import { test, expect } from "@playwright/test";

const PAGES = [
  { id: "home", title: /MIS EQUIPOS/i },
  { id: "mode", title: /CUÁNTOS POR LADO/i },
  { id: "editor", title: /.+/ },
  { id: "draw", title: /REPARTIR LOS PIBES/i },
  { id: "kits", title: /DISEÑÁ TU KIT/i },
  { id: "crests", title: /ESCUDO DE CADA EQUIPO/i },
  { id: "rival", title: /NOSOTROS VS\. ELLOS/i },
  { id: "share", title: /MANDÁ LA ALINEACIÓN/i },
  { id: "coach", title: /TU PLANTEL/i },
  { id: "league", title: /.+/ },
];

test.beforeEach(async ({ page }) => {
  await page.route("**/src/local-config.js", (route) =>
    route.fulfill({
      body: "window.RESET_ON_BOOT=false;",
      contentType: "text/javascript",
    }),
  );
  // #home evita la pantalla de login/registro que se muestra en la primera visita sin hash.
  await page.goto("/futbolClub.html#home");
  await page.waitForFunction(() => window.__FC_READY__ === true);
});

test("sidebar muestra las 10 secciones", async ({ page }) => {
  await expect(page.locator(".nav-item")).toHaveCount(10);
});

test("mantiene los cambios en memoria si localStorage deja de escribir", async ({
  page,
}) => {
  const result = await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new DOMException("Sin espacio", "QuotaExceededError");
    };
    try {
      window.db.save("storage-fallback-test", { ok: true });
      return window.db.load("storage-fallback-test", null);
    } finally {
      Storage.prototype.setItem = original;
      window.db.remove("storage-fallback-test");
    }
  });
  expect(result).toEqual({ ok: true });
});

test("navega por las 10 secciones y monta su contenido", async ({ page }) => {
  for (const p of PAGES) {
    await page.click(`[data-page="${p.id}"]`);
    await expect(page.locator(`#page-${p.id}`)).toHaveClass(/active/);
    await expect(page.locator(`#page-${p.id}`)).toContainText(p.title);
  }
});

test("perfil abre Cuenta y datos", async ({ page }) => {
  await page.click(".sidebar-profile-btn");
  await expect(page.locator("#page-settings")).toHaveClass(/active/);
  await expect(page.locator("#page-settings")).toContainText(/TU FUTBOLCLUB/i);
});

test("editor guarda y recupera alineación completa", async ({ page }) => {
  await page.click('[data-page="editor"]');
  await page
    .locator("#page-editor .editor-title-input")
    .fill("Prueba persistencia");
  await page.getByRole("button", { name: "Auto-completar" }).click();
  await page.getByRole("button", { name: /Guardar/ }).click();
  const stored = await page.evaluate(() => window.db.load("teams", []).at(-1));
  expect(stored.assignedIds.filter(Boolean).length).toBeGreaterThan(0);
  await page.reload();
  await page.click('[data-page="home"]');
  await page
    .locator("#page-home")
    .getByText("Prueba persistencia", { exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.db.load("editor", null)?.assignedIds?.filter(Boolean).length ||
          0,
      ),
    )
    .toBeGreaterThan(0);
});

test("sorteo balancea sin duplicar jugadores", async ({ page }) => {
  await page.click('[data-page="draw"]');
  await page.getByRole("button", { name: "Sortear todos" }).click();
  const state = await page.evaluate(() => window.db.load("draw", null));
  const assigned = Object.keys(state.assignments);
  expect(new Set(assigned).size).toBe(assigned.length);
  const counts = [0, 0];
  Object.values(state.assignments).forEach((team) => counts[team]++);
  expect(Math.abs(counts[0] - counts[1])).toBeLessThanOrEqual(1);
});

test("backup exportable conserva datos y versión", async ({ page }) => {
  const backup = await page.evaluate(() => window.exportFutbolClubData());
  expect(backup.app).toBe("futbolClub");
  expect(backup.schemaVersion).toBeGreaterThanOrEqual(2);
});

test("backup inválido no reemplaza los datos actuales", async ({ page }) => {
  const result = await page.evaluate(() => {
    window.db.save("profile", { displayName: "No borrar" });
    try {
      window.importFutbolClubData(
        {
          app: "futbolClub",
          schemaVersion: 2,
          data: { roster: { corrupto: true } },
        },
        "replace",
      );
    } catch (error) {
      return {
        message: error.message,
        profile: window.db.load("profile", null),
      };
    }
    return null;
  });
  expect(result.message).toMatch(/plantel/i);
  expect(result.profile.displayName).toBe("No borrar");
});

test("snapshot compartible se decodifica", async ({ page }) => {
  const result = await page.evaluate(() => {
    const encoded = window.encodeLineupSnapshot({
      draft: { name: "Equipo", mode: 5, assignedIds: [] },
      roster: [],
      match: {},
    });
    return window.decodeLineupSnapshot(encoded).draft.name;
  });
  expect(result).toBe("Equipo");
});

test("snapshot compartible rechaza cargas excesivas", async ({ page }) => {
  const rejected = await page.evaluate(() => {
    try {
      window.decodeLineupSnapshot("a".repeat(window.FC_SHARE_MAX_CHARS + 1));
    } catch (error) {
      return error.message;
    }
    return "";
  });
  expect(rejected).toMatch(/demasiado grande/i);
});

test("nombre de jugador se trata como texto durante el arrastre", async ({
  page,
}) => {
  await page.evaluate(() => {
    window.__xssRegression = 0;
    window.db.save("roster", [
      {
        id: 991,
        name: '</span><img src=x onerror="window.__xssRegression=1">',
        num: 9,
        pos: "DEL",
        photo: null,
      },
    ]);
  });
  await page.click('[data-page="editor"]');
  await page
    .locator(".roster-item")
    .first()
    .evaluate((element) => {
      element.dispatchEvent(
        new DragEvent("dragstart", {
          bubbles: true,
          dataTransfer: new DataTransfer(),
        }),
      );
    });
  await page.waitForTimeout(50);
  expect(await page.evaluate(() => window.__xssRegression)).toBe(0);
});

test("entrenador registra evaluación", async ({ page }) => {
  await page.click('[data-page="coach"]');
  await page.locator(".roster-overview-card").first().click();
  await page.getByRole("button", { name: /Nueva evaluación/ }).click();
  await page.getByLabel("Qué hizo bien").fill("Buen pase");
  await page.getByRole("button", { name: "Guardar evaluación" }).click();
  const evaluations = await page.evaluate(() =>
    window.db.load("evaluations", []),
  );
  expect(evaluations).toHaveLength(1);
});

test("liga se crea con equipos propios y calcula tabla", async ({ page }) => {
  await page.click('[data-page="league"]');
  await expect(page.getByRole("heading", { name: "Crear liga" })).toBeVisible();
  await page.locator(".league-setup-fields input").first().fill("Apertura test");

  const teamInput = page.getByLabel("Nombre del equipo");
  await teamInput.fill("A");
  await page.getByRole("button", { name: "Agregar" }).click();
  await teamInput.fill("B");
  await page.getByRole("button", { name: "Agregar" }).click();
  await page.getByRole("button", { name: "Crear liga" }).click();

  await expect(page.locator(".standings tbody tr")).toHaveCount(2);
  await page.getByLabel("Local", { exact: true }).fill("A");
  await page.getByLabel("Visitante", { exact: true }).fill("B");
  await page.getByLabel("Goles local").fill("2");
  await page.getByLabel("Goles visitante").fill("1");
  await page.getByRole("button", { name: "Guardar partido" }).click();
  await expect(page.locator(".standings tbody tr").first()).toContainText("A");
  await expect(page.locator(".standings tbody tr").first()).toContainText("3");
});

test("importador CSV reconoce equipos, fixture y resultados", async ({ page }) => {
  const parsed = await page.evaluate(() =>
    window.parseLeagueCsv(
      "Fecha;Local;Visitante;Goles Local;Goles Visitante\n2026-08-22;A;B;3;1\n2026-08-29;B;C;;",
    ),
  );
  expect(parsed.kind).toBe("fixture");
  expect(parsed.teams).toEqual(["A", "B", "C"]);
  expect(parsed.fixtures).toHaveLength(2);
  expect(parsed.fixtures[0].played).toBe(true);
  expect(parsed.fixtures[0].homeScore).toBe(3);
  expect(parsed.fixtures[1].played).toBe(false);
});
