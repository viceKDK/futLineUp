import { test, expect } from '@playwright/test';

const PAGES = [
  { id:'home', title:/MIS EQUIPOS/i }, { id:'mode', title:/CUÁNTOS POR LADO/i },
  { id:'editor', title:/.+/ }, { id:'draw', title:/REPARTIR LOS PIBES/i },
  { id:'kits', title:/DISEÑÁ TU KIT/i }, { id:'rival', title:/NOSOTROS VS\. ELLOS/i },
  { id:'share', title:/MANDÁ LA ALINEACIÓN/i }, { id:'coach', title:/PLANTEL Y EVOLUCIÓN/i },
  { id:'league', title:/.+/ }, { id:'settings', title:/TU FUTBOLCLUB/i },
];

test.beforeEach(async ({ page }) => {
  await page.route('**/src/local-config.js', route => route.fulfill({ body:'window.RESET_ON_BOOT=false;', contentType:'text/javascript' }));
  await page.goto('/futbolClub.html');
  await page.waitForSelector('.nav-item');
});

test('sidebar muestra las 10 secciones', async ({ page }) => {
  await expect(page.locator('.nav-item')).toHaveCount(10);
});

for (const p of PAGES) test(`navega a ${p.id} y monta contenido`, async ({ page }) => {
  await page.click(`[data-page="${p.id}"]`);
  await expect(page.locator(`#page-${p.id}`)).toHaveClass(/active/);
  await expect(page.locator(`#page-${p.id}`)).toContainText(p.title);
});

test('editor guarda y recupera alineación completa', async ({ page }) => {
  await page.click('[data-page="editor"]');
  await page.locator('#page-editor .editor-title-input').fill('Prueba persistencia');
  await page.getByRole('button', { name:'Auto-completar' }).click();
  await page.getByRole('button', { name:/Guardar/ }).click();
  const stored = await page.evaluate(() => window.db.load('teams', []).at(-1));
  expect(stored.assignedIds.filter(Boolean).length).toBeGreaterThan(0);
  await page.reload();
  await page.click('[data-page="home"]');
  await page.getByText('Prueba persistencia', { exact:true }).click();
  await expect.poll(() => page.evaluate(() => window.db.load('editor', null)?.assignedIds?.filter(Boolean).length || 0)).toBeGreaterThan(0);
});

test('sorteo balancea sin duplicar jugadores', async ({ page }) => {
  await page.click('[data-page="draw"]');
  await page.getByRole('button', { name:'Sortear todos' }).click();
  const state = await page.evaluate(() => window.db.load('draw', null));
  const assigned = Object.keys(state.assignments);
  expect(new Set(assigned).size).toBe(assigned.length);
  const counts = [0,0]; Object.values(state.assignments).forEach(team => counts[team]++);
  expect(Math.abs(counts[0]-counts[1])).toBeLessThanOrEqual(1);
});

test('backup exportable conserva datos y versión', async ({ page }) => {
  const backup = await page.evaluate(() => window.exportFutbolClubData());
  expect(backup.app).toBe('futbolClub');
  expect(backup.schemaVersion).toBeGreaterThanOrEqual(2);
});

test('snapshot compartible se decodifica', async ({ page }) => {
  const result = await page.evaluate(() => {
    const encoded = window.encodeLineupSnapshot({draft:{name:'Equipo',mode:5,assignedIds:[]},roster:[],match:{}});
    return window.decodeLineupSnapshot(encoded).draft.name;
  });
  expect(result).toBe('Equipo');
});

test('entrenador registra evaluación', async ({ page }) => {
  await page.click('[data-page="coach"]');
  await page.getByLabel('Qué hizo bien').fill('Buen pase');
  await page.getByRole('button', { name:'Guardar evaluación' }).click();
  const evaluations = await page.evaluate(() => window.db.load('evaluations', []));
  expect(evaluations).toHaveLength(1);
});

test('liga calcula tabla desde un resultado', async ({ page }) => {
  await page.click('[data-page="league"]');
  await page.getByLabel('Local', { exact:true }).fill('A'); await page.getByLabel('Visitante', { exact:true }).fill('B');
  await page.getByLabel('Goles local').fill('2'); await page.getByLabel('Goles visitante').fill('1');
  await page.getByRole('button', { name:'Guardar partido' }).click();
  await expect(page.locator('.standings tbody tr').first()).toContainText('A');
  await expect(page.locator('.standings tbody tr').first()).toContainText('3');
});
