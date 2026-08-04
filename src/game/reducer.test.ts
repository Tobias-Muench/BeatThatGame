import { describe, expect, it } from 'vitest';
import {
  autoPairs,
  createGame,
  currentRound,
  gameReducer,
  nextId,
  validateGroups,
  type GameAction,
} from './reducer';
import { maxPossible, remainingBudget, standings, winners } from './selectors';
import { DEFAULT_ROUNDS, START_CHIPS, type Category, type ChipValue, type GameState } from './types';

function run(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, state);
}

function newGame(count: number, rounds = DEFAULT_ROUNDS) {
  const names = ['Anna', 'Ben', 'Cem', 'Dana', 'Eli', 'Finn', 'Gina', 'Hans'].slice(0, count);
  return createGame(
    names.map((name) => ({ name })),
    'cards',
    rounds,
  );
}

/** Spielt eine komplette Runde in Kategorie SOLO/MEISTERSCHAFT durch. */
function playSimpleRound(
  state: GameState,
  category: Category,
  bets: ChipValue[],
  successes: boolean[],
): GameState {
  let s = run(state, { type: 'SET_CATEGORY', category }, { type: 'CONFIRM_CHALLENGE' });
  s.players.forEach((p, i) => {
    s = gameReducer(s, { type: 'PLACE_BET', playerId: p.id, chip: bets[i] });
  });
  s = gameReducer(s, { type: 'CONFIRM_BETS' });
  s.players.forEach((p, i) => {
    s = gameReducer(s, {
      type: 'SET_RESULT',
      playerId: p.id,
      result: successes[i] ? 'success' : 'fail',
    });
  });
  return gameReducer(s, { type: 'FINISH_ROUND' });
}

describe('Spielaufbau', () => {
  it('gibt jedem Spieler 5x1 + 3x3 + 2x5 Chips (24 Punkte)', () => {
    const state = newGame(4);
    for (const p of state.players) {
      expect(p.chips).toEqual([...START_CHIPS]);
      expect(remainingBudget(p)).toBe(24);
      expect(p.banked).toBe(0);
      expect(p.lost).toBe(0);
    }
  });

  it('startet mit Runde 1 in der Phase "challenge" und Spieler 1 als Startspieler', () => {
    const state = newGame(3);
    const round = currentRound(state);
    expect(round.index).toBe(0);
    expect(round.phase).toBe('challenge');
    expect(round.starterId).toBe(state.players[0].id);
  });

  it('vergibt eindeutige IDs', () => {
    const ids = new Set(Array.from({ length: 50 }, () => nextId('x')));
    expect(ids.size).toBe(50);
  });
});

