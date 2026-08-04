import { ChipToken } from './Chip';
import { PlayerCard } from './PlayerCard';
import { pendingDelta } from '../game/selectors';
import {
  CATEGORY_INFO,
  PLAYER_COLORS,
  type Category,
  type Group,
  type Player,
  type Round,
} from '../game/types';
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

/** Ergebnis-Kontrolle für eine Gruppe: geteiltes Geschafft/Nicht bei Zweigespann,
 * ein Gewinner-Knopf pro Person bei Duell. Wird für normale wie für die
 * Joker-Gruppe gleichermaßen benutzt. */
function ResultToggle({
  category,
  group,
  members,
  round,
  dispatch,
}: {
  category: Category;
  group: Group;
  members: Player[];
  round: Round;
  dispatch: (action: GameAction) => void;
}) {
  if (category === 'ZWEIGESPANN') {
    const groupResult = members.every((m) => round.results[m.id] === 'success')
      ? 'success'
      : members.every((m) => round.results[m.id] === 'fail')
        ? 'fail'
        : undefined;
    return (
      <div className="result-toggle">
        <button
          type="button"
          className="result-btn ok"
          aria-pressed={groupResult === 'success'}
          onClick={() => dispatch({ type: 'SET_GROUP_RESULT', groupId: group.id, result: 'success' })}
        >
          Geschafft
        </button>
        <button
          type="button"
          className="result-btn no"
          aria-pressed={groupResult === 'fail'}
          onClick={() => dispatch({ type: 'SET_GROUP_RESULT', groupId: group.id, result: 'fail' })}
        >
          Nicht
        </button>
      </div>
    );
  }

  // Im Duell gewinnt immer einer der beiden - kein "Keiner".
  return (
    <div className="result-toggle" style={{ flexWrap: 'wrap' }}>
      {members.map((m) => (
        <button
          key={m.id}
          type="button"
          className="result-btn ok"
          aria-pressed={round.results[m.id] === 'success'}
          onClick={() => dispatch({ type: 'SET_DUEL_WINNER', groupId: group.id, winnerId: m.id })}
        >
          {m.name} gewinnt
        </button>
      ))}
    </div>
  );
}

function MemberRow({ player, round }: { player: Player; round: Round }) {
  return (
    <span className="member-row">
      <span className="dot" style={{ background: PLAYER_COLORS[player.colorIndex] }} />
      <span style={{ flex: 1 }}>{player.name}</span>
      <ChipToken value={round.bets[player.id]} small />
      <Delta round={round} playerId={player.id} />
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

  // Zweigespann und Duell: erst spielen die ursprünglichen Paare, danach holt
  // sich ein übrig gebliebener Joker eine Person für eine zweite Runde -
  // deren erstes Ergebnis zählt dann nicht mehr.
  const jokerGroup = round.groups.find((g) => g.isJoker);
  const jokerPlayer = round.jokerId ? players.find((p) => p.id === round.jokerId) : undefined;
  const takenPartnerId = jokerGroup?.memberIds.find((id) => id !== round.jokerId);
  const takenPartnerName = takenPartnerId
    ? players.find((p) => p.id === takenPartnerId)?.name
    : undefined;

  const originalGroups = round.groups.filter((g) => !g.isJoker);
  const allPairsDecided = originalGroups.every((g) =>
    g.memberIds.every((id) => round.results[id] !== undefined),
  );

  return (
    <div className="scroll">
      <div className="group-grid">
        {round.groups.map((g, i) => {
          const members = g.memberIds
            .map((id) => players.find((p) => p.id === id))
            .filter((p): p is Player => p !== undefined);

          if (g.isJoker) {
            return (
              <div key={g.id} className="group-card group-card--joker">
                <span className="group-title">
                  Joker
                  <span className="group-names">
                    {members.map((m) => m.name).join(category === 'DUELL' ? ' gegen ' : ' & ')}
                  </span>
                </span>
                <div className="group-members">
                  {members.map((m) => (
                    <MemberRow key={m.id} player={m} round={round} />
                  ))}
                </div>
                <ResultToggle
                  category={category}
                  group={g}
                  members={members}
                  round={round}
                  dispatch={dispatch}
                />
              </div>
            );
          }

          if (members.length < 2) {
            // Diese Person hat der Joker abgeholt - ihr erstes Ergebnis zählt
            // nicht mehr, hier bleibt nur noch die andere, fertig entschiedene.
            const remaining = members[0];
            if (!remaining) return null;
            return (
              <div key={g.id} className="group-card group-card--reduced">
                <span className="group-title">
                  {category === 'DUELL' ? 'Duell' : 'Zweigespann'} {i + 1}
                </span>
                <div className="group-members">
                  <MemberRow player={remaining} round={round} />
                </div>
                <p className="group-note">
                  {takenPartnerName ?? 'Der Partner'} spielt jetzt mit dem Joker - zählt hier nicht
                  mehr.
                </p>
              </div>
            );
          }

          return (
            <div key={g.id} className="group-card">
              <span className="group-title">
                {category === 'DUELL' ? 'Duell' : 'Zweigespann'} {i + 1}
                <span className="group-names">
                  {members.map((m) => m.name).join(category === 'DUELL' ? ' gegen ' : ' & ')}
                </span>
              </span>
              <div className="group-members">
                {members.map((m) => (
                  <MemberRow key={m.id} player={m} round={round} />
                ))}
              </div>
              <ResultToggle
                category={category}
                group={g}
                members={members}
                round={round}
                dispatch={dispatch}
              />
            </div>
          );
        })}
      </div>

      {jokerPlayer && !jokerGroup && (
        <div className="joker-pick">
          {allPairsDecided ? (
            <>
              <p className="section-title" style={{ margin: '18px 0 10px' }}>
                {jokerPlayer.name} ist Joker - wählt jetzt eine Person für eine zweite Runde
              </p>
              <div className="pool-grid">
                {originalGroups
                  .flatMap((g) => g.memberIds)
                  .map((id) => {
                    const p = players.find((x) => x.id === id);
                    if (!p) return null;
                    const ok = round.results[id] === 'success';
                    return (
                      <button
                        key={id}
                        type="button"
                        className="pool-player"
                        onClick={() => dispatch({ type: 'PICK_JOKER_PARTNER', partnerId: id })}
                      >
                        <span className="dot" style={{ background: PLAYER_COLORS[p.colorIndex] }} />
                        <span style={{ flex: 1 }}>{p.name}</span>
                        <span className={`result-hint ${ok ? 'ok' : 'no'}`}>
                          {ok ? 'Geschafft' : 'Nicht geschafft'}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </>
          ) : (
            <p className="joker-note" style={{ marginTop: 18 }}>
              <strong>{jokerPlayer.name}</strong> ist Joker und wählt sich gleich eine Person für
              eine zweite, entscheidende Runde - erst müssen alle Paare oben fertig entscheiden.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
