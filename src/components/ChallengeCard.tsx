import { CATEGORY_INFO, type Challenge } from '../game/types';

export function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const info = CATEGORY_INFO[challenge.category];
  return (
    <div className={`challenge-card cat-${challenge.category.toLowerCase()}`}>
      <span className="cc-cat">
        {info.label} - {info.short}
      </span>
      <h2 className="cc-title">{challenge.title}</h2>
      <p className="cc-text">{challenge.text}</p>
      {(challenge.timeLimitSec || challenge.material?.length) && (
        <div className="challenge-meta">
          {challenge.timeLimitSec && (
            <span className="meta-chip">Zeitlimit: {challenge.timeLimitSec} Sekunden</span>
          )}
          {challenge.material?.map((m) => (
            <span className="meta-chip" key={m}>
              {m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