describe('Einsätze und Wertung', () => {
  it('bankt bei Erfolg die Chippunkte und verliert sie bei Misserfolg', () => {
    const start = newGame(2);
    const after = playSimpleRound(start, 'SOLO', [5, 3], [true, false]);
    expect(after.players[0].banked).toBe(5);
    expect(after.players[0].lost).toBe(0);
    expect(after.players[1].banked).toBe(0);
    expect(after.players[1].lost).toBe(3);
  });

  it('entfernt den gesetzten Chip dauerhaft aus dem Vorrat', () => {
    const start = newGame(2);
    const after = playSimpleRound(start, 'SOLO', [5, 5], [true, false]);
    // Beide hatten zwei Fünfer, jetzt nur noch einen - unabhängig vom Ergebnis.
    expect(after.players[0].chips.filter((c) => c === 5)).toHaveLength(1);
    expect(after.players[1].chips.filter((c) => c === 5)).toHaveLength(1);
    expect(after.players[0].chips).toHaveLength(9);
  });

  it('verweigert einen Chip, den der Spieler nicht mehr besitzt', () => {
    let s = newGame(2);
    // Beide Fünfer aufbrauchen.
    s = playSimpleRound(s, 'SOLO', [5, 1], [true, true]);
    s = playSimpleRound(s, 'SOLO', [5, 1], [true, true]);
    s = run(s, { type: 'SET_CATEGORY', category: 'SOLO' }, { type: 'CONFIRM_CHALLENGE' });
    expect(s.players[0].chips.includes(5)).toBe(false);

    const blocked = gameReducer(s, { type: 'PLACE_BET', playerId: s.players[0].id, chip: 5 });
    expect(currentRound(blocked).bets[s.players[0].id]).toBeUndefined();
  });

  it('geht erst weiter, wenn alle Spieler gesetzt haben', () => {
    let s = newGame(3);
    s = run(s, { type: 'SET_CATEGORY', category: 'SOLO' }, { type: 'CONFIRM_CHALLENGE' });
    s = gameReducer(s, { type: 'PLACE_BET', playerId: s.players[0].id, chip: 1 });
    s = gameReducer(s, { type: 'CONFIRM_BETS' });
    expect(currentRound(s).phase).toBe('betting');

    s = gameReducer(s, { type: 'PLACE_BET', playerId: s.players[1].id, chip: 3 });
    s = gameReducer(s, { type: 'PLACE_BET', playerId: s.players[2].id, chip: 5 });
    s = gameReducer(s, { type: 'CONFIRM_BETS' });
    expect(currentRound(s).phase).toBe('resolve');
  });

  it('schließt die Runde erst ab, wenn alle Ergebnisse gesetzt sind', () => {
    let s = newGame(2);
    s = run(s, { type: 'SET_CATEGORY', category: 'SOLO' }, { type: 'CONFIRM_CHALLENGE' });
    s = gameReducer(s, { type: 'PLACE_BET', playerId: s.players[0].id, chip: 1 });
    s = gameReducer(s, { type: 'PLACE_BET', playerId: s.players[1].id, chip: 1 });
    s = gameReducer(s, { type: 'CONFIRM_BETS' });
    s = gameReducer(s, { type: 'SET_RESULT', playerId: s.players[0].id, result: 'success' });

    const tooEarly = gameReducer(s, { type: 'FINISH_ROUND' });
    expect(tooEarly.current).toBe(0);
    expect(currentRound(tooEarly).phase).toBe('resolve');
  });

  it('erlaubt das Ändern eines Einsatzes vor der Bestätigung', () => {
    let s = newGame(2);
    s = run(s, { type: 'SET_CATEGORY', category: 'SOLO' }, { type: 'CONFIRM_CHALLENGE' });
    s = gameReducer(s, { type: 'PLACE_BET', playerId: s.players[0].id, chip: 1 });
    s = gameReducer(s, { type: 'PLACE_BET', playerId: s.players[0].id, chip: 5 });
    expect(currentRound(s).bets[s.players[0].id]).toBe(5);

    s = gameReducer(s, { type: 'CLEAR_BET', playerId: s.players[0].id });
    expect(currentRound(s).bets[s.players[0].id]).toBeUndefined();
  });
});

describe('Startspieler-Rotation', () => {
  it('wechselt reihum über alle Runden', () => {
    let s = newGame(3);
    const ids = s.players.map((p) => p.id);
    const seen: string[] = [];
    for (let i = 0; i < DEFAULT_ROUNDS; i++) {
      seen.push(currentRound(s).starterId);
      // Runde i verbraucht bei allen denselben Chip - so reicht der Vorrat exakt.
      const chip = START_CHIPS[i];
      s = playSimpleRound(s, 'SOLO', [chip, chip, chip], [true, true, true]);
    }
    expect(seen).toEqual(
      Array.from({ length: DEFAULT_ROUNDS }, (_, i) => ids[i % ids.length]),
    );
  });
});

