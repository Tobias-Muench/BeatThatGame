import { chipCounts } from '../game/selectors';
import type { ChipValue, Player } from '../game/types';

interface Props {
  player: Player;
  selected?: ChipValue;
  onSelect: (chip: ChipValue) => void;
  onClear: () => void;
}

/**
 * Zeigt die verbleibenden Chips eines Spielers als antippbare Tokens.
 * Ein erneuter Tipp auf den gewählten Chip nimmt den Einsatz zurück.
 */
export function ChipPicker({ player, selected, onSelect, onClear }: Props) {
  const counts = chipCounts(player.chips);

  if (counts.length === 0) {
    return <p className="phase-hint">Keine Chips mehr übrig.</p>;
  }

  return (
    <div className="chip-row">
      {counts.map(({ value, count }) => {
        const isSelected = selected === value;
        // Der gesetzte Chip ist bereits reserviert - Restanzahl entsprechend anzeigen.
        const left = isSelected ? count - 1 : count;
        return (
          <button
            key={value}
            type="button"
            className={`chip v${value}`}
            aria-pressed={isSelected}
            aria-label={`${value} Punkte setzen, ${count} vorhanden`}
            onClick={() => (isSelected ? onClear() : onSelect(value))}
          >
            {value}
            <span className="count">{left}x</span>
          </button>
        );
      })}
    </div>
  );
}
