import { SCHEMA_VERSION, type GameState } from './types';

const GAME_KEY = 'beatthat.game.v1';
const ROSTER_KEY = 'beatthat.roster.v1';

/** Laufendes Spiel laden; bei fremdem/kaputtem Inhalt null. */
export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(GAME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (parsed?.version !== SCHEMA_VERSION) return null;
    if (!Array.isArray(parsed.players) || parsed.players.length === 0) return null;
    if (!Array.isArray(parsed.rounds) || parsed.rounds.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveGame(state: GameState | null): void {
  try {
    if (state === null) localStorage.removeItem(GAME_KEY);
    else localStorage.setItem(GAME_KEY, JSON.stringify(state));
  } catch {
    // Speicher voll oder gesperrt - das Spiel läuft trotzdem weiter.
  }
}

/** Zuletzt verwendete Spielernamen, damit das nächste Spiel schneller startet. */
export function loadRoster(): string[] {
  try {
    const raw = localStorage.getItem(ROSTER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n): n is string => typeof n === 'string');
  } catch {
    return [];
  }
}

export function saveRoster(names: string[]): void {
  try {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(names));
  } catch {
    // ignorieren
  }
}
