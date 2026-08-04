import { autoPairs, nextId } from '../game/reducer';
import { PLAYER_COLORS, type Group, type Player } from '../game/types';

interface Props {
  players: Player[];
  groups: Group[];
  jokerId: string | null;
  /** Startspieler der Runde - er sucht sich als Erster einen Partner. */
  starterId: string;
  onChange: (groups: Group[]) => void;
}

/**
 * Reihenfolge ab dem Startspieler: Er wählt zuerst, danach geht es reihum
 * weiter zur nächsten Person, die noch kein Paar hat.
 */
function turnOrder(players: Player[], starterId: string): Player[] {
  const start = players.findIndex((p) => p.id === starterId);
  if (start < 0) return players;
  return [...players.slice(start), ...players.slice(0, start)];
}

/**
 * Paare bilden: Der Startspieler ist automatisch vorausgewählt und tippt
 * seinen Partner an. Danach ist reihum die nächste Person ohne Paar dran.
 * Bei ungerader Spielerzahl bleibt genau einer übrig - er ist Joker, setzt
 * trotzdem einen Chip und wählt seine Gruppe erst nach dem Spielen.
 */
export function TeamBuilder({ players, groups, jokerId, starterId, onChange }: Props) {
  const assigned = new Set(groups.flatMap((g) => g.memberIds));
  const order = turnOrder(players, starterId);
  // Wer gerade dran ist: die erste Person der Reihenfolge ohne Paar.
  const chooser = order.find((p) => !assigned.has(p.id)) ?? null;
  const options = order.filter((p) => !assigned.has(p.id) && p.id !== chooser?.id);

  function pairWith(partnerId: string) {
    if (!chooser) return;
    onChange([...groups, { id: nextId('g'), memberIds: [chooser.id, partnerId] }]);
  }

  const joker = jokerId ? players.find((p) => p.id === jokerId) : null;

  return (
    <>
      <div className="scroll">
        {chooser && options.length > 0 && (
          <>
            <p className="section-title" style={{ marginBottom: 10 }}>
              {chooser.name} ist dran - Partner antippen
            </p>
            <div className="pool-grid" style={{ marginBottom: 18 }}>
              <div className="pool-player is-chooser" aria-current="step">
                <span className="dot" style={{ background: PLAYER_COLORS[chooser.colorIndex] }} />
                <span style={{ flex: 1 }}>{chooser.name}</span>
                <span className="chooser-badge">wählt</span>
              </div>
              {options.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="pool-player"
                  onClick={() => pairWith(p.id)}
                >
                  <span className="dot" style={{ background: PLAYER_COLORS[p.colorIndex] }} />
                  {p.name}
                </button>
              ))}
            </div>
          </>
        )}

        {joker && (
          <div className="joker-note" style={{ marginBottom: 18 }}>
            <strong>{joker.name}</strong> bleibt übrig und ist Joker: setzt jetzt ganz normal
            einen Chip. Nachdem alle Paare entschieden haben, wählt er sich eine Person für eine
            zweite Runde - deren erstes Ergebnis zählt dann nicht mehr.
          </div>
        )}

        {groups.length > 0 && (
          <>
            <p className="section-title" style={{ marginBottom: 10 }}>
              Paare - zum Auflösen antippen
            </p>
            <div className="group-grid">
              {groups.map((g, i) => (
                <button
                  key={g.id}
                  type="button"
                  className="group-card"
                  style={{ textAlign: 'left' }}
                  onClick={() => onChange(groups.filter((x) => x.id !== g.id))}
                >
                  <span className="group-title">Paar {i + 1}</span>
                  <div className="group-members">
                    {g.memberIds.map((id) => {
                      const p = players.find((x) => x.id === id);
                      if (!p) return null;
                      return (
                        <span className="member-row" key={id}>
                          <span
                            className="dot"
                            style={{ background: PLAYER_COLORS[p.colorIndex] }}
                          />
                          {p.name}
                        </span>
                      );
                    })}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, paddingBottom: 4 }}>
        <button type="button" className="btn btn-sm" onClick={() => onChange(autoPairs(players))}>
          Zufällig zuteilen
        </button>
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => onChange([])}
          disabled={groups.length === 0}
        >
          Zurücksetzen
        </button>
      </div>
    </>
  );
}
