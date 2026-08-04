/*
 * ============================================================================
 *  ZUFALLSRAEDER FUER EINZELNE CHALLENGES
 * ============================================================================
 *
 * Manche Challenges brauchen vor jedem Durchgang eine ausgeloste Zahl -
 * zum Beispiel das Zielgewicht beim Wet-T-Shirt-Duell. Statt dafuer die
 * Challenge-Datenstruktur aufzublaehen, haengt hier pro Challenge-ID ein
 * Rad. Taucht eine ID unten auf, zeigt die App das Rad automatisch neben
 * der Challenge an - in der Challenge-, Einsatz- und Auswertungsphase, so
 * dass waehrend einer Runde beliebig oft neu gedreht werden kann.
 *
 * Neues Rad anlegen:
 *
 *   'duell-03': {
 *     title:  'Zielgewicht drehen',
 *     hint:   'Vor jedem Duell einmal drehen.',
 *     unit:   'g',
 *     values: [300, 325, 350, 400, 425, 450, 500],
 *   }
 *
 * ============================================================================
 */

export interface Wheel {
  /** Ueberschrift ueber dem Rad. */
  title: string;
  /** Kurzer Hinweis, wann gedreht wird. */
  hint: string;
  /** Einheit hinter der gedrehten Zahl, z.B. 'g'. */
  unit: string;
  /** Die Felder des Rads, im Uhrzeigersinn. */
  values: number[];
}

export const wheels: Record<string, Wheel> = {
  'duell-02': {
    title: 'Zielgewicht drehen',
    hint: 'Vor jedem Duell einmal drehen. Gilt für beide Spieler des Paares.',
    unit: 'g',
    values: [300, 325, 350, 400, 425, 450, 500],
  },
};

/** Liefert das Rad einer Challenge - oder undefined, wenn sie keins hat. */
export function wheelFor(challengeId: string | null | undefined): Wheel | undefined {
  if (!challengeId) return undefined;
  return wheels[challengeId];
}

/** Zieht ein zufaelliges Feld und liefert dessen Index. */
export function spinWheel(wheel: Wheel, random: () => number = Math.random): number {
  return Math.floor(random() * wheel.values.length);
}

/**
 * Berechnet die absolute Drehung in Grad, bei der das gewaehlte Feld oben
 * unter dem Zeiger liegt. Das Ergebnis liegt immer mindestens vier volle
 * Umdrehungen ueber der bisherigen Drehung, damit die Animation sichtbar
 * laeuft und nie rueckwaerts springt.
 */
export function rotationFor(wheel: Wheel, index: number, current = 0): number {
  const segment = 360 / wheel.values.length;
  // Mittelpunkt des Feldes, gemessen wie im SVG ab 3 Uhr im Uhrzeigersinn.
  const center = index * segment + segment / 2;
  // Der Zeiger sitzt oben, also bei -90 Grad.
  const target = -90 - center;
  return Math.ceil((current + 4 * 360 - target) / 360) * 360 + target;
}
