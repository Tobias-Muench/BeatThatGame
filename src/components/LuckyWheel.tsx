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

/** Farben der Felder, werden bei mehr Feldern zyklisch wiederholt. */
const SEGMENT_STYLES = [
  { fill: '#f5b301', ink: '#10131a' },
  { fill: '#2b3242', ink: '#eef2f8' },
  { fill: '#ef8a3c', ink: '#10131a' },
  { fill: '#232937', ink: '#eef2f8' },
  { fill: '#f5b301', ink: '#10131a' },
  { fill: '#2b3242', ink: '#eef2f8' },
  { fill: '#ef8a3c', ink: '#10131a' },
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
                  stroke="#10131a"
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
          <circle cx={CENTER} cy={CENTER} r="18" fill="#10131a" stroke="#f5b301" strokeWidth="3" />
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
