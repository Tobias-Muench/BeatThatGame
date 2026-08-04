import { ChipToken } from './Chip';
import { PlayerCard } from './PlayerCard';
import { pendingDelta } from '../game/selectors';
import { CATEGORY_INFO, PLAYER_COLORS, type Player, type Round } from '../game/types';
import type { GameAction } from '../game/reducer';

interface Props {
  players: Player[];
  round: Round;
  dispatch: (action: GameAction) => void;
}

function Delta({ round, playerId }: { round: Round; playerId: string }) {
  const delta = pendingDelta(round, playerId);
  if (delta === null) return <span className="delta none">offen</span>;
  return (
    <span className={`delta ${delta >= 0 ? 'plus' : 'minus'}`}>
      {delta >= 0 ? `+${delta}` : delta}
    </span>
  );
}

export function ResolvePanel({ players, round, dispatch }: Props) {
  const category = round.category;
  if (!category) return null;

  // Solo und Meisterschaft werden pro Spieler gewertet.
  if (!CATEGORY_INFO[category].needsGroups) {
    return (
      <div className="scroll">
        <div className="player-grid">
          {players.map((p) => {
            const result = round.results[p.id];
            return (
              <PlayerCard
                key={p.id}
                player={p}
                isStarter={p.id === round.starterId}
                note={<Delta round={round} playerId={p.id} />}
                done={result !== undefined}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="phase-hint">Einsatz</span>
                  <ChipToken value={round.bets[p.id]} />
                </div>
                <div className="result-toggle">
                  <button
                    type="button"
                    className="result-btn ok"
                    aria-pressed={result === 'success'}
                    onClick={() =>
                      dispatch({ type: 'SET_RESULT', playerId: p.id, result: 'success' })
                    }
                  >
                    Geschafft
                  </button>
                  <button
                    type="button"
                    className="result-btn no"
                    aria-pressed={result === 'fail'}
                    onClick={() => dispatch({ type: 'SET_RESULT', playerId: p.id, result: 'fail' })}
                  >
                    Nicht
                  </button>
                </div>
              </PlayerCard>
            );
          })}
        </div>
      </div>
    );
  }

  // Zweigespann und Duell werden pro Gruppe gewertet.
  return (
    <div className="scroll">
      <div className="group-grid">
        {round.groups.map((g, i) => {
          const members = g.memberIds
            .map((id) => players.find((p) => p.id === id))
            .filter((p): p is Player => p !== undefined);
          const groupResult = members.every((m) => round.results[m.id] === 'success')
            ? 'success'
            : members.every((m) => round.results[m.id] === 'fail')
              ? 'fail'
              : undefined;

          return (
            <div key={g.id} className="group-card">
              <span className="group-title">
                {category === 'DUELL' ? 'Duell' : 'Zweigespann'} {i + 1}
                {members.length > 0 && (
                  <span className="group-names">
                    {members.map((m) => m.name).join(category === 'DUELL' ? ' gegen ' : ' & ')}
                  </span>
                )}
              </span>
              <div className="group-members">
                {members.map((m) => (
                  <span className="member-row" key={m.id}>
                    <span className="dot" style={{ background: PLAYER_COLORS[m.colorIndex] }} />
                    <span style={{ flex: 1 }}>{m.name}</span>
                    <ChipToken value={round.bets[m.id]} small />
                    <Delta round={round} playerId={m.id} />
                  </span>
                ))}
              </div>

              {category === 'ZWEIGESPANN' ? (
                <div className="result-toggle">
                  <button
                    type="button"
                    className="result-btn ok"
                    aria-pressed={groupResult === 'success'}
                    onClick={() =>
                      dispatch({ type: 'SET_GROUP_RESULT', groupId: g.id, result: 'success' })
                    }
                  >
                    Geschafft
                  </button>
                  <button
                    type="button"
                    className="result-btn no"
                    aria-pressed={groupResult === 'fail'}
                    onClick={() =>
                      dispatch({ type: 'SET_GROUP_RESULT', groupId: g.id, result: 'fail' })
                    }
                  >
                    Nicht
                  </button>
                </div>
              ) : (
                // Im Duell gewinnt immer einer der beiden - kein "Keiner".
                <div className="result-toggle" style={{ flexWrap: 'wrap' }}>
                  {members.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className="result-btn ok"
                      aria-pressed={round.results[m.id] === 'success'}
                      onClick={() =>
                        dispatch({ type: 'SET_DUEL_WINNER', groupId: g.id, winnerId: m.id })
                      }
                    >
                      {m.name} gewinnt
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
