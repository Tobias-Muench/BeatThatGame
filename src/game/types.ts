/** Datenmodell für "Beat That!". */

/** Chip-Werte des Originalspiels. */
export type ChipValue = 1 | 3 | 5;

/** Startausstattung: 5x1 + 3x3 + 2x5 = 10 Chips = maximal 24 Punkte. */
export const START_CHIPS: readonly ChipValue[] = [1, 1, 1, 1, 1, 3, 3, 3, 5, 5];

/** Anzahl Runden eines vollständigen Spiels (= Anzahl Chips). */
export const DEFAULT_ROUNDS = 10;
export const MIN_ROUNDS = 5;
export const MAX_ROUNDS = START_CHIPS.length;

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 16;

/** Die vier Challenge-Kategorien des Spiels. */
export type Category = 'SOLO' | 'MEISTERSCHAFT' | 'ZWEIGESPANN' | 'DUELL';

export const CATEGORIES: readonly Category[] = [
  'SOLO',
  'MEISTERSCHAFT',
  'ZWEIGESPANN',
  'DUELL',
];

export interface CategoryInfo {
  label: string;
  short: string;
  description: string;
  /** Kategorien, in denen Paare gebildet werden. */
  needsGroups: boolean;
}

export const CATEGORY_INFO: Record<Category, CategoryInfo> = {
  SOLO: {
    label: 'Solo',
    short: 'Jeder für sich',
    description: 'Jeder Spieler wagt die Challenge alleine.',
    needsGroups: false,
  },
  MEISTERSCHAFT: {
    label: 'Meisterschaft',
    short: 'Alle gegeneinander',
    description: 'Alle treten gegeneinander an. Nur die Besten kassieren.',
    needsGroups: false,
  },
  ZWEIGESPANN: {
    label: 'Zweigespann',
    short: 'Paare gemeinsam',
    description: 'Zwei Spieler arbeiten zusammen. Das Ergebnis gilt für beide.',
    needsGroups: true,
  },
  DUELL: {
    label: 'Duell',
    short: 'Kopf an Kopf',
    description: 'Zwei Spieler treten gegeneinander an. Pro Paar gewinnt einer.',
    needsGroups: true,
  },
};

/** Modus 1: Challenges liegen als Karten auf dem Tisch. Modus 2: in der App hinterlegt. */
export type GameMode = 'cards' | 'prepared';

export interface Challenge {
  id: string;
  category: Category;
  title: string;
  text: string;
  /** Zeitlimit in Sekunden, falls die Challenge eines hat. */
  timeLimitSec?: number;
  /** Benötigtes Material, z. B. ["Becher", "Ball"]. */
  material?: string[];
}

export interface Player {
  id: string;
  name: string;
  /** Index in PLAYER_COLORS. */
  colorIndex: number;
  /** Noch nicht gesetzte Chips. */
  chips: ChipValue[];
  /** Bereits sicher gebankte Punkte. */
  banked: number;
  /** An die Bank verlorene Punkte. */
  lost: number;
}

/**
 * Paar. Nach der Joker-Zuordnung wird die abgegebene Person aus ihrer
 * ursprünglichen Gruppe entfernt (sie bleibt dann zu zweit statt zu dritt
 * zurück) und stattdessen einer neuen, als `isJoker` markierten Gruppe
 * zugeteilt, die den Joker mit der ausgewählten Person zusammenbringt.
 */
export interface Group {
  id: string;
  memberIds: string[];
  isJoker?: boolean;
}

export type Result = 'success' | 'fail';

export type RoundPhase =
  /** Kategorie wählen bzw. Challenge ziehen. */
  | 'challenge'
  /** Paare bilden (nur Zweigespann/Duell). */
  | 'groups'
  /** Alle Spieler setzen einen Chip. */
  | 'betting'
  /** Ergebnisse eintragen - hier wählt der Joker auch seinen Partner. */
  | 'resolve';

export interface Round {
  index: number;
  /** Spieler, der diese Runde eröffnet - rotiert reihum. */
  starterId: string;
  category: Category | null;
  challengeId: string | null;
  groups: Group[];
  /** Bei ungerader Spielerzahl der noch nicht zugeordnete Spieler. */
  jokerId: string | null;
  /** playerId -> gesetzter Chip. */
  bets: Record<string, ChipValue>;
  /** playerId -> Ergebnis. */
  results: Record<string, Result>;
  phase: RoundPhase;
}

export const SCHEMA_VERSION = 2;

export interface GameState {
  version: typeof SCHEMA_VERSION;
  mode: GameMode;
  players: Player[];
  totalRounds: number;
  /** Alle Runden inklusive der aktuell laufenden. */
  rounds: Round[];
  /** Index der laufenden Runde in `rounds`. */
  current: number;
  /** Bereits gezogene Challenges (Modus "prepared"). */
  usedChallengeIds: string[];
  finished: boolean;
}

export const PLAYER_COLORS = [
  '#ef6c1a',
  '#0f6bc8',
  '#e23c8e',
  '#1f95a6',
  '#8b4399',
  '#1c9d54',
  '#d0332f',
  '#c99000',
  '#35bde3',
  '#6d4de6',
  '#8a9a00',
  '#b5651d',
  '#00867d',
  '#ff7fa8',
  '#4a5b6b',
  '#7fbf3f',
] as const;