describe('Zweigespann und Duell', () => {
  it('überspringt die Gruppenphase bei Solo und Meisterschaft', () => {
    const s = run(newGame(4), { type: 'SET_CATEGORY', category: 'MEISTERSCHAFT' }, {
      type: 'CONFIRM_CHALLENGE',
    });
    expect(currentRound(s).phase).toBe('betting');
  });

  it('fordert bei Zweigespann zuerst die Gruppenbildung', () => {
    const s = run(newGame(4), { type: 'SET_CATEGORY', category: 'ZWEIGESPANN' }, {
      type: 'CONFIRM_CHALLENGE',
    });
    expect(currentRound(s).phase).toBe('groups');
  });

  it('wertet ein Zweigespann-Ergebnis für alle Mitglieder', () => {
    let s = newGame(4);
    const [a, b, c, d] = s.players.map((p) => p.id);
    s = run(
      s,
      { type: 'SET_CATEGORY', category: 'ZWEIGESPANN' },
      { type: 'CONFIRM_CHALLENGE' },
      {
        type: 'SET_GROUPS',
        groups: [
          { id: 'g1', memberIds: [a, b] },
          { id: 'g2', memberIds: [c, d] },
        ],
      },
      { type: 'CONFIRM_GROUPS' },
      { type: 'PLACE_BET', playerId: a, chip: 5 },
      { type: 'PLACE_BET', playerId: b, chip: 3 },
      { type: 'PLACE_BET', playerId: c, chip: 1 },
      { type: 'PLACE_BET', playerId: d, chip: 1 },
      { type: 'CONFIRM_BETS' },
      { type: 'SET_GROUP_RESULT', groupId: 'g1', result: 'success' },
      { type: 'SET_GROUP_RESULT', groupId: 'g2', result: 'fail' },
      { type: 'FINISH_ROUND' },
    );
    expect(s.players.map((p) => p.banked)).toEqual([5, 3, 0, 0]);
    expect(s.players.map((p) => p.lost)).toEqual([0, 0, 1, 1]);
  });

  it('lässt im Duell nur den Sieger banken', () => {
    let s = newGame(2);
    const [a, b] = s.players.map((p) => p.id);
    s = run(
      s,
      { type: 'SET_CATEGORY', category: 'DUELL' },
      { type: 'CONFIRM_CHALLENGE' },
      { type: 'SET_GROUPS', groups: [{ id: 'g1', memberIds: [a, b] }] },
      { type: 'CONFIRM_GROUPS' },
      { type: 'PLACE_BET', playerId: a, chip: 3 },
      { type: 'PLACE_BET', playerId: b, chip: 5 },
      { type: 'CONFIRM_BETS' },
      { type: 'SET_DUEL_WINNER', groupId: 'g1', winnerId: a },
      { type: 'FINISH_ROUND' },
    );
    expect(s.players[0].banked).toBe(3);
    expect(s.players[1].banked).toBe(0);
    expect(s.players[1].lost).toBe(5);
  });

  it('lässt im Duell auch "keiner geschafft" zu', () => {
    let s = newGame(2);
    const [a, b] = s.players.map((p) => p.id);
    s = run(
      s,
      { type: 'SET_CATEGORY', category: 'DUELL' },
      { type: 'CONFIRM_CHALLENGE' },
      { type: 'SET_GROUPS', groups: [{ id: 'g1', memberIds: [a, b] }] },
      { type: 'CONFIRM_GROUPS' },
      { type: 'PLACE_BET', playerId: a, chip: 3 },
      { type: 'PLACE_BET', playerId: b, chip: 5 },
      { type: 'CONFIRM_BETS' },
      { type: 'SET_DUEL_WINNER', groupId: 'g1', winnerId: null },
      { type: 'FINISH_ROUND' },
    );
    expect(s.players.map((p) => p.banked)).toEqual([0, 0]);
    expect(s.players.map((p) => p.lost)).toEqual([3, 5]);
  });

  it('blockt unvollständige Gruppen', () => {
    let s = newGame(4);
    const [a, b] = s.players.map((p) => p.id);
    s = run(
      s,
      { type: 'SET_CATEGORY', category: 'DUELL' },
      { type: 'CONFIRM_CHALLENGE' },
      { type: 'SET_GROUPS', groups: [{ id: 'g1', memberIds: [a, b] }] },
      { type: 'CONFIRM_GROUPS' },
    );
    expect(currentRound(s).phase).toBe('groups');
    expect(validateGroups(s.players, [{ id: 'g1', memberIds: [a, b] }]).ok).toBe(false);
  });

  it('bildet automatisch Paare und lässt bei ungerader Zahl genau einen übrig', () => {
    const s = newGame(5);
    const groups = autoPairs(s.players);
    expect(groups).toHaveLength(2);
    expect(validateGroups(s.players, groups).ok).toBe(true);
    const assigned = new Set(groups.flatMap((g) => g.memberIds));
    expect(assigned.size).toBe(4);
  });
});

