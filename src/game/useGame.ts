import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { createGame, gameReducer, type GameAction } from './reducer';
import { loadGame, saveGame } from './storage';
import type { GameState } from './types';

/** Wie viele Schritte rückgängig gemacht werden können. */
const MAX_HISTORY = 30;

interface AppState {
  game: GameState | null;
  past: GameState[];
}

type AppAction = GameAction | { type: 'UNDO' } | { type: 'QUIT' } | { type: 'RESUME'; game: GameState };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'UNDO': {
      if (state.past.length === 0) return state;
      const past = [...state.past];
      const game = past.pop()!;
      return { game, past };
    }
    case 'QUIT':
      return { game: null, past: [] };
    case 'RESUME':
      return { game: action.game, past: [] };
    case 'NEW_GAME':
      return { game: createGame(action.players, action.mode, action.totalRounds), past: [] };
    default: {
      if (!state.game) return state;
      const next = gameReducer(state.game, action);
      if (next === state.game) return state;
      return {
        game: next,
        past: [...state.past, state.game].slice(-MAX_HISTORY),
      };
    }
  }
}

export interface GameStore {
  game: GameState | null;
  dispatch: (action: GameAction) => void;
  canUndo: boolean;
  undo: () => void;
  quit: () => void;
  /** Auf dem Gerät gespeicherter, noch nicht fortgesetzter Spielstand. */
  savedGame: GameState | null;
  resume: () => void;
}

export function useGame(): GameStore {
  const [state, dispatch] = useReducer(appReducer, { game: null, past: [] });
  // Der Spielstand wird genau einmal beim Start gelesen.
  const [savedGame, setSavedGame] = useState<GameState | null>(() => loadGame());

  useEffect(() => {
    // Nur schreiben, solange ein Spiel läuft. Das Löschen übernimmt `quit`,
    // damit der gespeicherte Stand beim Start nicht überschrieben wird.
    if (state.game) saveGame(state.game);
  }, [state.game]);

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);

  const quit = useCallback(() => {
    saveGame(null);
    setSavedGame(null);
    dispatch({ type: 'QUIT' });
  }, []);

  const resume = useCallback(() => {
    if (savedGame) dispatch({ type: 'RESUME', game: savedGame });
  }, [savedGame]);

  return useMemo(
    () => ({
      game: state.game,
      dispatch,
      canUndo: state.past.length > 0,
      undo,
      quit,
      savedGame,
      resume,
    }),
    [state.game, state.past.length, savedGame, undo, quit, resume],
  );
}
