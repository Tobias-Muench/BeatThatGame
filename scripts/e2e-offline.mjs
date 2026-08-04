// Prüft, dass die PWA nach dem ersten Laden komplett ohne Netz funktioniert.
import { chromium } from 'playwright';

const URL = process.env.APP_URL ?? 'http://localhost:5180/';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const problems = [];

// Erster Besuch: Service Worker installieren lassen.
await page.goto(URL);
await page.waitForSelector('.brand h1');
await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
  timeout: 15000,
});

// Ein Spiel anlegen, damit auch der Spielstand geprüft wird.
await page.getByRole('button', { name: 'Neues Spiel' }).click();
await page.waitForSelector('.setup-grid');
await page.getByLabel('Name Spieler 1').fill('Anna');
await page.getByLabel('Name Spieler 2').fill('Ben');
await page.getByRole('button', { name: 'Spiel starten' }).click();
await page.waitForSelector('.category-tile');

// Netz kappen und neu laden - die App muss aus dem Cache kommen.
await context.setOffline(true);
await page.reload();
await page.waitForSelector('.brand h1', { timeout: 15000 });

if ((await page.getByRole('button', { name: 'Spiel fortsetzen' }).count()) === 0) {
  problems.push('Offline fehlt der gespeicherte Spielstand.');
} else {
  await page.getByRole('button', { name: 'Spiel fortsetzen' }).click();
  await page.waitForSelector('.category-tile');
  const round = await page.locator('.topbar-round').innerText();
  if (!round.includes('Runde 1')) problems.push(`Offline falsche Runde: ${round}`);
}

// Eine komplette Runde offline spielen.
await page.locator('.category-tile .cat-name', { hasText: /^Solo$/ }).click();
await page.getByRole('button', { name: 'Weiter' }).click();
const cards = page.locator('.player-card');
for (let i = 0; i < (await cards.count()); i++) {
  await cards.nth(i).locator('.chip').first().click();
}
await page.getByRole('button', { name: 'Einsätze aufdecken' }).click();
await page.getByRole('button', { name: 'Einsätze bestätigen' }).click();
for (let i = 0; i < (await cards.count()); i++) {
  await cards.nth(i).locator('.result-btn.ok').click();
}
await page.getByRole('button', { name: 'Runde abschließen' }).click();
await page.waitForFunction(() =>
  document.querySelector('.topbar-round')?.textContent?.includes('Runde 2'),
);

await browser.close();
if (problems.length === 0) {
  console.log('✅ Offline-Betrieb ohne Beanstandung (Reload, Spielstand und eine Runde).');
} else {
  console.log(`❌ ${problems.length} Problem(e):`);
  for (const p of problems) console.log(`   - ${p}`);
  process.exitCode = 1;
}