describe('Joker bei ungerader Spielerzahl', () => {
  it('setzt vorher, wartet bis alle Paare entschieden haben und wählt dann eine zweite Runde', () => {
    let s = newGame(5);
    const [a, b, c, d, e] = s.players.map((p) => p.id);
    s = run(
      s,
      { type: 'SET_CATEGORY', category: 'ZWEIGESPANN' },
      { type: 'CONFIRM_CHALLENGE' },
      {
        type: 'SET_GROUPS',
        groups: [
          { id: 'g1', memberIds: [a, b] },
          { id: 'g2', memberIds: [c, d] },
        ],
      },
    );
    // Eli ist Joker.
    expect(currentRound(s).jokerId).toBe(e);

    s = gameReducer(s, { type: 'CONFIRM_GROUPS' });
    expect(currentRound(s).phase).toBe('betting');

    // Der Joker muss trotzdem vorher setzen.
    s = run(
      s,
      { type: 'PLACE_BET', playerId: a, chip: 1 },
      { type: 'PLACE_BET', playerId: b, chip: 1 },
      { type: 'PLACE_BET', playerId: c, chip: 1 },
      { type: 'PLACE_BET', playerId: d, chip: 1 },
      { type: 'PLACE_BET', playerId: e, chip: 5 },
      { type: 'CONFIRM_BETS' },
    );
    expect(currentRound(s).phase).toBe('resolve');

    // Vor der Entscheidung beider Paare darf der Joker noch nicht wählen.
    const tooEarly = gameReducer(s, { type: 'PICK_JOKER_PARTNER', partnerId: c });
    expect(tooEarly.rounds[0].groups.some((g) => g.isJoker)).toBe(false);

    s = run(
      s,
      { type: 'SET_GROUP_RESULT', groupId: 'g1', result: 'fail' },
      { type: 'SET_GROUP_RESULT', groupId: 'g2', result: 'success' },
      // Der Joker holt sich Cem - dessen erstes Ergebnis (success) zählt jetzt nicht mehr.
      { type: 'PICK_JOKER_PARTNER', partnerId: c },
    );
    let round = currentRound(s);
    const jokerGroup = round.groups.find((g) => g.isJoker);
    expect(jokerGroup?.memberIds).toEqual([e, c]);
    expect(round.groups.find((g) => g.id === 'g2')?.memberIds).toEqual([d]);
    // Cems erstes Ergebnis wurde verworfen, bis die zweite Runde entschieden ist.
    expect(round.results[c]).toBeUndefined();

    s = run(s, { type: 'SET_GROUP_RESULT', groupId: jokerGroup!.id, result: 'fail' });
    round = currentRound(s);
    expect(round.results[c]).toBe('fail');
    expect(round.results[d]).toBe('success');
    expect(round.results[e]).toBe('fail');

    s = gameReducer(s, { type: 'FINISH_ROUND' });
    // a,b: fail (Chip 1) / c: fail (Chip 1, aus der zweiten Runde) / d: success (Chip 1) / e: fail (Chip 5).
    expect(s.players.map((p) => p.banked)).toEqual([0, 0, 0, 1, 0]);
    expect(s.players.map((p) => p.lost)).toEqual([1, 1, 1, 0, 5]);
  });

  it('lässt den Joker im Duell gegen die abgeholte Person gewinnen', () => {
    let s = newGame(3);
    const [a, b, c] = s.players.map((p) => p.id);
    s = run(
      s,
      { type: 'SET_CATEGORY', category: 'DUELL' },
      { type: 'CONFIRM_CHALLENGE' },
      { type: 'SET_GROUPS', groups: [{ id: 'g1', memberIds: [a, b] }] },
      { type: 'CONFIRM_GROUPS' },
      { type: 'PLACE_BET', playerId: a, chip: 1 },
      { type: 'PLACE_BET', playerId: b, chip: 3 },
      { type: 'PLACE_BET', playerId: c, chip: 5 },
      { type: 'CONFIRM_BETS' },
      { type: 'SET_DUEL_WINNER', groupId: 'g1', winnerId: a },
      // Der Joker fordert Anna heraus, die das erste Duell gewonnen hatte.
      { type: 'PICK_JOKER_PARTNER', partnerId: a },
    );
    const jokerGroup = currentRound(s).groups.find((g) => g.isJoker)!;
    s = run(
      s,
      { type: 'SET_DUEL_WINNER', groupId: jokerGroup.id, winnerId: c },
      { type: 'FINISH_ROUND' },
    );
    // Anna verliert jetzt trotz des ersten Sieges, Ben bleibt bei seiner Niederlage, Cem gewinnt.
    expect(s.players.map((p) => p.banked)).toEqual([0, 0, 5]);
    expect(s.players.map((p) => p.lost)).toEqual([1, 3, 0]);
  });

  it('hat bei gerader Spielerzahl gar keinen Joker', () => {
    let s = newGame(4);
    const ids = s.players.map((p) => p.id);
    s = run(
      s,
      { type: 'SET_CATEGORY', category: 'DUELL' },
      { type: 'CONFIRM_CHALLENGE' },
      {
        type: 'SET_GROUPS',
        groups: [
          { id: 'g1', memberIds: [ids[0], ids[1]] },
          { id: 'g2', memberIds: [ids[2], ids[3]] },
        ],
      },
      { type: 'CONFIRM_GROUPS' },
      ...ids.map((id) => ({ type: 'PLACE_BET' as const, playerId: id, chip: 1 as const })),
      { type: 'CONFIRM_BETS' },
    );
    expect(currentRound(s).jokerId).toBeNull();
    expect(currentRound(s).phase).toBe('resolve');
  });
});

