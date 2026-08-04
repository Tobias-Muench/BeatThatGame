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
    title: 'Donut-Treffer',
    text:
      'Nimm den kleinen aufblasbaren Donutreifen und einen Tischtennisball und geh hoch auf die Empore des Gartenhäuschens. ' +
      'Wirf zuerst den Donut in den Pool, er muss im Wasser landen. ' +
      'Wirf danach den Tischtennisball in den Donut hinein. ' +
      'Du hast nur einen Versuch: Triffst du hinein, ist die Challenge geschafft, sonst gibt es keine Punkte.',
    material: ['Aufblasbarer Donutreifen', 'Tischtennisball'],
  },
  {
    id: 'solo-03',
    category: 'SOLO',
    title: 'Dosenturm',
    text:
      'Stapel die roten Dosen in einer Minute zu einem Turm. ' +
      'Fällt er um, darfst du weiterbauen. ' +
      'Klärt vorher gemeinsam in der Runde, ob sieben Dosen gelten (bei schwachem Wind) oder sechs (bei stärkerem Wind). ' +
      'Am Ende müssen so viele Dosen aufeinander stehen und drei Sekunden als Turm stehen bleiben. Nur dann ist die Challenge geschafft.',
    timeLimitSec: 60,
    material: ['7 rote Dosen'],
  },
  {
    id: 'meisterschaft-01',
    category: 'MEISTERSCHAFT',
    title: 'Königs-Wurf',
    text:
      'Stellt den König, einen großen Holzklotz, in die Mitte der unteren Wiese. ' +
      'Jeder bekommt einen kleinen Holzklotz und stellt sich mit sechs Metern Abstand im Kreis um den König auf. ' +
      'Reihum wirft jeder seinen Klotz Richtung König. ' +
      'Den König zu berühren ist erlaubt, wer ihn umwirft, ist für diese Runde raus. ' +
      'Gewonnen hat, wessen Klotz am nächsten am König liegt. Liegen mehrere gleich nah dran, gewinnen sie gemeinsam.',
    material: ['Großer Holzklotz (König)', 'Kleiner Holzklotz pro Spieler'],
  },
  {
    id: 'meisterschaft-02',
    category: 'MEISTERSCHAFT',
    title: 'Poolnudel-Weitwurf',
    text:
      'Stellt euch alle oben auf die Poolplattform. ' +
      'Reihum wirft jeder die Poolnudel von dort hinunter auf die untere Wiese. ' +
      'Der jeweils weiteste Wurf wird auf der Wiese mit der Markierung festgehalten, dann ist der nächste dran. ' +
      'Gewonnen hat, wer am weitesten kommt.',
    material: ['Poolnudel', 'Markierung'],
  },
  {
    id: 'zweigespann-01',
    category: 'ZWEIGESPANN',
    title: 'Blind-Navigation',
    text:
      'Einigt euch im Team: Einer stellt sich oben auf die Plattform des Pools und navigiert, der andere sammelt. ' +
      'Der Sammler stellt sich unten an der Wiese auf und bekommt die Augen verbunden. ' +
      'Auf der unteren Wiese liegen vier Holzklötzchen, die er blind einsammeln muss, die Reihenfolge ist egal. ' +
      'Er sieht nichts und darf sich nur auf die Ansagen des Navigators verlassen. ' +
      'Gewonnen hat das Team, das die vier Klötzchen am schnellsten zusammen hat.',
    material: ['4 Holzklötzchen', 'Augenbinde'],
  },
  {
    id: 'zweigespann-02',
    category: 'ZWEIGESPANN',
    title: 'Regenbogen-Rückprall',
    text:
      'Bestimmt in eurem Team einen Werfer und ein Brett. ' +
      'Der Werfer nimmt einen kleinen Softshellball und stellt sich ans Ende des Pools. ' +
      'Das Brett geht mit dem Regenbogenbrett in der Hand in den Pool und stellt sich in die Mitte. ' +
      'Der Werfer wirft den Ball Richtung Brett, das ihn mit dem Regenbogenbrett zurückprallen lässt, und fängt ihn wieder. ' +
      'Ihr habt nur einen Versuch: Klappt es, ist die Challenge geschafft, sonst gibt es keine Punkte.',
    material: ['Kleiner Softshellball', 'Regenbogenbrett'],
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
    title: 'Wet-T-Shirt-Contest',
    text:
      'Das Zufallsrad bestimmt vor eurem Duell das Zielgewicht. ' +
      'Jeder bekommt ein T-Shirt, das im trockenen Zustand 130 Gramm wiegt. ' +
      'Haltet es in den Pool und lasst es sich mit Wasser vollsaugen, überschüssiges Wasser könnt ihr wieder auswringen. ' +
      'Legt das T-Shirt anschließend auf die Waage: Gewonnen hat, wer mit dem Gesamtgewicht am nächsten am ausgelosten Zielgewicht liegt.',
    material: ['T-Shirt pro Spieler (130 g)', '2 Eimer', 'Waage'],
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
