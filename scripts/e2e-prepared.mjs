// Kompletter Spieldurchlauf mit 5 Spielern (ungerade -> Joker) im Modus "Vorbereitet".
// Die App zieht Challenges jetzt selbst zufaellig (keine Kategoriewahl mehr) und
// wuerfelt beim Start auch die Spielerreihenfolge aus - die Kategorie pro Runde
// und die Startspieler-Reihenfolge sind also nicht mehr vorhersagbar und werden
// hier aus der Seite ausgelesen statt vorab festgelegt.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = process.env.APP_URL ?? 'http://localhost:5180/';
const SHOTS = process.env.SHOT_DIR ?? '/tmp/shots';
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

const problems = [];
page.on('console', (m) => {
  if (m.type() === 'error') problems.push(`console.error: ${m.text()}`);
});
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));

let step = 0;
async function shot(name) {
  step += 1;
  await page.screenshot({ path: `${SHOTS}/${String(step).padStart(2, '0')}-${name}.png` });
}

/** Meldet, wenn der Seiteninhalt breiter ist als das Fenster. */
async function checkNoHorizontalScroll(where) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 1) problems.push(`Horizontaler Ueberlauf (${overflow}px) bei: ${where}`);
}

const btn = (name) => page.getByRole('button', { name, exact: false });

async function click(name) {
  const target = btn(name).first();
  await target.waitFor({ state: 'visible', timeout: 5000 });
  await target.click();
}

await page.goto(URL);
await page.waitForSelector('.brand h1');
await shot('start');
await checkNoHorizontalScroll('Startbildschirm');

// ---------------------------------------------------------------- Setup
await click('Neues Spiel');
await page.waitForSelector('.setup-grid');
const NAMES = ['Anna', 'Ben', 'Cem', 'Dana', 'Eli'];
for (let i = 0; i < NAMES.length; i++) {
  if (i >= 2) await click('Spieler hinzufügen');
  await page.getByLabel(`Name Spieler ${i + 1}`).fill(NAMES[i]);
}
await click('Vorbereitet in der App');
await shot('setup');
await checkNoHorizontalScroll('Setup');
await click('Spiel starten');
await page.waitForSelector('.topbar-round');

// ---------------------------------------------------------------- Runden
const TOTAL_ROUNDS = 10;
const starters = [];
let groupsShotDone = false;

for (let round = 0; round < TOTAL_ROUNDS; round++) {
  // Ab Runde 2 blendet die App automatisch die Uebersicht mit dem
  // Zwischenstand ein - erst schliessen, dann geht es weiter.
  if (round > 0) {
    await page.waitForSelector('.overlay-panel');
    if (round === 1) {
      await shot('auto-uebersicht');
      await checkNoHorizontalScroll('Automatische Übersicht');
    }
    await page.locator('.overlay-head button', { hasText: 'Schließen' }).click();
    await page.waitForSelector('.overlay-panel', { state: 'detached' });
  }

  const heading = await page.locator('.topbar-round').innerText();
  if (!heading.includes(`Runde ${round + 1}`)) {
    problems.push(`Erwartet "Runde ${round + 1}", angezeigt: "${heading.replace(/\n/g, ' ')}"`);
  }
  starters.push(await page.locator('.topbar-starter .name').innerText());

  // Challenge wird automatisch gezogen - keine Kategoriewahl mehr.
  await page.waitForSelector('.challenge-card');
  if (round === 0) {
    await shot('challenge-gezogen');
    await checkNoHorizontalScroll('Challenge');
    // "Neu ziehen" einmal durchspielen, bevor die Kategorie fuer die Runde
    // final abgelesen wird.
    await click('Neu ziehen');
    await page.waitForSelector('.challenge-card');
  }
  // '.cc-cat' wird per CSS grossgeschrieben - innerText() liefert genau das.
  const catLabel = (await page.locator('.cc-cat').innerText()).split(' - ')[0].trim();
  const needsGroups = catLabel === 'DUELL' || catLabel === 'ZWEIGESPANN';
  await click('Weiter');

  // Paare bilden, falls die Kategorie es verlangt.
  if (needsGroups) {
    await page.waitForSelector('.pool-grid');
    await click('Zufällig zuteilen');
    await page.waitForSelector('.joker-note');
    if (!groupsShotDone) {
      await shot('paare-mit-joker');
      await checkNoHorizontalScroll('Paare');
    }
    await click('Weiter zu den Einsätzen');
  }

  // Alle setzen einen Chip - immer den ersten verfuegbaren.
  await page.waitForSelector('.player-card');
  const cards = page.locator('.player-card');
  const count = await cards.count();
  if (count !== NAMES.length) problems.push(`Runde ${round + 1}: ${count} Spielerkarten statt 5`);
  for (let i = 0; i < count; i++) {
    await cards.nth(i).locator('.chip').first().click();
  }
  if (round === 0) {
    await shot('einsaetze');
    await checkNoHorizontalScroll('Einsätze');
  }
  // Einsaetze liegen verdeckt - erst aufdecken, dann bestaetigen.
  await click('Einsätze aufdecken');
  await click('Einsätze bestätigen');

  // Auswertung.
  await page.waitForSelector('.result-btn');
  if (catLabel === 'SOLO' || catLabel === 'MEISTERSCHAFT') {
    const resolveCards = page.locator('.player-card');
    const n = await resolveCards.count();
    for (let i = 0; i < n; i++) {
      // Abwechselnd geschafft / nicht geschafft.
      await resolveCards.nth(i).locator(i % 2 === 0 ? '.result-btn.ok' : '.result-btn.no').click();
    }
  } else if (catLabel === 'ZWEIGESPANN') {
    const groups = page.locator('.group-card');
    const n = await groups.count();
    for (let i = 0; i < n; i++) {
      await groups.nth(i).locator(i === 0 ? '.result-btn.ok' : '.result-btn.no').click();
    }
  } else {
    // Duell: pro Gruppe den ersten Spieler gewinnen lassen.
    const groups = page.locator('.group-card');
    const n = await groups.count();
    for (let i = 0; i < n; i++) {
      await groups.nth(i).locator('.result-btn.ok').first().click();
    }
  }

  // Bei 5 Spielern bleibt in Duell/Zweigespann ein Joker uebrig: Er waehlt
  // erst, nachdem beide Paare entschieden haben, eine Person fuer eine
  // zweite Runde - deren erstes Ergebnis zaehlt danach nicht mehr.
  if (needsGroups) {
    await page.waitForSelector('.joker-pick .pool-player');
    if (!groupsShotDone) {
      await shot('joker-waehlt');
      await checkNoHorizontalScroll('Joker-Partnerwahl');
      groupsShotDone = true;
    }
    await page.locator('.joker-pick .pool-player').first().click();
    await page.waitForSelector('.group-card--joker .result-btn');
    await page.locator('.group-card--joker .result-btn.ok').first().click();
  }

  if (round === 0) {
    await shot('auswertung');
    await checkNoHorizontalScroll('Auswertung');
  }

  // Uebersicht per Knopf zwischendurch pruefen (unabhaengig vom Auto-Einblenden).
  if (round === 2) {
    await click('Übersicht');
    await page.waitForSelector('.overlay-panel');
    await shot('uebersicht');
    await checkNoHorizontalScroll('Übersicht');
    const rows = await page.locator('.standing-row').count();
    if (rows !== NAMES.length) problems.push(`Übersicht zeigt ${rows} Zeilen statt 5`);
    const logRounds = await page.locator('.log-round').count();
    if (logRounds !== round) problems.push(`Protokoll zeigt ${logRounds} Runden statt ${round}`);
    await page.locator('.overlay-head button').click();
    await page.waitForSelector('.overlay-panel', { state: 'detached' });
  }

  await click(round === TOTAL_ROUNDS - 1 ? 'Spiel auswerten' : 'Runde abschließen');
}

