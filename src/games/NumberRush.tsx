import { useCallback, useEffect, useRef, useState } from "react";
import type { GameProps } from "./types";

interface Tile {
  value: number;
  x: number;
  y: number;
  done: boolean;
}

const BASE_TIME = 45;
const BOARD_W = 100;
const BOARD_H = 100;
const TILE_SIZE = 14;

function generateTiles(count: number): Tile[] {
  const values = Array.from({ length: count }, (_, i) => i + 1);
  const placed: { x: number; y: number }[] = [];
  const tiles: Tile[] = [];
  for (const value of values) {
    let x = 0;
    let y = 0;
    let tries = 0;
    let ok = false;
    while (tries < 60 && !ok) {
      x = Math.random() * (BOARD_W - TILE_SIZE);
      y = Math.random() * (BOARD_H - TILE_SIZE);
      ok = placed.every((p) => Math.hypot(p.x - x, p.y - y) > TILE_SIZE * 0.85);
      tries += 1;
    }
    placed.push({ x, y });
    tiles.push({ value, x, y, done: false });
  }
  return tiles;
}

export default function NumberRush({ onScore, onGameOver, onStat, paused, compact }: GameProps) {
  const [level, setLevel] = useState(1);
  const [tiles, setTiles] = useState<Tile[]>(() => generateTiles(6));
  const [next, setNext] = useState(1);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(BASE_TIME);
  const [flash, setFlash] = useState<{ id: number; ok: boolean } | null>(null);
  const [ended, setEnded] = useState(false);
  const scoreRef = useRef(0);
  const endedRef = useRef(false);
  const flashIdRef = useRef(0);

  const endGame = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    setEnded(true);
    onGameOver(scoreRef.current);
  }, [onGameOver]);

  // countdown timer
  useEffect(() => {
    if (paused || ended) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [paused, ended, endGame]);

  useEffect(() => {
    onStat?.({ Time: timeLeft, Level: level, Combo: combo, Next: next });
  }, [timeLeft, level, combo, next, onStat]);

  const handleTap = (tile: Tile) => {
    if (paused || ended || tile.done) return;
    const id = flashIdRef.current++;
    if (tile.value === next) {
      const newCombo = combo + 1;
      const gained = 10 * newCombo;
      const newScore = scoreRef.current + gained;
      scoreRef.current = newScore;
      setScore(newScore);
      onScore(newScore);
      setCombo(newCombo);
      setFlash({ id, ok: true });
      setTiles((prev) =>
        prev.map((t) => (t.value === tile.value ? { ...t, done: true } : t))
      );
      if (next === tiles.length) {
        // level complete
        const newLevel = level + 1;
        const count = Math.min(6 + newLevel, 30);
        setLevel(newLevel);
        setNext(1);
        setTiles(generateTiles(count));
        setTimeLeft((t) => Math.min(t + Math.max(6, 12 - newLevel), BASE_TIME));
      } else {
        setNext((n) => n + 1);
      }
    } else {
      setCombo(0);
      setFlash({ id, ok: false });
      setTimeLeft((t) => Math.max(0, t - 3));
    }
    setTimeout(() => {
      setFlash((f) => (f && f.id === id ? null : f));
    }, 250);
  };

  useEffect(() => {
    if (timeLeft === 0 && !ended) {
      endGame();
    }
  }, [timeLeft, ended, endGame]);

  return (
    <div className="flex w-full flex-col items-center gap-3 select-none">
      <div className="flex w-full max-w-xl items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          Score: <span className="font-semibold text-primary-foreground">{score}</span>
        </span>
        <span>
          Level: <span className="font-semibold text-primary-foreground">{level}</span>
        </span>
        <span>
          Combo: <span className="font-semibold text-primary-foreground">x{combo}</span>
        </span>
        <span>
          Time: <span className="font-semibold text-primary-foreground">{timeLeft}s</span>
        </span>
      </div>
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-lg border border-border bg-surface"
        style={{ aspectRatio: `${BOARD_W} / ${BOARD_H}` }}
        role="group"
        aria-label={`Number rush board, tap number ${next} next`}
      >
        {tiles.map((tile) => (
          <button
            key={tile.value}
            type="button"
            disabled={tile.done || paused || ended}
            onClick={() => handleTap(tile)}
            aria-label={`Tile ${tile.value}${tile.done ? ", completed" : ""}`}
            className={`absolute flex items-center justify-center rounded-full border text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              tile.done
                ? "border-border bg-surface-2 text-muted-foreground opacity-40"
                : "border-border bg-card text-primary-foreground hover:bg-surface-2 active:bg-accent"
            } ${compact ? "text-[10px]" : ""}`}
            style={{
              left: `${tile.x}%`,
              top: `${tile.y}%`,
              width: `${TILE_SIZE}%`,
              height: `${TILE_SIZE}%`,
            }}
          >
            {tile.value}
          </button>
        ))}
        {flash && (
          <div
            className={`pointer-events-none absolute inset-0 transition-opacity ${
              flash.ok ? "bg-success/10" : "bg-accent/20"
            }`}
            aria-hidden="true"
          />
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Tap the numbers in order starting from <span className="font-semibold text-primary-foreground">{next}</span>.
        Wrong taps break your combo and cost time.
      </p>
    </div>
  );
}
