import { useEffect, useRef, useState } from 'react';

interface Props {
  label: string;
  seconds: number;
}

/** Countdown fuer Challenges mit Zeitlimit am Tisch - laesst sich beliebig oft neu starten. */
export function CountdownTimer({ label, seconds }: Props) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  const endsAtRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAtRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) setRunning(false);
    }, 200);
    return () => clearInterval(id);
  }, [running]);

  function start() {
    endsAtRef.current = Date.now() + seconds * 1000;
    setRemaining(seconds);
    setRunning(true);
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const timeUp = !running && remaining === 0;

  return (
    <div className={`timer-box${timeUp ? ' timer-box--done' : ''}`}>
      <div className="timer-body">
        <span className="timer-title">{label}</span>
        <span className="timer-clock" aria-live="polite">
          {mm}:{ss}
        </span>
      </div>
      <button type="button" className="btn btn-lg btn-primary" onClick={start}>
        {running || remaining < seconds ? 'Neu starten' : 'Start'}
      </button>
    </div>
  );
}
