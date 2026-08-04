import { useState } from 'react';
import { CategoryPicker } from '../components/CategoryPicker';
import { ChallengeCard } from '../components/ChallengeCard';
import { ChipPicker } from '../components/ChipPicker';
import { LuckyWheel, type WheelSpin } from '../components/LuckyWheel';
import { OverviewPanel } from '../components/OverviewPanel';
import { PlayerCard } from '../components/PlayerCard';
import { ResolvePanel } from '../components/ResolvePanel';
import { TeamBuilder } from '../components/TeamBuilder';
import { availableChallenges, challengeById, drawChallenge } from '../data/challenges';
import { wheelFor } from '../data/wheels';
import {
  currentRound,
  playersWithoutBet,
  playersWithoutResult,
  validateGroups,
  type GameAction,
} from '../game/reducer';
import { remainingBudget } from '../game/selectors';
import {
  CATEGORIES,
  CATEGORY_INFO,
  PLAYER_COLORS,
  type Category,
  type GameState,
  type RoundPhase,
} from '../game/types';

interface Props {
  state: GameState;
  dispatch: (action: GameAction) => void;
  canUndo: boolean;
  onUndo: () => void;
  onQuit: () => void;
}

const PHASE_TITLE: Record<RoundPhase, string> = {
  challenge: 'Challenge',
  groups: 'Paare bilden',
  betting: 'Einsätze',
  joker: 'Joker wählt seine Gruppe',
  resolve: 'Auswertung',
};