describe('Spielende', () => {
  it('endet nach der eingestellten Rundenzahl mit dem punktbesten Spieler', () => {
    let s = newGame(2, DEFAULT_ROUNDS);
    for (let i = 0; i < DEFAULT_ROUNDS; i++) {
      expect(s.finished).toBe(false);
      s = playSimpleRound(s, 'SOLO', [START_CHIPS[i], START_CHIPS[i]], [true, false]);
    }
    expect(s.finished).toBe(true);
    expect(s.players[0].banked).toBe(24);
    expect(s.players[1].banked).toBe(0);
    expect(s.players[1].lost).toBe(24);
    expect(s.players[0].chips).toHaveLength(0);
    expect(winners(s).map((p) => p.name)).toEqual(['Anna']);
  });

  it('respektiert eine verkürzte Rundenzahl', () => {
    let s = newGame(2, 5);
    for (let i = 0; i < 5; i++) s = playSimpleRound(s, 'SOLO', [1, 1], [true, true]);
    expect(s.finished).toBe(true);
    expect(s.rounds).toHaveLength(5);
    expect(s.players[0].chips).toHaveLength(5);
  });

  it('ignoriert Aktionen nach Spielende', () => {
    let s = newGame(2, 5);
    for (let i = 0; i < 5; i++) s = playSimpleRound(s, 'SOLO', [1, 1], [true, true]);
    const after = gameReducer(s, { type: 'SET_CATEGORY', category: 'SOLO' });
    expect(after).toBe(s);
  });
});

describe('Übersicht', () => {
  it('berechnet Restbudget und maximal erreichbaren Endstand', () => {
    let s = newGame(2);
    s = playSimpleRound(s, 'SOLO', [5, 3], [true, false]);
    const [anna, ben] = s.players;
    expect(remainingBudget(anna)).toBe(19);
    expect(maxPossible(anna)).toBe(24);
    expect(remainingBudget(ben)).toBe(21);
    // Ben hat 3 Punkte verloren, kann also höchstens noch 21 erreichen.
    expect(maxPossible(ben)).toBe(21);
  });

  it('sortiert die Rangliste und teilt Ränge bei Gleichstand', () => {
    let s = newGame(3);
    s = playSimpleRound(s, 'SOLO', [5, 5, 1], [true, true, true]);
    const table = standings(s);
    expect(table.map((e) => e.rank)).toEqual([1, 1, 3]);
    expect(table[2].player.banked).toBe(1);
  });
});
