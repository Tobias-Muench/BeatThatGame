import type { Category, Challenge } from '../game/types';

/*
 * ============================================================================
 *  HIER TRAEGST DU DEINE CHALLENGES EIN
 * ============================================================================
 *
 * Diese Datei ist das Gerüst für den Modus "Vorbereitet". Die unten
 * stehenden Einträge sind PLATZHALTER, damit der Modus sofort läuft -
 * ersetze sie durch die Texte deiner Karten und hänge beliebig viele
 * weitere an.
 *
 * Aufbau eines Eintrags:
 *
 *   {
 *     id:          'solo-01',              // eindeutig, frei wählbar
 *     category:    'SOLO',                 // SOLO | MEISTERSCHAFT | ZWEIGESPANN | DUELL
 *     title:       'Becherturm',           // kurze Überschrift
 *     text:        'Baue einen Turm ...',  // der Text, der vorgelesen wird
 *     timeLimitSec: 30,                    // optional: Zeitlimit in Sekunden
 *     material:    ['10 Becher'],          // optional: benötigtes Material
 *   }
 *
 * Die Kategorien bedeuten:
 *   SOLO          - jeder Spieler wagt die Challenge alleine
 *   MEISTERSCHAFT - alle treten gegeneinander an, die Besten kassieren
 *   ZWEIGESPANN   - Paare arbeiten zusammen, das Ergebnis gilt für beide
 *   DUELL         - Paare treten Kopf an Kopf an, pro Paar gewinnt einer
 *
 * Tipp: Es muss nicht in jeder Kategorie gleich viele geben. Die App zieht
 * pro Runde zufällig aus allen noch nicht gespielten Challenges, optional
 * gefiltert auf eine Kategorie.
 * ============================================================================
 */

export const challenges: Challenge[] = [
  {
    id: 'solo-01',
    category: 'SOLO',
    title: 'Schwimmnudel-Balance',
    text:
      'Halte eine Schwimmnudel unterhalb der Markierung am einen Ende. ' +
      'Lege die zweite Schwimmnudel unterhalb der zweiten Markierung am anderen Ende quer darauf. ' +
      'Balanciere sie einmal um den Pool herum. ' +
      'Du hast nur einen Versuch: Fällt die Schwimmnudel runter, ist die Challenge nicht geschafft.',
    material: ['2 Schwimmnudeln'],
  },
  {
    id: 'solo-02',
    category: 'SOLO',
    title: 'PLATZHALTER Solo 2',
    text: 'Hier den Text deiner Solo-Karte eintragen.',
    timeLimitSec: 60,
  },
  {
    id: 'meisterschaft-01',
    category: 'MEISTERSCHAFT',
    title: 'PLATZHALTER Meisterschaft 1',
    text: 'Hier den Text deiner Meisterschafts-Karte eintragen.',
    timeLimitSec: 45,
    material: ['Ball'],
  },
  {
    id: 'meisterschaft-02',
    category: 'MEISTERSCHAFT',
    title: 'PLATZHALTER Meisterschaft 2',
    text: 'Hier den Text deiner Meisterschafts-Karte eintragen.',
  },
  {
    id: 'zweigespann-01',
    category: 'ZWEIGESPANN',
    title: 'PLATZHALTER Zweigespann 1',
    text: 'Hier den Text deiner Zweigespann-Karte eintragen.',
    timeLimitSec: 60,
    material: ['Essstäbchen'],
  },
  {
    id: 'zweigespann-02',
    category: 'ZWEIGESPANN',
    title: 'PLATZHALTER Zweigespann 2',
    text: 'Hier den Text deiner Zweigespann-Karte eintragen.',
  },
  {
    id: 'duell-01',
    category: 'DUELL',
    title: 'Fliesen-Ditschen',
    text:
      'Stellt euch mit je einem Tischtennisball in die beiden Ecken am Kopfende des Pools. ' +
      'Ditscht den Ball so über die Poolfliesen, dass er möglichst viele Fliesen berührt. ' +
      'Eine Fliese zählt nur, wenn der Ball genau einmal darauf aufkommt: Trifft er sie ein zweites Mal, zählt sie nicht. ' +
      'Jeder hat drei Durchgänge, die berührten Fliesen aus allen drei Durchgängen werden addiert. ' +
      'Gewonnen hat, wer am Ende auf die meisten Fliesen kommt.',
    material: ['2 Tischtennisbälle'],
  },
  {
    id: 'duell-02',
    category: 'DUELL',
    title: 'PLATZHALTER Duell 2',
    text: 'Hier den Text deiner Duell-Karte eintragen.',
    material: ['Maßband'],
  },
];

/** Meldet doppelte IDs oder leere Texte in der Konsole - hilft beim Nachtragen. */
export function validateChallenges(list: Challenge[] = challenges): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const c of list) {
    if (seen.has(c.id)) problems.push(`Doppelte Challenge-ID: ${c.id}`);
    seen.add(c.id);
    if (!c.text.trim()) problems.push(`Challenge ${c.id} hat keinen Text.`);
    if (!c.title.trim()) problems.push(`Challenge ${c.id} hat keinen Titel.`);
  }
  return problems;
}

/** Alle noch nicht in diesem Spiel gezogenen Challenges. */
export function availableChallenges(
  usedIds: string[],
  category: Category | null = null,
  list: Challenge[] = challenges,
): Challenge[] {
  const used = new Set(usedIds);
  return list.filter((c) => !used.has(c.id) && (category === null || c.category === category));
}

/**
 * Zieht eine zufällige, noch ungespielte Challenge.
 * Sind in der gewünschten Kategorie alle verbraucht, wird null geliefert.
 */
export function drawChallenge(
  usedIds: string[],
  category: Category | null = null,
  list: Challenge[] = challenges,
  random: () => number = Math.random,
): Challenge | null {
  const pool = availableChallenges(usedIds, category, list);
  if (pool.length === 0) return null;
  return pool[Math.floor(random() * pool.length)];
}

export function challengeById(id: string, list: Challenge[] = challenges): Challenge | undefined {
  return list.find((c) => c.id === id);
}
