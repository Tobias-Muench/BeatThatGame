import { useEffect, useState } from 'react';
import { CategoryPicker } from '../components/CategoryPicker';
import { ChallengeCard } from '../components/ChallengeCard';
import { ChipPicker } from '../components/ChipPicker';
import { CountdownTimer } from '../components/CountdownTimer';
import { LuckyWheel, type WheelSpin } from '../components/LuckyWheel';
import { OverviewPanel } from '../components/OverviewPanel';
import { PlayerCard } from '../components/PlayerCard';
import { ResolvePanel } from '../components/ResolvePanel';
import { TeamBuilder } from '../components/TeamBuilder';
import { availableChallenges, challengeById, drawChallenge } from '../data/challenges';
import { timerFor } from '../data/timers';
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
  type GameState,
  type Player,
  type Round,
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
  resolve: 'Auswertung',
};

export function RoundScreen({ state, dispatch, canUndo, onUndo, onQuit }: Props) {
  const [showOverview, setShowOverview] = useState(false);
  // Letzter Dreh samt Challenge-ID: So verfaellt das Ergebnis automatisch,
  // sobald eine andere Challenge gezogen wird, bleibt aber ueber die Phasen
  // einer Runde hinweg stehen.
  const [wheelSpin, setWheelSpin] = useState<{ challengeId: string; spin: WheelSpin } | null>(null);
  // Runde, deren Einsätze bereits aufgedeckt sind. Bis dahin sieht man nur,
  // *dass* jemand gesetzt hat, nicht wie viel.
  const [revealedRound, setRevealedRound] = useState<number | null>(null);
  // Fuer welche Runde die Uebersicht schon automatisch eingeblendet wurde -
  // verhindert, dass sie beim naechsten Rerender erneut aufploppt.
  const [autoOverviewShownFor, setAutoOverviewShownFor] = useState<number | null>(null);

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

  const timer = timerFor(challenge?.id);
  const timerBlock =
    timer && challenge ? (
      <CountdownTimer key={challenge.id} label={timer.label} seconds={timer.seconds} />
    ) : null;

  // Nur die tatsächlich vorkommenden Phasen als Fortschrittspunkte anzeigen.
  const phases: RoundPhase[] = ['challenge'];
  if (needsGroups) phases.push('groups');
  phases.push('betting');
  phases.push('resolve');
  const phaseIndex = phases.indexOf(round.phase);

  const missingBets = playersWithoutBet(state);
  const missingResults = playersWithoutResult(state);
  const groupCheck = validateGroups(state.players, round.groups);
  const betsRevealed = revealedRound === round.index;
  const poolLeft = availableChallenges(state.usedChallengeIds, null).length;
  const remainingByCategory = CATEGORIES.map((c) => ({
    category: c,
    count: availableChallenges(state.usedChallengeIds, c).length,
  }));

  function drawNew() {
    const drawn = drawChallenge(state.usedChallengeIds, null);
    if (!drawn) return;
    dispatch({ type: 'SET_CHALLENGE', challengeId: drawn.id, category: drawn.category });
  }

  // Im Modus "prepared" wird die Challenge automatisch gezogen - keine
  // Kategorie-Auswahl mehr, es kommt einfach die naechste zufaellige.
  useEffect(() => {
    if (state.mode === 'prepared' && round.phase === 'challenge' && !round.challengeId) {
      const drawn = drawChallenge(state.usedChallengeIds, null);
      if (drawn) dispatch({ type: 'SET_CHALLENGE', challengeId: drawn.id, category: drawn.category });
    }
  }, [state.mode, round.phase, round.challengeId, state.usedChallengeIds, dispatch]);

  // Nach jeder abgeschlossenen Runde erst den aktuellen Punktestand zeigen,
  // bevor es mit der naechsten Challenge weitergeht.
  useEffect(() => {
    if (round.index > 0 && autoOverviewShownFor !== round.index) {
      setShowOverview(true);
      setAutoOverviewShownFor(round.index);
    }
  }, [round.index, autoOverviewShownFor]);

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
              <div className="cat-remaining-row" style={{ marginBottom: 16 }}>
                {remainingByCategory.map(({ category: c, count }) => (
                  <span key={c} className={`cat-remaining-chip cat-${c.toLowerCase()}`}>
                    {CATEGORY_INFO[c].label} <strong>{count}</strong>
                  </span>
                ))}
              </div>

              {challenge ? (
                <>
                  <ChallengeCard challenge={challenge} />
                  {wheelBlock}
                  {timerBlock}
                </>
              ) : poolLeft === 0 ? (
                <p className="empty-note">
                  Alle hinterlegten Challenges sind vergriffen. Trage weitere in{' '}
                  <code>src/data/challenges.ts</code> ein.
                </p>
              ) : null}
            </div>
          ))}

        {round.phase === 'groups' && (
          <TeamBuilder
            players={state.players}
            groups={round.groups}
            jokerId={round.jokerId}
            starterId={round.starterId}
            onChange={(groups) => dispatch({ type: 'SET_GROUPS', groups })}
          />
        )}

        {round.phase === 'betting' && (
          <div className="scroll">
            {challenge && state.mode === 'prepared' && (
              <div style={{ marginBottom: 16 }}>
                <ChallengeCard challenge={challenge} />
                {wheelBlock}
                {timerBlock}
              </div>
            )}
            <div className="player-grid">
              {state.players.map((p) => {
                const hasBet = round.bets[p.id] !== undefined;
                const note =
                  round.jokerId === p.id
                    ? 'Joker'
                    : (groupNote(p.id, round, state.players) ??
                      `${remainingBudget(p)} P. übrig`);
                return (
                  <PlayerCard
                    key={p.id}
                    player={p}
                    isStarter={p.id === round.starterId}
                    note={note}
                    done={hasBet}
                  >
                    {hasBet && !betsRevealed ? (
                      // Verdeckt: Nur die Markierung, nicht der Wert.
                      <div className="bet-hidden">
                        <span className="bet-hidden-label">Gesetzt</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => dispatch({ type: 'CLEAR_BET', playerId: p.id })}
                        >
                          Ändern
                        </button>
                      </div>
                    ) : (
                      <ChipPicker
                        player={p}
                        selected={round.bets[p.id]}
                        onSelect={(chip) => dispatch({ type: 'PLACE_BET', playerId: p.id, chip })}
                        onClear={() => dispatch({ type: 'CLEAR_BET', playerId: p.id })}
                      />
                    )}
                  </PlayerCard>
                );
              })}
            </div>
          </div>
        )}

        {round.phase === 'resolve' && (
          <>
            {wheelBlock}
            {timerBlock}
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
            {betsRevealed ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={missingBets.length > 0}
                onClick={() => dispatch({ type: 'CONFIRM_BETS' })}
              >
                Einsätze bestätigen
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                disabled={missingBets.length > 0}
                onClick={() => setRevealedRound(round.index)}
              >
                Einsätze aufdecken
              </button>
            )}
          </>
        )}

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

