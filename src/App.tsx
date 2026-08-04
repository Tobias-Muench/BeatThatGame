import { useEffect, useState } from 'react';
import { EndScreen } from './screens/EndScreen';
import { RoundScreen } from './screens/RoundScreen';
import { SetupScreen } from './screens/SetupScreen';
import { StartScreen } from './screens/StartScreen';
import { challenges, validateChallenges } from './data/challenges';
import { loadRoster } from './game/storage';
import { useGame } from './game/useGame';

type Entry = 'start' | 'setup';

export default function App() {
  const { game, dispatch, canUndo, undo, quit, savedGame, resume } = useGame();
  const [entry, setEntry] = useState<Entry>('start');

  useEffect(() => {
    for (const problem of validateChallenges(challenges)) {
      console.warn(`[challenges.ts] ${problem}`);
    }
  }, []);

  if (game && game.finished) {
    return (
      <div className="app">
        <EndScreen
          state={game}
          onNewGame={() => {
            quit();
            setEntry('setup');
          }}
          onQuit={() => {
            quit();
            setEntry('start');
          }}
        />
      </div>
    );
  }

  if (game) {
    return (
      <div className="app">
        <RoundScreen
          state={game}
          dispatch={dispatch}
          canUndo={canUndo}
          onUndo={undo}
          onQuit={() => {
            quit();
            setEntry('start');
          }}
        />
      </div>
    );
  }

  return (
    <div className="app">
      {entry === 'setup' ? (
        <SetupScreen
          initialNames={loadRoster()}
          onCancel={() => setEntry('start')}
          onStart={(names, mode) =>
            dispatch({
              type: 'NEW_GAME',
              players: names.map((name) => ({ name })),
              mode,
            })
          }
        />
      ) : (
        <StartScreen
          hasSavedGame={savedGame !== null}
          onContinue={resume}
          onNewGame={() => setEntry('setup')}
        />
      )}
    </div>
  );
}
