/*
 * ============================================================================
 *  TIMER FUER EINZELNE CHALLENGES
 * ============================================================================
 *
 * Manche Challenges laufen gegen eine Uhr, die am Tisch sichtbar sein soll -
 * zum Beispiel der Dosenturm mit einer Minute Bauzeit. Taucht eine
 * Challenge-ID hier auf, zeigt die App darunter einen Countdown, der sich
 * beliebig oft neu starten laesst.
 *
 * Neuen Timer anlegen:
 *
 *   'solo-04': { label: 'Bauzeit', seconds: 45 }
 *
 * ============================================================================
 */

export interface TimerConfig {
  /** Ueberschrift ueber dem Countdown. */
  label: string;
  /** Dauer in Sekunden. */
  seconds: number;
}

export const timers: Record<string, TimerConfig> = {
  'solo-03': { label: 'Bauzeit', seconds: 60 },
};

/** Liefert den Timer einer Challenge - oder undefined, wenn sie keinen hat. */
export function timerFor(challengeId: string | null | undefined): TimerConfig | undefined {
  if (!challengeId) return undefined;
  return timers[challengeId];
}
