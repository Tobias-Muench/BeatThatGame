import { useState } from 'react';
import { ChipToken } from '../components/Chip';
import { OverviewPanel } from '../components/OverviewPanel';
import { chipCounts, standings, winners } from '../game/selectors';
import { PLAYER_COLORS, START_CHIPS, type GameState } from '../game/types';

interface Props {
  state: GameState;
  onNewGame: () => void;
  onQuit: () => void;
}

export function EndScreen({ state, onNewGame, onQuit }: Props) {
  const [showOverview, setShowOverview] = useState(false);
  const table = standings(state);
  const champions = winners(state);

  return (
    <div className="screen">
      <div className="podium">
        <span className="crown">👑</span>
        <h1>
          {champions.map((p) => p.name).join(' & ')}{' '}
          {champions.length > 1 ? 'gewinnen' : 'gewinnt'}
        </h1>
        <p>
          {champions[0].banked} Punkte nach {state.rounds.length}{' '}
          {state.rounds.length === 1 ? 'Runde' : 'Runden'}
        </p>
      </div>

      <div className="phase">
        <div className="scroll">
          <div className="standing-list">
            {table.map((entry) => {
              const counts = chipCounts(entry.player.chips);
              return (
                <div
                  key={entry.player.id}
                  className={`standing-row${entry.rank === 1 ? ' is-leader' : ''}`}
                >
                  <span className="standing-rank">{entry.rank}.</span>
                  <span className="standing-name">
                    <span
                      className="dot"
                      style={{ background: PLAYER_COLORS[entry.player.colorIndex] }}
                    />
                    <span>{entry.player.name}</span>
                  </span>
                  <span className="stat">
                    <span className="stat-label">Punkte</span>
                    <span className="stat-value">{entry.player.banked}</span>
                  </span>
                  <span className="budget-cell">
                    <span className="stat-label">An die Bank verloren: {entry.player.lost}</span>
                    <span className="budget-chips">
                      {counts.length === 0 ? (
                        <span className="none">Alle Chips gesetzt</span>
                      ) : (
                        counts.map(({ value, count }) => (
                          <span className="chip-with-count" key={value}>
                            <ChipToken value={value} small />
                            {count}x übrig
                          </span>
                        ))
                      )}
                    </span>
                  </span>
                  <span className="stat">
                    <span className="stat-label">Gespielt</span>
                    <span className="stat-value small">
                      {START_CHIPS.length - entry.player.chips.length} Chips
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="actionbar">
        <button type="button" className="btn btn-sm" onClick={() => setShowOverview(true)}>
          Rundenprotokoll
        </button>
        <div className="spacer" />
        <button type="button" className="btn btn-sm btn-ghost" onClick={onQuit}>
          Zum Startbildschirm
        </button>
        <button type="button" className="btn btn-primary" onClick={onNewGame}>
          Neues Spiel
        </button>
      </div>

      {showOverview && <OverviewPanel state={state} onClose={() => setShowOverview(false)} />}
    </div>
  );
}
