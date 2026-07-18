import { test } from '@playwright/test';

const SHOTS = [
  { id:'home', file:'01-home.png' },
  { id:'mode', file:'02-mode.png' },
  { id:'editor', file:'03-editor.png' },
  { id:'draw', file:'04-draw.png' },
  { id:'kits', file:'05-kits.png' },
  { id:'rival', file:'06-rival.png' },
  { id:'share', file:'07-share.png' },
  { id:'coach', file:'09-coach.png' },
  { id:'league', file:'10-league.png' },
  { id:'settings', file:'11-settings.png' },
];

test('captura screenshots de cada seccion', async ({ page }) => {
  await page.route('**/src/local-config.js', route => route.fulfill({ body:'window.RESET_ON_BOOT=false;', contentType:'text/javascript' }));
  await page.goto('/futbolClub.html');
  await page.waitForSelector('.nav-item');

  for (const shot of SHOTS) {
    await page.click(`[data-page="${shot.id}"]`);
    await page.waitForTimeout(250);
    await page.screenshot({ path:`screenshots/${shot.file}`, fullPage:true });
  }

  await page.click('[data-page="editor"]');
  await page.getByRole('button', { name:'Auto-completar' }).click();
  await page.screenshot({ path:'screenshots/03b-editor-autocompletado.png', fullPage:true });

  await page.click('[data-page="draw"]');
  await page.getByRole('button', { name:'Sortear todos' }).click();
  await page.screenshot({ path:'screenshots/04b-draw-sorteado.png', fullPage:true });

  await page.click('[data-page="home"]');
  await page.locator('#tweaks-fab').click();
  await page.screenshot({ path:'screenshots/08-tweaks.png', fullPage:true });
});