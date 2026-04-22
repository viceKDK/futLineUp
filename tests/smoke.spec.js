import { test, expect } from '@playwright/test';

const PAGES = [
  { id: 'home',   title: /MIS EQUIPOS/i },
  { id: 'mode',   title: /CUÁNTOS POR LADO/i },
  { id: 'editor', title: /.+/ },
  { id: 'draw',   title: /REPARTIR LOS PIBES/i },
  { id: 'kits',   title: /DISEÑÁ TU KIT/i },
  { id: 'rival',  title: /NOSOTROS VS\. ELLOS/i },
  { id: 'share',  title: /MANDÁ LA ALINEACIÓN/i },
];

test.beforeEach(async ({ page }) => {
  await page.goto('/futbolClub.html');
  await page.waitForSelector('.nav-item');
});

test('sidebar muestra las 7 secciones', async ({ page }) => {
  const items = await page.locator('.nav-item').count();
  expect(items).toBe(7);
});

for (const p of PAGES) {
  test(`navega a ${p.id} y monta contenido`, async ({ page }) => {
    await page.click(`[data-page="${p.id}"]`);
    await expect(page.locator(`#page-${p.id}`)).toHaveClass(/active/);
    const text = (await page.locator(`#page-${p.id}`).innerText()).trim();
    expect(text.length).toBeGreaterThan(20);
    const title = page.locator(`#page-${p.id} .page-title`).first();
    if (await title.count()) {
      await expect(title).toContainText(p.title);
    }
  });
}

test('editor: auto-completar llena la cancha', async ({ page }) => {
  await page.click('[data-page="editor"]');
  await page.getByRole('button', { name: 'Auto-completar' }).click();
  const filled = await page.locator('#page-editor svg circle').count();
  expect(filled).toBeGreaterThan(0);
});

test('sorteo: "Sortear todos" deja 0 sin asignar', async ({ page }) => {
  await page.click('[data-page="draw"]');
  await page.getByRole('button', { name: 'Sortear todos' }).click();
  await expect(page.locator('#page-draw')).toContainText(/SIN ASIGNAR · 0|ya están asignados/i);
});

test('camisetas: cambiar preset actualiza colores', async ({ page }) => {
  await page.click('[data-page="kits"]');
  const before = await page.locator('#page-kits').innerText();
  await page.getByRole('button', { name: /Blaugrana/i }).click();
  const after = await page.locator('#page-kits').innerText();
  expect(after).not.toBe(before);
});

test('persistencia: localStorage usa el prefijo fc.v1.', async ({ page }) => {
  await page.click('[data-page="kits"]');
  await page.waitForTimeout(300);
  const keys = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('fc.v1.')));
  expect(keys.length).toBeGreaterThan(0);
});
