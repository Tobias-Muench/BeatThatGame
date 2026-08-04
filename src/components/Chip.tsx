import type { ChipValue } from '../game/types';

/** Nicht anklickbare Chip-Darstellung. */
export function ChipToken({ value, small = false }: { value: ChipValue; small?: boolean }) {
  return (
    <span className={`chip-static v${value}${small ? ' sm' : ''}`} aria-label={`${value} Punkte`}>
      {value}
    </span>
  );
}
