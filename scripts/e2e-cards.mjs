// Durchlauf im Modus "Karten am Tisch" mit 3 Spielern (ungerade -> Joker im Duell).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = process.env.APP_URL ?? 'http://localhost:5180/';
const SHOTS = process.env.SHOT_DIR ?? '/tmp/shots-cards';
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

const problems = [];
page.on('console', (m) => {
  if (m.type() === 'error') problems.push(`console.error: ${m.text()}`);
});
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));

const btn = (name) => page.getByRole('button', { name, exact: false });
async function click(name) {
  const t = btn(name).first();
  await t.waitFor({ state: 'visible', timeout: 5000 });
  await t.click();
}

await page.goto(URL);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('.brand h1');

await click('Neues Spiel');
await page.waitForSelector('.setup-grid');
const NAMES = ['Anna', 'Ben', 'Cem'];
for (let i = 0; i < NAMES.length; i++) {
  if (i >= 2) await click('Spieler hinzufügen');
  await page.getByLabel(`Name Spieler ${i + 1}`).fill(NAMES[i]);
}
await click('Karten am Tisch');
await page.getByRole('button', { name: '5', exact: true }).click();
await click('Spiel starten');
await page.waitForSelector('.topbar-round');

const PLAN = ['Solo', 'Duell', 'Meisterschaft', 'Zweigespann', 'Solo'];

for (let round = 0; round < 5; round++) {
  const category = PLAN[round];

  // Modus "Karten": nur die Kategorie antippen, kein Challenge-Text in der App.
  if (await page.locator('.challenge-card').count()) {
    problems.push(`Runde ${round + 1}: Im Karten-Modus wird eine Challenge angezeigt.`);
  }
  await page.locator('.category-tile .cat-name', { hasText: new RegExp(`^${category}$`) }).click();
  if (round === 0) await page.screenshot({ path: `${SHOTS}/01-kategorie.png` });
  await click('Weiter');

  const needsGroups = category === 'Duell' || category === 'Zweigespann';
  if (needsGroups) {
    await page.waitForSelector('.pool-grid');
    await click('Zufällig zuteilen');
    await click('Weiter zu den Einsätzen');
  }

  await page.waitForSelector('.player-card');
  const cards = page.locator('.player-card');
  const n = await cards.count();
  for (let i = 0; i < n; i++) await cards.nth(i).locator('.chip').first().click();
  await click('Einsätze aufdecken');
  await click('Einsätze bestätigen');

  if (needsGroups) {
    await page.waitForSelector('.group-card.is-selectable');
    await page.locator('.group-card.is-selectable').first().click();
  }

  await page.waitForSelector('.result-btn');
  if (needsGroups) {
    const groups = page.locator('.group-card');
    const g = await groups.count();
    for (let i = 0; i < g; i++) await groups.nth(i).locator('.result-btn.ok').first().click();
  } else {
    const rc = page.locator('.player-card');
    const c = await rc.count();
    for (let i = 0; i < c; i++) await rc.nth(i).locator('.result-btn.ok').click();
  }
  await click(round === 4 ? 'Spiel auswerten' : 'Runde abschließen');
}

await page.waitForSelector('.podium h1');
await page.screenshot({ path: `${SHOTS}/02-endstand.png` });

// Jeder setzt immer einen Einer-Chip. Vier Runden (Solo, Meisterschaft, Zweigespann,
// Solo) schaffen alle drei; im Duell gewinnt bei drei Spielern nur einer.
// Erwartung also: 5 / 4 / 4 Punkte und insgesamt 2 Punkte an die Bank.
const points = await page.locator('.standing-row .stat-value').allInnerTexts();
const banked = points.filter((_, i) => i % 2 === 0).map(Number);
if (JSON.stringify(banked) !== JSON.stringify([5, 4, 4])) {
  problems.push(`Erwartet [5,4,4] Punkte, gezählt: ${JSON.stringify(banked)}`);
}
const lostTexts = await page.locator('.standing-row .budget-cell .stat-label').allInnerTexts();
const lostSum = lostTexts.map((t) => Number(t.replace(/\D+/g, ''))).reduce((a, b) => a + b, 0);
if (lostSum !== 2) problems.push(`Erwartet 2 verlorene Punkte insgesamt, gezählt: ${lostSum}`);

await browser.close();
if (problems.length === 0) {
  console.log('✅ Karten-Modus ohne Beanstandung (5 / 4 / 4 Punkte, 2 an die Bank).');
} else {
  console.log(`❌ ${problems.length} Problem(e):`);
  for (const p of problems) console.log(`   - ${p}`);
  process.exitCode = 1;
}
