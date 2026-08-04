import { rotationFor, spinWheel, type Wheel } from '../data/wheels';

export interface WheelSpin {
  /** Getroffenes Feld. */
  index: number;
  /** Absolute Drehung in Grad - waechst mit jedem Dreh, damit die Animation laeuft. */
  rotation: number;
}

interface Props {
  wheel: Wheel;
  spin: WheelSpin | null;
  onSpin: (spin: WheelSpin) => void;
}

/** Farben der Felder aus der Palette des Originalspiels, zyklisch wiederholt. */
const SEGMENT_STYLES = [
  { fill: '#f57623', ink: '#ffffff' },
  { fill: '#35bde3', ink: '#14181f' },
  { fill: '#e23c8e', ink: '#ffffff' },
  { fill: '#ffc531', ink: '#14181f' },
  { fill: '#1f95a6', ink: '#ffffff' },
  { fill: '#8b4399', ink: '#ffffff' },
  { fill: '#0f6bc8', ink: '#ffffff' },
];

const CENTER = 120;
const RADIUS = 108;

/** Punkt auf dem Kreisrand - 0 Grad liegt bei 3 Uhr, positive Werte drehen im Uhrzeigersinn. */
function point(angleDeg: number, radius: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [CENTER + radius * Math.cos(rad), CENTER + radius * Math.sin(rad)];
}

export function LuckyWheel({ wheel, spin, onSpin }: Props) {
  const segment = 360 / wheel.values.length;

  function handleSpin() {
    const index = spinWheel(wheel);
    onSpin({ index, rotation: rotationFor(wheel, index, spin?.rotation ?? 0) });
  }

  return (
    <div className="wheel-box">
      <div className="wheel-stage">
        <span className="wheel-pointer" aria-hidden="true" />
        <svg
          className="wheel-svg"
          viewBox="0 0 240 240"
          style={{ transform: `rotate(${spin?.rotation ?? 0}deg)` }}
          aria-hidden="true"
        >
          {wheel.values.map((value, i) => {
            const style = SEGMENT_STYLES[i % SEGMENT_STYLES.length];
            const [x0, y0] = point(i * segment, RADIUS);
            const [x1, y1] = point((i + 1) * segment, RADIUS);
            const largeArc = segment > 180 ? 1 : 0;
            const center = i * segment + segment / 2;
            const labelX = CENTER + RADIUS * 0.62;
            // Die Zahl wird um die eigene Achse zurueckgedreht, damit sie im
            // Stillstand waagerecht steht - egal wo das Rad stehen bleibt.
            const upright = -((spin?.rotation ?? 0) + center);
            return (
              <g key={value}>
                <path
                  d={`M ${CENTER} ${CENTER} L ${x0} ${y0} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x1} ${y1} Z`}
                  fill={style.fill}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x={labelX}
                  y={CENTER}
                  transform={`rotate(${center} ${CENTER} ${CENTER}) rotate(${upright} ${labelX} ${CENTER})`}
                  fill={style.ink}
                  fontSize="22"
                  fontWeight="800"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {value}
                </text>
              </g>
            );
          })}
          <circle cx={CENTER} cy={CENTER} r="18" fill="#ffffff" stroke="#14181f" strokeWidth="3" />
        </svg>
      </div>

      <div className="wheel-body">
        <div className="wheel-head">
          <span className="wheel-title">{wheel.title}</span>
          <span className="wheel-hint">{wheel.hint}</span>
        </div>

        <p className="wheel-result" aria-live="polite">
          {spin ? (
            <>
              <strong>{wheel.values[spin.index]}</strong> {wheel.unit}
            </>
          ) : (
            <span className="wheel-result-empty">Noch nicht gedreht</span>
          )}
        </p>

        <button type="button" className="btn btn-lg btn-primary" onClick={handleSpin}>
          {spin ? 'Nochmal drehen' : 'Rad drehen'}
        </button>
      </div>
    </div>
  );
}
