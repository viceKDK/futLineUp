import { test } from '@playwright/test';
import { shootFull, openSeededApp } from './helpers/screenshot-utils.js';

// Capturas a ancho de teléfono (390x844, iPhone 12/13/14 aprox.) de las pantallas
// clave — sobre todo las tres rediseñadas — para verificar el layout responsive.
const MOBILE_VIEWPORT = { width: 390, height: 844 };

const SHOTS = [
  { id:'home', file:'01-home.png' },
  { id:'coach', file:'09-coach.png' },
  { id:'league', file:'10-league.png' },
  { id:'settings', file:'11-settings.png' },
];

test('captura screenshots mobile de las secciones clave', async ({ page }) => {
  await page.setViewportSize(MOBILE_VIEWPORT);
  await openSeededApp(page);

  for (const shot of SHOTS) {
    await page.click(`[data-page="${shot.id}"]`);
    await page.waitForTimeout(250);
    await shootFull(page, `screenshots/mobile/${shot.file}`);
  }

  // Ficha del jugador (Entrenador)
  await page.click('[data-page="coach"]');
  await page.locator('.roster-overview-card').first().click();
  await page.waitForTimeout(250);
  await shootFull(page, 'screenshots/mobile/09b-coach-ficha.png');

  // Fixture por fecha (Liga amateur)
  await page.click('[data-page="league"]');
  await page.getByRole('button', { name:'Fixture' }).click();
  await page.waitForTimeout(250);
  await shootFull(page, 'screenshots/mobile/10b-league-fixture.png');
});
