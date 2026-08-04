import { useState } from 'react';
import { saveRoster } from '../game/storage';
import { MAX_PLAYERS, MIN_PLAYERS, PLAYER_COLORS, type GameMode } from '../game/types';

interface Props {
  initialNames: string[];
  onCancel: () => void;
  onStart: (names: string[], mode: GameMode) => void;
}

export function SetupScreen({ initialNames, onCancel, onStart }: Props) {
  const [names, setNames] = useState<string[]>(() => {
    const base = initialNames.filter((n) => n.trim()).slice(0, MAX_PLAYERS);
    while (base.length < MIN_PLAYERS) base.push('');
    return base;
  });
  const [mode, setMode] = useState<GameMode>('cards');

  const filled = names.map((n) => n.trim()).filter(Boolean);
  const canStart = filled.length >= MIN_PLAYERS;

  function update(index: number, value: string) {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  }

  function start() {
    if (!canStart) return;
    saveRoster(filled);
    onStart(filled, mode);
  }

  return (
    <div className="screen">
      <div className="topbar">
        <span className="topbar-round">Neues Spiel</span>
        <div className="topbar-spacer" />
        <button type="button" className="btn btn-sm btn-ghost" onClick={onCancel}>
          Abbrechen
        </button>
      </div>

      <div className="setup-grid">
        <div className="setup-col">
          <h2>Spieler ({filled.length})</h2>
          <div className="player-inputs">
            {names.map((name, i) => (
              <div className="player-input-row" key={i}>
                <span className="dot" style={{ background: PLAYER_COLORS[i % PLAYER_COLORS.length] }} />
                <input
                  value={name}
                  placeholder={`Spieler ${i + 1}`}
                  maxLength={16}
                  onChange={(e) => update(i, e.target.value)}
                  aria-label={`Name Spieler ${i + 1}`}
                />
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Spieler ${i + 1} entfernen`}
                  disabled={names.length <= MIN_PLAYERS}
                  onClick={() => setNames((prev) => prev.filter((_, j) => j !== i))}
                >
                  &minus;
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-sm"
            disabled={names.length >= MAX_PLAYERS}
            onClick={() => setNames((prev) => [...prev, ''])}
          >
            + Spieler hinzufügen
          </button>
          <p className="phase-hint" style={{ marginTop: 4 }}>
            Die Reihenfolge, wer beginnt, wird beim Start ausgewürfelt - unabhängig davon, in
            welcher Reihenfolge ihr die Namen hier eintragt.
          </p>
        </div>

        <div className="setup-col">
          <h2>Woher kommen die Challenges?</h2>
          <div className="option-list">
            <button
              type="button"
              className="option"
              aria-pressed={mode === 'cards'}
              onClick={() => setMode('cards')}
            >
              <span className="opt-name">Karten am Tisch</span>
              <span className="opt-desc">
                Ihr zieht die Challenges wie gewohnt von den echten Karten. Die App fragt pro Runde
                nur nach der Kategorie und verwaltet Chips und Punkte.
              </span>
            </button>
            <button
              type="button"
              className="option"
              aria-pressed={mode === 'prepared'}
              onClick={() => setMode('prepared')}
            >
              <span className="opt-name">Vorbereitet in der App</span>
              <span className="opt-desc">
                Die hinterlegten Challenges werden pro Runde zufällig gezogen und groß angezeigt.
              </span>
            </button>
          </div>

          <p className="phase-hint" style={{ marginTop: 8 }}>
            Ein Spiel dauert immer 10 Runden - genau so viele wie Chips pro Spieler.
          </p>
        </div>
      </div>

      <div className="actionbar">
        {!canStart && <span className="warn">Mindestens {MIN_PLAYERS} Spieler eintragen.</span>}
        <div className="spacer" />
        <button type="button" className="btn btn-primary" disabled={!canStart} onClick={start}>
          Spiel starten
        </button>
      </div>
    </div>
  );
}
