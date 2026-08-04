import { useState } from 'react';
import { autoPairs, nextId } from '../game/reducer';
import { PLAYER_COLORS, type Group, type Player } from '../game/types';

interface Props {
  players: Player[];
  groups: Group[];
  jokerId: string | null;
  onChange: (groups: Group[]) => void;
}

/**
 * Paare bilden: zwei Spieler nacheinander antippen. Bei ungerader Spielerzahl
 * bleibt genau einer als Joker übrig - er setzt trotzdem und wählt seine
 * Gruppe erst nach dem Spielen der Paare.
 */
export function TeamBuilder({ players, groups, jokerId, onChange }: Props) {
  const [pending, setPending] = useState<string | null>(null);

  const assigned = new Set(groups.flatMap((g) => g.memberIds));
  const pool = players.filter((p) => !assigned.has(p.id));

  function tapPoolPlayer(id: string) {
    if (pending === null) {
      setPending(id);
      return;
    }
    if (pending === id) {
      setPending(null);
      return;
    }
    onChange([...groups, { id: nextId('g'), memberIds: [pending, id] }]);
    setPending(null);
  }

  function dissolve(groupId: string) {
    onChange(groups.filter((g) => g.id !== groupId));
    setPending(null);
  }

  const joker = jokerId ? players.find((p) => p.id === jokerId) : null;

  return (
    <>
      <div className="scroll">
        {pool.length > 0 && (
          <>
            <p className="section-title" style={{ marginBottom: 10 }}>
              Noch ohne Paar - zwei Spieler antippen
            </p>
            <div className="pool-grid" style={{ marginBottom: 18 }}>
              {pool.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="pool-player"
                  aria-pressed={pending === p.id}
                  onClick={() => tapPoolPlayer(p.id)}
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
            einen Chip, schaut sich die anderen Paare an und schließt sich danach einem Paar an.
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
                  onClick={() => dissolve(g.id)}
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
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            onChange(autoPairs(players));
            setPending(null);
          }}
        >
          Zufällig zuteilen
        </button>
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => {
            onChange([]);
            setPending(null);
          }}
          disabled={groups.length === 0}
        >
          Zurücksetzen
        </button>
      </div>
    </>
  );
}
