import {
  CATEGORY_INFO,
  DEFAULT_ROUNDS,
  PLAYER_COLORS,
  SCHEMA_VERSION,
  START_CHIPS,
  type Category,
  type ChipValue,
  type GameMode,
  type GameState,
  type Group,
  type Player,
  type Result,
  type Round,
} from './types';

export interface NewPlayerInput {
  name: string;
}

export type GameAction =
  | {
      type: 'NEW_GAME';
      players: NewPlayerInput[];
      mode: GameMode;
      totalRounds?: number;
    }
  /** Modus "cards": Kategorie der physischen Karte wählen. */
  | { type: 'SET_CATEGORY'; category: Category }
  /** Modus "prepared": gezogene Challenge übernehmen. */
  | { type: 'SET_CHALLENGE'; challengeId: string; category: Category }
  /** Challenge verwerfen, um neu zu ziehen. */
  | { type: 'CLEAR_CHALLENGE' }
  | { type: 'CONFIRM_CHALLENGE' }
  | { type: 'SET_GROUPS'; groups: Group[] }
  | { type: 'CONFIRM_GROUPS' }
  | { type: 'PLACE_BET'; playerId: string; chip: ChipValue }
  | { type: 'CLEAR_BET'; playerId: string }
  | { type: 'CONFIRM_BETS' }
  /** Joker schließt sich nachträglich einer Gruppe an. */
  | { type: 'ASSIGN_JOKER'; groupId: string }
  | { type: 'SET_RESULT'; playerId: string; result: Result }
  /** Ergebnis für eine ganze Gruppe (Zweigespann). */
  | { type: 'SET_GROUP_RESULT'; groupId: string; result: Result }
  /** Sieger eines Duells; `winnerId === null` bedeutet: keiner hat es geschafft. */
  | { type: 'SET_DUEL_WINNER'; groupId: string; winnerId: string | null }
  | { type: 'FINISH_ROUND' }
  | { type: 'ABANDON_GAME' };

let idCounter = 0;
/** Kurze, im Spielverlauf eindeutige ID. */
export function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

function createRound(index: number, starterId: string): Round {
  return {
    index,
    starterId,
    category: null,
    challengeId: null,
    groups: [],
    jokerId: null,
    bets: {},
    results: {},
    phase: 'challenge',
  };
}

export function createGame(
  players: NewPlayerInput[],
  mode: GameMode,
  totalRounds: number = DEFAULT_ROUNDS,
): GameState {
  const built: Player[] = players.map((p, i) => ({
    id: nextId('p'),
    name: p.name.trim() || `Spieler ${i + 1}`,
    colorIndex: i % PLAYER_COLORS.length,
    chips: [...START_CHIPS],
    banked: 0,
    lost: 0,
  }));
  return {
    version: SCHEMA_VERSION,
    mode,
    players: built,
    totalRounds,
    rounds: [createRound(0, built[0].id)],
    current: 0,
    usedChallengeIds: [],
    finished: false,
  };
}

export function currentRound(state: GameState): Round {
  return state.rounds[state.current];
}

/** Spieler, die in dieser Runde noch keinen Chip gesetzt haben. */
export function playersWithoutBet(state: GameState): Player[] {
  const round = currentRound(state);
  return state.players.filter((p) => round.bets[p.id] === undefined);
}

/** Spieler, deren Rundenergebnis noch offen ist. */
export function playersWithoutResult(state: GameState): Player[] {
  const round = currentRound(state);
  return state.players.filter((p) => round.results[p.id] === undefined);
}

/** Prüft, ob eine Gruppierung vollständig ist: Paare + höchstens ein Joker. */
export function validateGroups(
  players: Player[],
  groups: Group[],
): { ok: true } | { ok: false; reason: string } {
  const seen = new Set<string>();
  for (const g of groups) {
    if (g.memberIds.length !== 2) {
      return { ok: false, reason: 'Jede Gruppe braucht genau zwei Spieler.' };
    }
    for (const id of g.memberIds) {
      if (seen.has(id)) {
        return { ok: false, reason: 'Ein Spieler ist mehrfach zugeordnet.' };
      }
      seen.add(id);
    }
  }
  const unassigned = players.filter((p) => !seen.has(p.id));
  if (unassigned.length > 1) {
    return { ok: false, reason: 'Es sind noch Spieler ohne Paar.' };
  }
  return { ok: true };
}

function jokerFromGroups(players: Player[], groups: Group[]): string | null {
  const seen = new Set(groups.flatMap((g) => g.memberIds));
  const rest = players.filter((p) => !seen.has(p.id));
  return rest.length === 1 ? rest[0].id : null;
}

/** Bildet zufällige Paare; bei ungerader Spielerzahl bleibt einer als Joker übrig. */
export function autoPairs(players: Player[], random: () => number = Math.random): Group[] {
  const shuffled = [...players];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const groups: Group[] = [];
  for (let i = 0; i + 1 < shuffled.length; i += 2) {
    groups.push({ id: nextId('g'), memberIds: [shuffled[i].id, shuffled[i + 1].id] });
  }
  return groups;
}

function withRound(state: GameState, round: Round): GameState {
  const rounds = [...state.rounds];
  rounds[state.current] = round;
  return { ...state, rounds };
}