// Startspieler-Rotation ist unabhaengig von der (jetzt gewuerfelten) Reihenfolge
// pruefbar: Sie muss sich nach genau NAMES.length Runden wiederholen, und
// innerhalb eines vollen Zyklus muss jeder einmal drankommen.
for (let i = 0; i + NAMES.length < starters.length; i++) {
  if (starters[i] !== starters[i + NAMES.length]) {
    problems.push(
      `Startspieler-Rotation bricht: Runde ${i + 1} war ${starters[i]}, Runde ${i + 1 + NAMES.length} war ${starters[i + NAMES.length]}`,
    );
  }
}
const firstCycle = new Set(starters.slice(0, NAMES.length));
if (firstCycle.size !== NAMES.length) {
  problems.push(`Erste ${NAMES.length} Runden zeigen nicht alle Spieler als Startspieler: ${[...firstCycle]}`);
}

// ---------------------------------------------------------------- Endstand
await page.waitForSelector('.podium h1');
await shot('endstand');
await checkNoHorizontalScroll('Endstand');
const champion = await page.locator('.podium h1').innerText();

// Punkte gegen das Rundenprotokoll gegenrechnen.
await click('Rundenprotokoll');
await page.waitForSelector('.overlay-panel');
const logged = await page.locator('.log-round').count();
if (logged !== TOTAL_ROUNDS) problems.push(`Protokoll zeigt ${logged} Runden statt ${TOTAL_ROUNDS}`);
await shot('protokoll');
await page.locator('.overlay-head button').click();
await page.waitForSelector('.overlay-panel', { state: 'detached' });

// ---------------------------------------------------------------- Spielstand ueberlebt Reload
const standingsBefore = await page.locator('.standing-row').allInnerTexts();
await page.reload();
await page.waitForSelector('.brand h1');
if ((await btn('Spiel fortsetzen').count()) === 0) {
  problems.push('Nach dem Neuladen fehlt der Knopf "Spiel fortsetzen".');
} else {
  await click('Spiel fortsetzen');
  await page.waitForSelector('.podium h1');
  const championAfter = await page.locator('.podium h1').innerText();
  if (championAfter !== champion) {
    problems.push(`Nach dem Fortsetzen anderer Sieger: "${championAfter}" statt "${champion}"`);
  }
  const standingsAfter = await page.locator('.standing-row').allInnerTexts();
  if (JSON.stringify(standingsAfter) !== JSON.stringify(standingsBefore)) {
    problems.push('Punktestand nach dem Fortsetzen weicht ab.');
  }
}

// Touch-Ziele pruefen.
const tooSmall = await page.evaluate(() =>
  [...document.querySelectorAll('button')]
    .map((b) => ({ t: b.innerText.trim().slice(0, 24), h: Math.round(b.getBoundingClientRect().height) }))
    .filter((b) => b.h > 0 && b.h < 44),
);
if (tooSmall.length) problems.push(`Zu kleine Touch-Ziele: ${JSON.stringify(tooSmall)}`);

await browser.close();

console.log(`\nSieger laut Endstand: ${champion.replace(/\n/g, ' ')}`);
if (problems.length === 0) {
  console.log('\n✅ Durchlauf ohne Beanstandung.');
} else {
  console.log(`\n❌ ${problems.length} Problem(e):`);
  for (const p of problems) console.log(`   - ${p}`);
  process.exitCode = 1;
}
