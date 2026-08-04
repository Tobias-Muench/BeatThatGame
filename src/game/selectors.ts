import type { ChipValue, GameState, Player, Round } from './types';

/** Summe der noch nicht gesetzten Chips - "so viel kann er noch setzen". */
export function remainingBudget(player: Player): number {
  return player.chips.reduce<number>((sum, c) => sum + c, 0);
}

/** Rechnerisch noch erreichbarer Endstand. */
export function maxPossible(player: Player): number {
  return player.banked + remainingBudget(player);
}

/** Chips gruppiert nach Wert, absteigend - für die Chip-Anzeige. */
export function chipCounts(chips: ChipValue[]): { value: ChipValue; count: number }[] {
  const order: ChipValue[] = [1, 3, 5];
  return order
    .map((value) => ({ value, count: chips.filter((c) => c === value).length }))
    .filter((entry) => entry.count > 0);
}

export interface Standing {
  player: Player;
  rank: number;
  budget: number;
  max: number;
}

/** Rangliste nach gebankten Punkten; Gleichstand teilt sich den Rang. */
export function standings(state: GameState): Standing[] {
  const sorted = [...state.players].sort((a, b) => {
    if (b.banked !== a.banked) return b.banked - a.banked;
    return maxPossible(b) - maxPossible(a);
  });
  let rank = 0;
  let previous: number | null = null;
  return sorted.map((player, i) => {
    if (previous === null || player.banked !== previous) {
      rank = i + 1;
      previous = player.banked;
    }
    return {
      player,
      rank,
      budget: remainingBudget(player),
      max: maxPossible(player),
    };
  });
}

/** Spieler mit den meisten Punkten (mehrere bei Gleichstand). */
export function winners(state: GameState): Player[] {
  const best = Math.max(...state.players.map((p) => p.banked));
  return state.players.filter((p) => p.banked === best);
}

export function playerById(state: GameState, id: string): Player | undefined {
  return state.players.find((p) => p.id === id);
}

/** Bereits abgeschlossene Runden, neueste zuerst. */
export function playedRounds(state: GameState): Round[] {
  const upto = state.finished ? state.rounds.length : state.current;
  return state.rounds.slice(0, upto).reverse();
}

/** Punkteveränderung, die die aktuelle Runde für einen Spieler bedeutet. */
export function pendingDelta(round: Round, playerId: string): number | null {
  const chip = round.bets[playerId];
  const result = round.results[playerId];
  if (chip === undefined || result === undefined) return null;
  return result === 'success' ? chip : -chip;
}
