import { describe, expect, it } from 'vitest';
import { rotationFor, spinWheel, wheelFor, wheels, type Wheel } from './wheels';
import { challenges } from './challenges';

const wheel: Wheel = wheels['duell-02'];

/** Winkel, unter dem das Feld nach der Drehung tatsaechlich steht. */
function angleAtPointer(w: Wheel, index: number, rotation: number): number {
  const segment = 360 / w.values.length;
  const center = index * segment + segment / 2;
  return (((center + rotation) % 360) + 360) % 360;
}

describe('Zufallsrad', () => {
  it('haengt an einer existierenden Challenge', () => {
    for (const id of Object.keys(wheels)) {
      expect(challenges.some((c) => c.id === id)).toBe(true);
    }
  });

  it('liefert nur fuer hinterlegte Challenges ein Rad', () => {
    expect(wheelFor('duell-02')).toBe(wheel);
    expect(wheelFor('solo-01')).toBeUndefined();
    expect(wheelFor(null)).toBeUndefined();
  });

  it('dreht jedes Feld exakt unter den Zeiger', () => {
    for (let i = 0; i < wheel.values.length; i++) {
      // 270 Grad entspricht -90 Grad, also der Zeigerposition oben.
      expect(angleAtPointer(wheel, i, rotationFor(wheel, i))).toBeCloseTo(270, 6);
    }
  });

  it('dreht immer vorwaerts und mindestens vier volle Umdrehungen weiter', () => {
    let current = 0;
    for (const index of [3, 0, 6, 6, 1]) {
      const next = rotationFor(wheel, index, current);
      expect(next - current).toBeGreaterThanOrEqual(4 * 360);
      expect(angleAtPointer(wheel, index, next)).toBeCloseTo(270, 6);
      current = next;
    }
  });

  it('trifft mit dem Zufallsgenerator jedes Feld und bleibt im Bereich', () => {
    expect(spinWheel(wheel, () => 0)).toBe(0);
    expect(spinWheel(wheel, () => 0.999999)).toBe(wheel.values.length - 1);
    for (const r of [0.1, 0.35, 0.5, 0.77, 0.95]) {
      const index = spinWheel(wheel, () => r);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(wheel.values.length);
    }
  });
});
