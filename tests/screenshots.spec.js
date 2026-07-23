import { test } from '@playwright/test';
import { shootFull, openSeededApp } from './helpers/screenshot-utils.js';

const SHOTS = [
  { id:'home', file:'01-home.png' },
  { id:'mode', file:'02-mode.png' },
  { id:'editor', file:'03-editor.png' },
  { id:'draw', file:'04-draw.png' },
  { id:'kits', file:'05-kits.png' },
  { id:'crests', file:'05b-crests.png' },
  { id:'rival', file:'06-rival.png' },
  { id:'share', file:'07-share.png' },
  { id:'coach', file:'09-coach.png' },
  { id:'league', file:'10-league.png' },
];

test('captura screenshots de cada seccion', async ({ page }, testInfo) => {
  // El proyecto "chromium" (Chrome) escribe en screenshots/ (galería canónica del README).
  // Otros navegadores (ej. msedge) escriben en screenshots/<navegador>/ para comparar
  // el render sin pisar las capturas de referencia.
  const dir = testInfo.project.name === 'chromium' ? 'screenshots' : `screenshots/${testInfo.project.name}`;

  await openSeededApp(page);

  for (const shot of SHOTS) {
    await page.click(`[data-page="${shot.id}"]`);
    await page.waitForTimeout(250);
    await shootFull(page, `${dir}/${shot.file}`);
  }

  await page.click('[data-page="editor"]');
  await page.getByRole('button', { name:'Auto-completar' }).click();
  await shootFull(page, `${dir}/03b-editor-autocompletado.png`);

  await page.click('[data-page="draw"]');
  await page.getByRole('button', { name:'Sortear todos' }).click();
  await shootFull(page, `${dir}/04b-draw-sorteado.png`);

  await page.click('[data-page="coach"]');
  await page.locator('.roster-overview-card').first().click();
  await page.waitForTimeout(250);
  await shootFull(page, `${dir}/09b-coach-ficha.png`);

  await page.click('[data-page="league"]');
  await page.getByRole('button', { name:'Fixture' }).click();
  await page.waitForTimeout(250);
  await shootFull(page, `${dir}/10b-league-fixture.png`);

  // Copa: cuadro eliminatorio con 4 equipos cargados.
  await page.getByRole('button', { name:'Copa' }).click();
  await page.waitForTimeout(200);
  const sizeBtn = page.locator('.cup-setup .seg button', { hasText: '4 equipos' });
  if (await sizeBtn.count()) {
    await sizeBtn.click();
    const names = ['Los Pibes FC', 'Deportivo Norte', 'La Amistad', 'Atlético Barrio'];
    const inputs = page.locator('.cup-setup-grid input');
    for (let i = 0; i < names.length; i++) await inputs.nth(i).fill(names[i]);
    await page.getByRole('button', { name: /Generar cuadro/ }).click();
    await page.waitForTimeout(250);
  }
  await shootFull(page, `${dir}/10c-league-cup.png`);

  // Escudos: editor de un equipo.
  await page.click('[data-page="crests"]');
  await page.waitForTimeout(200);
  const crestRow = page.locator('.crest-manager-row').first();
  if (await crestRow.count()) {
    await crestRow.click();
    await page.waitForTimeout(200);
    await shootFull(page, `${dir}/05c-crests-edit.png`);
  }

  await page.click('[data-page="home"]');
  await page.locator('#tweaks-fab').click();
  await shootFull(page, `${dir}/08-tweaks.png`);

  // Cuenta y datos: ahora se abre desde el ícono de perfil, no desde el menú.
  await page.locator('.sidebar-profile-btn').click();
  await page.waitForTimeout(200);
  await shootFull(page, `${dir}/11-settings.png`);

  // Login / registro: pantalla de bienvenida en la primera visita (sin hash).
  await page.evaluate(() => localStorage.removeItem('fc.v1.authIntroSeen'));
  await page.goto('/futbolClub.html');
  await page.waitForSelector('.auth-card');
  await shootFull(page, `${dir}/12-auth.png`);
});
