import type { ReactNode } from 'react';
import { PLAYER_COLORS, type Player } from '../game/types';

interface Props {
  player: Player;
  isStarter?: boolean;
  /** Rechts oben, z. B. Gruppenname oder Punktestand. */
  note?: ReactNode;
  done?: boolean;
  children: ReactNode;
}

export function PlayerCard({ player, isStarter, note, done, children }: Props) {
  return (
    <div className={`player-card${done ? ' is-done' : ''}`}>
      <div className="player-head">
        <span className="dot" style={{ background: PLAYER_COLORS[player.colorIndex] }} />
        <span className="player-name">{player.name}</span>
        {isStarter && <span className="starter-badge">START</span>}
        {note !== undefined && <span className="player-sub">{note}</span>}
      </div>
      {children}
    </div>
  );
}
