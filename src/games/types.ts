/**
 * Shared contract every OP Play game component implements.
 *
 * The surrounding <GameShell /> owns the ad flow, score persistence,
 * high scores, pause button and the game-over screen. A game component
 * only has to play, report score changes and report the end of a run.
 */
export interface GameProps {
  /** Report the current live score (called as the score changes). */
  onScore: (score: number) => void;
  /** Report the run has ended with a final score. */
  onGameOver: (score: number) => void;
  /** Optional extra HUD info rendered by the shell (lives, level, combo...). */
  onStat?: (stats: Record<string, string | number>) => void;
  /** When true the game must freeze its loop and timers. */
  paused: boolean;
  /** Compact mode is used inside iframe embeds. */
  compact?: boolean;
}

export type GameComponent = React.ComponentType<GameProps>;

/** Utility: clamp a number. */
export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
