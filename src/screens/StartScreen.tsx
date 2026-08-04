interface Props {
  hasSavedGame: boolean;
  onContinue: () => void;
  onNewGame: () => void;
}

export function StartScreen({ hasSavedGame, onContinue, onNewGame }: Props) {
  return (
    <div className="screen">
      <div className="centered">
        <div className="brand">
          <h1>
            Beat <em>That!</em>
          </h1>
          <p>Digitaler Spielleiter - Chips, Punkte und Runden</p>
        </div>

        <div className="stack">
          {hasSavedGame && (
            <button type="button" className="btn btn-lg btn-primary" onClick={onContinue}>
              Spiel fortsetzen
            </button>
          )}
          <button
            type="button"
            className={`btn btn-lg${hasSavedGame ? '' : ' btn-primary'}`}
            onClick={onNewGame}
          >
            Neues Spiel
          </button>
        </div>

        <p className="phase-hint" style={{ maxWidth: 520, lineHeight: 1.5 }}>
          Jeder Spieler startet mit 10 Chips: fünf Einer, drei Dreier und zwei Fünfer. Wer eine
          Challenge schafft, bankt die Punkte seines Chips - wer scheitert, verliert sie an die
          Bank. Jeder Chip lässt sich nur einmal setzen.
        </p>
      </div>
    </div>
  );
}