export function RoundScreen({ state, dispatch, canUndo, onUndo, onQuit }: Props) {
  const [showOverview, setShowOverview] = useState(false);
  const [filter, setFilter] = useState<Category | null>(null);
  // Letzter Dreh samt Challenge-ID: So verfaellt das Ergebnis automatisch,
  // sobald eine andere Challenge gezogen wird, bleibt aber ueber die Phasen
  // einer Runde hinweg stehen.
  const [wheelSpin, setWheelSpin] = useState<{ challengeId: string; spin: WheelSpin } | null>(null);

  const round = currentRound(state);
  const starter = state.players.find((p) => p.id === round.starterId);
  const challenge = round.challengeId ? challengeById(round.challengeId) : undefined;
  const needsGroups = round.category ? CATEGORY_INFO[round.category].needsGroups : false;

  const wheel = wheelFor(challenge?.id);
  const spin = wheelSpin && wheelSpin.challengeId === challenge?.id ? wheelSpin.spin : null;
  const wheelBlock =
    wheel && challenge ? (
      <LuckyWheel
        wheel={wheel}
        spin={spin}
        onSpin={(next) => setWheelSpin({ challengeId: challenge.id, spin: next })}
      />
    ) : null;

  // Nur die tatsächlich vorkommenden Phasen als Fortschrittspunkte anzeigen.
  const phases: RoundPhase[] = ['challenge'];
  if (needsGroups) phases.push('groups');
  phases.push('betting');
  if (needsGroups) phases.push('joker');
  phases.push('resolve');
  const phaseIndex = phases.indexOf(round.phase);

  function drawNew() {
    const drawn = drawChallenge(state.usedChallengeIds, filter);
    if (!drawn) return;
    dispatch({ type: 'SET_CHALLENGE', challengeId: drawn.id, category: drawn.category });
  }

  const missingBets = playersWithoutBet(state);
  const missingResults = playersWithoutResult(state);
  const groupCheck = validateGroups(state.players, round.groups);
  const poolLeft = availableChallenges(state.usedChallengeIds, filter).length;

  return (
    <div className="screen">
      <div className="topbar">
        <span className="topbar-round">
          Runde {round.index + 1}
          <small> / {state.totalRounds}</small>
        </span>
        {starter && (
          <span className="topbar-starter">
            <span className="label">Startspieler</span>
            <span className="dot" style={{ background: PLAYER_COLORS[starter.colorIndex] }} />
            <span className="name">{starter.name}</span>
          </span>
        )}
        <div className="phase-steps" aria-hidden="true">
          {phases.map((p, i) => (
            <span
              key={p}
              className={`phase-step${i === phaseIndex ? ' active' : i < phaseIndex ? ' done' : ''}`}
            />
          ))}
        </div>
        <div className="topbar-spacer" />
        <button type="button" className="btn btn-sm" onClick={() => setShowOverview(true)}>
          Übersicht
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={onQuit}>
          Beenden
        </button>
      </div>

      <div className="phase">
        <div className="phase-head">
          <span className="phase-title">{PHASE_TITLE[round.phase]}</span>
          <span className="phase-hint">{phaseHint(round.phase, state, needsGroups)}</span>
        </div>

        {round.phase === 'challenge' &&
          (state.mode === 'cards' ? (
            <div className="scroll">
              <CategoryPicker
                selected={round.category}
                onSelect={(category) => dispatch({ type: 'SET_CATEGORY', category })}
              />
            </div>
          ) : (
            <div className="scroll">
              <div className="rounds-row" style={{ marginBottom: 16 }}>
                <button
                  type="button"
                  className="round-pill"
                  style={{ minWidth: 90 }}
                  aria-pressed={filter === null}
                  onClick={() => setFilter(null)}
                >
                  Alle
                </button>
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`round-pill cat-${c.toLowerCase()}`}
                    style={{ minWidth: 130 }}
                    aria-pressed={filter === c}
                    onClick={() => setFilter(c)}
                  >
                    {CATEGORY_INFO[c].label}
                  </button>
                ))}
              </div>

              {challenge ? (
                <>
                  <ChallengeCard challenge={challenge} />
                  {wheelBlock}
                </>
              ) : poolLeft === 0 ? (
                <p className="empty-note">
                  In dieser Kategorie sind alle hinterlegten Challenges verbraucht. Wähle eine
                  andere Kategorie oder trage weitere Challenges in{' '}
                  <code>src/data/challenges.ts</code> ein.
                </p>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                  <button type="button" className="btn btn-lg btn-primary" onClick={drawNew}>
                    Challenge ziehen ({poolLeft} übrig)
                  </button>
                </div>
              )}
            </div>
          ))}

        {round.phase === 'groups' && (
          <TeamBuilder
            players={state.players}
            groups={round.groups}
            jokerId={round.jokerId}
            onChange={(groups) => dispatch({ type: 'SET_GROUPS', groups })}
          />
        )}

        {round.phase === 'betting' && (
          <div className="scroll">
            {challenge && state.mode === 'prepared' && (
              <div style={{ marginBottom: 16 }}>
                <ChallengeCard challenge={challenge} />
                {wheelBlock}
              </div>
            )}
            <div className="player-grid">
              {state.players.map((p) => {
                const groupIndex = round.groups.findIndex((g) => g.memberIds.includes(p.id));
                const note =
                  round.jokerId === p.id
                    ? 'Joker'
                    : groupIndex >= 0
                      ? `Paar ${groupIndex + 1}`
                      : `${remainingBudget(p)} P. übrig`;
                return (
                  <PlayerCard
                    key={p.id}
                    player={p}
                    isStarter={p.id === round.starterId}
                    note={note}
                    done={round.bets[p.id] !== undefined}
                  >
                    <ChipPicker
                      player={p}
                      selected={round.bets[p.id]}
                      onSelect={(chip) => dispatch({ type: 'PLACE_BET', playerId: p.id, chip })}
                      onClear={() => dispatch({ type: 'CLEAR_BET', playerId: p.id })}
                    />
                  </PlayerCard>
                );
              })}
            </div>
          </div>
        )}

        {round.phase === 'joker' && round.jokerId && (
          <div className="scroll">
            <div className="joker-note" style={{ marginBottom: 18 }}>
              <strong>{state.players.find((p) => p.id === round.jokerId)?.name}</strong> hat bereits
              gesetzt und darf sich jetzt - nachdem alle Paare gespielt haben - eine Gruppe
              aussuchen.
            </div>
            <div className="group-grid">
              {round.groups.map((g, i) => (
                <button
                  key={g.id}
                  type="button"
                  className="group-card is-selectable"
                  style={{ textAlign: 'left' }}
                  onClick={() => dispatch({ type: 'ASSIGN_JOKER', groupId: g.id })}
                >
                  <span className="group-title">Paar {i + 1} - antippen</span>
                  <div className="group-members">
                    {g.memberIds.map((id) => {
                      const p = state.players.find((x) => x.id === id);
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
          </div>
        )}

        {round.phase === 'resolve' && (
          <>
            {wheelBlock}
            <ResolvePanel players={state.players} round={round} dispatch={dispatch} />
          </>
        )}
      </div>

      <div className="actionbar">
        <button type="button" className="btn btn-sm btn-ghost" disabled={!canUndo} onClick={onUndo}>
          Zurück
        </button>
        {round.phase === 'challenge' && state.mode === 'prepared' && challenge && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={drawNew}
            disabled={poolLeft === 0}
          >
            Neu ziehen
          </button>
        )}
        <div className="spacer" />

        {round.phase === 'challenge' && (
          <>
            {!round.category && <span className="warn">Kategorie wählen.</span>}
            <button
              type="button"
              className="btn btn-primary"
              disabled={!round.category}
              onClick={() => dispatch({ type: 'CONFIRM_CHALLENGE' })}
            >
              Weiter
            </button>
          </>
        )}

        {round.phase === 'groups' && (
          <>
            {!groupCheck.ok && <span className="warn">{groupCheck.reason}</span>}
            <button
              type="button"
              className="btn btn-primary"
              disabled={!groupCheck.ok}
              onClick={() => dispatch({ type: 'CONFIRM_GROUPS' })}
            >
              Weiter zu den Einsätzen
            </button>
          </>
        )}

        {round.phase === 'betting' && (
          <>
            {missingBets.length > 0 && (
              <span className="warn">
                Fehlt noch: {missingBets.map((p) => p.name).join(', ')}
              </span>
            )}
            <button
              type="button"
              className="btn btn-primary"
              disabled={missingBets.length > 0}
              onClick={() => dispatch({ type: 'CONFIRM_BETS' })}
            >
              Einsätze bestätigen
            </button>
          </>
        )}

        {round.phase === 'joker' && <span className="warn">Gruppe antippen.</span>}

        {round.phase === 'resolve' && (
          <>
            {missingResults.length > 0 && (
              <span className="warn">
                Offen: {missingResults.map((p) => p.name).join(', ')}
              </span>
            )}
            <button
              type="button"
              className="btn btn-primary"
              disabled={missingResults.length > 0}
              onClick={() => dispatch({ type: 'FINISH_ROUND' })}
            >
              {round.index + 1 >= state.totalRounds ? 'Spiel auswerten' : 'Runde abschließen'}
            </button>
          </>
        )}
      </div>

      {showOverview && <OverviewPanel state={state} onClose={() => setShowOverview(false)} />}
    </div>
  );
}

function phaseHint(phase: RoundPhase, state: GameState, needsGroups: boolean): string {
  switch (phase) {
    case 'challenge':
      return state.mode === 'cards'
        ? 'Karte vorlesen und die Kategorie antippen.'
        : 'Challenge ziehen und laut vorlesen.';
    case 'groups':
      return 'Zwei Spieler antippen, um ein Paar zu bilden.';
    case 'betting':
      return needsGroups
        ? 'Jeder setzt einen Chip - auch der Joker.'
        : 'Jeder setzt einen Chip, bevor gespielt wird.';
    case 'joker':
      return 'Erst jetzt, nachdem die Paare gespielt haben.';
    case 'resolve':
      return 'Wer es geschafft hat, bankt seine Punkte.';
  }
}
