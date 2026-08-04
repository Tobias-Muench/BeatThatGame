import { ChipToken } from './Chip';
import { challengeById } from '../data/challenges';
import { chipCounts, playedRounds, standings } from '../game/selectors';
import { CATEGORY_INFO, PLAYER_COLORS, type GameState } from '../game/types';

interface Props {
  state: GameState;
  onClose: () => void;
}

/**
 * Jederzeit aufrufbare Übersicht: Habenseite, verbleibende Chips samt
 * Restbudget, maximal noch erreichbarer Endstand und das Rundenprotokoll.
 */
export function OverviewPanel({ state, onClose }: Props) {
  const table = standings(state);
  const log = playedRounds(state);
  const roundsLeft = state.finished ? 0 : state.totalRounds - state.current;

  return (
    <div className="overlay" role="dialog" aria-label="Übersicht">
      <div className="overlay-panel">
        <div className="overlay-head">
          <h2>Übersicht</h2>
          <span className="phase-hint">
            {state.finished
              ? 'Spiel beendet'
              : `Noch ${roundsLeft} ${roundsLeft === 1 ? 'Runde' : 'Runden'}`}
          </span>
          <div className="topbar-spacer" />
          <button type="button" className="btn btn-sm btn-primary" onClick={onClose}>
            Schließen
          </button>
        </div>

        <div className="overlay-body">
          <section>
            <p className="section-title" style={{ marginBottom: 10 }}>
              Punktestand
            </p>
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
                      <span className="stat-label">Habenseite</span>
                      <span className="stat-value">{entry.player.banked}</span>
                    </span>
                    <span className="budget-cell">
                      <span className="stat-label">
                        Kann noch setzen: {entry.budget} Punkte
                      </span>
                      <span className="budget-chips">
                        {counts.length === 0 ? (
                          <span className="none">Alle Chips verbraucht</span>
                        ) : (
                          counts.map(({ value, count }) => (
                            <span className="chip-with-count" key={value}>
                              <ChipToken value={value} small />
                              {count}x
                            </span>
                          ))
                        )}
                      </span>
                    </span>
                    <span className="stat">
                      <span className="stat-label">Max. möglich</span>
                      <span className="stat-value small">{entry.max}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <p className="section-title" style={{ marginBottom: 10 }}>
              Rundenprotokoll
            </p>
            {log.length === 0 ? (
              <p className="empty-note">Noch keine Runde abgeschlossen.</p>
            ) : (
              <div className="log-list">
                {log.map((round) => {
                  const challenge = round.challengeId ? challengeById(round.challengeId) : undefined;
                  return (
                    <div className="log-round" key={round.index}>
                      <div className="log-head">
                        <span className="log-no">Runde {round.index + 1}</span>
                        {round.category && (
                          <span className="log-cat">{CATEGORY_INFO[round.category].label}</span>
                        )}
                        {challenge && <span className="log-title">{challenge.title}</span>}
                      </div>
                      <div className="log-players">
                        {state.players.map((p) => {
                          const chip = round.bets[p.id];
                          if (chip === undefined) return null;
                          const ok = round.results[p.id] === 'success';
                          return (
                            <span key={p.id} className={`log-player ${ok ? 'ok' : 'no'}`}>
                              <span
                                className="dot"
                                style={{ background: PLAYER_COLORS[p.colorIndex] }}
                              />
                              {p.name}
                              <ChipToken value={chip} small />
                              <span className={`delta ${ok ? 'plus' : 'minus'}`}>
                                {ok ? `+${chip}` : `-${chip}`}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