/** Entfernt genau ein Exemplar von `chip` aus der Chipliste. */
function removeChip(chips: ChipValue[], chip: ChipValue): ChipValue[] {
  const i = chips.indexOf(chip);
  if (i === -1) return chips;
  return [...chips.slice(0, i), ...chips.slice(i + 1)];
}

function nextPhaseAfterChallenge(category: Category): 'groups' | 'betting' {
  return CATEGORY_INFO[category].needsGroups ? 'groups' : 'betting';
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (action.type === 'NEW_GAME') {
    return createGame(action.players, action.mode, action.totalRounds);
  }
  if (state.finished) return state;

  const round = currentRound(state);

  switch (action.type) {
    case 'SET_CATEGORY':
      if (round.phase !== 'challenge') return state;
      return withRound(state, { ...round, category: action.category, challengeId: null });

    case 'SET_CHALLENGE': {
      if (round.phase !== 'challenge') return state;
      // Eine zuvor gezogene, aber verworfene Challenge wird wieder freigegeben.
      const used = state.usedChallengeIds.filter((id) => id !== round.challengeId);
      if (!used.includes(action.challengeId)) used.push(action.challengeId);
      return {
        ...withRound(state, {
          ...round,
          challengeId: action.challengeId,
          category: action.category,
        }),
        usedChallengeIds: used,
      };
    }

    case 'CLEAR_CHALLENGE':
      if (round.phase !== 'challenge') return state;
      return {
        ...withRound(state, { ...round, challengeId: null, category: null }),
        usedChallengeIds: state.usedChallengeIds.filter((id) => id !== round.challengeId),
      };

    case 'CONFIRM_CHALLENGE': {
      if (round.phase !== 'challenge' || !round.category) return state;
      return withRound(state, { ...round, phase: nextPhaseAfterChallenge(round.category) });
    }

    case 'SET_GROUPS': {
      if (round.phase !== 'groups') return state;
      return withRound(state, {
        ...round,
        groups: action.groups,
        jokerId: jokerFromGroups(state.players, action.groups),
      });
    }

    case 'CONFIRM_GROUPS': {
      if (round.phase !== 'groups') return state;
      if (!validateGroups(state.players, round.groups).ok) return state;
      return withRound(state, { ...round, phase: 'betting' });
    }

    case 'PLACE_BET': {
      if (round.phase !== 'betting') return state;
      const player = state.players.find((p) => p.id === action.playerId);
      if (!player || !player.chips.includes(action.chip)) return state;
      return withRound(state, {
        ...round,
        bets: { ...round.bets, [action.playerId]: action.chip },
      });
    }

    case 'CLEAR_BET': {
      if (round.phase !== 'betting') return state;
      const bets = { ...round.bets };
      delete bets[action.playerId];
      return withRound(state, { ...round, bets });
    }

    case 'CONFIRM_BETS': {
      if (round.phase !== 'betting') return state;
      if (playersWithoutBet(state).length > 0) return state;
      // Der Joker setzt vorher und wählt seine Gruppe erst danach.
      return withRound(state, { ...round, phase: round.jokerId ? 'joker' : 'resolve' });
    }

    case 'ASSIGN_JOKER': {
      if (round.phase !== 'joker' || !round.jokerId) return state;
      const target = round.groups.find((g) => g.id === action.groupId);
      if (!target) return state;
      const jokerId = round.jokerId;
      const groups = round.groups.map((g) =>
        g.id === action.groupId ? { ...g, memberIds: [...g.memberIds, jokerId] } : g,
      );
      return withRound(state, { ...round, groups, jokerId: null, phase: 'resolve' });
    }

    case 'SET_RESULT': {
      if (round.phase !== 'resolve') return state;
      return withRound(state, {
        ...round,
        results: { ...round.results, [action.playerId]: action.result },
      });
    }

    case 'SET_GROUP_RESULT': {
      if (round.phase !== 'resolve') return state;
      const group = round.groups.find((g) => g.id === action.groupId);
      if (!group) return state;
      const results = { ...round.results };
      for (const id of group.memberIds) results[id] = action.result;
      return withRound(state, { ...round, results });
    }

    case 'SET_DUEL_WINNER': {
      if (round.phase !== 'resolve') return state;
      const group = round.groups.find((g) => g.id === action.groupId);
      if (!group) return state;
      if (action.winnerId !== null && !group.memberIds.includes(action.winnerId)) return state;
      const results = { ...round.results };
      for (const id of group.memberIds) {
        results[id] = id === action.winnerId ? 'success' : 'fail';
      }
      return withRound(state, { ...round, results });
    }

    case 'FINISH_ROUND': {
      if (round.phase !== 'resolve') return state;
      if (playersWithoutResult(state).length > 0) return state;

      const players = state.players.map((p) => {
        const chip = round.bets[p.id];
        if (chip === undefined) return p;
        const success = round.results[p.id] === 'success';
        return {
          ...p,
          chips: removeChip(p.chips, chip),
          banked: success ? p.banked + chip : p.banked,
          lost: success ? p.lost : p.lost + chip,
        };
      });

      const isLast = state.current + 1 >= state.totalRounds;
      if (isLast) {
        return { ...state, players, finished: true };
      }
      const nextIndex = state.current + 1;
      const starter = state.players[nextIndex % state.players.length];
      return {
        ...state,
        players,
        rounds: [...state.rounds, createRound(nextIndex, starter.id)],
        current: nextIndex,
      };
    }

    case 'ABANDON_GAME':
      return { ...state, finished: true };

    default:
      return state;
  }
}
