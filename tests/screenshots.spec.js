import { test } from '@playwright/test';

const SHOTS = [
  { id: 'home',   file: '01-home.png' },
  { id: 'mode',   file: '02-mode.png' },
  { id: 'editor', file: '03-editor.png' },
  { id: 'draw',   file: '04-draw.png' },
  { id: 'kits',   file: '05-kits.png' },
  { id: 'rival',  file: '06-rival.png' },
  { id: 'share',  file: '07-share.png' },
];

test('captura screenshots de cada seccion', async ({ page }) => {
  await page.goto('/futbolClub.html');
  await page.waitForSelector('.nav-item');
  for (const s of SHOTS) {
    await page.click(`[data-page="${s.id}"]`);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `screenshots/${s.file}`, fullPage: true });
  }
});