/**
 * Beschriftung der Paarung eines Spielers - mit den Namen der Mitspieler,
 * damit man nicht raten muss, wer hinter "Paar 2" steckt.
 */
function groupNote(playerId: string, round: Round, players: Player[]): string | null {
  const index = round.groups.findIndex((g) => g.memberIds.includes(playerId));
  if (index < 0) return null;
  const label = round.category === 'DUELL' ? `Duell ${index + 1}` : `Paar ${index + 1}`;
  const others = round.groups[index].memberIds
    .filter((id) => id !== playerId)
    .map((id) => players.find((p) => p.id === id)?.name)
    .filter((name): name is string => name !== undefined);
  if (others.length === 0) return label;
  return `${label} · ${round.category === 'DUELL' ? 'gegen' : 'mit'} ${others.join(', ')}`;
}

function phaseHint(phase: RoundPhase, state: GameState, needsGroups: boolean): string {
  switch (phase) {
    case 'challenge':
      return state.mode === 'cards'
        ? 'Karte vorlesen und die Kategorie antippen.'
        : 'Automatisch gezogen - vorlesen, bei Bedarf unten neu ziehen.';
    case 'groups':
      return 'Reihum ab dem Startspieler: Wer dran ist, tippt seinen Partner an.';
    case 'betting':
      return needsGroups
        ? 'Jeder setzt verdeckt einen Chip - auch der Joker. Danach aufdecken.'
        : 'Jeder setzt verdeckt einen Chip. Danach aufdecken.';
    case 'resolve':
      return 'Wer es geschafft hat, bankt seine Punkte.';
  }
}
