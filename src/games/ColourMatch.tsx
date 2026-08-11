import { useCallback, useEffect, useRef, useState } from "react";
import type { GameProps } from "./types";

interface Colour {
  name: string;
  hex: string;
}

const PALETTE: Colour[] = [
  { name: "Red", hex: "#ef4444" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Green", hex: "#22c55e" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Purple", hex: "#a855f7" },
  { name: "Orange", hex: "#f97316" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Teal", hex: "#14b8a6" },
  { name: "Lime", hex: "#84cc16" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Rose", hex: "#f43f5e" },
];

const ROUND_TIME = 30;
const LIVES_START = 3;

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    const item = copy[idx];
    if (item !== undefined) out.push(item);
    copy.splice(idx, 1);
  }
  return out;
}

export default function ColourMatch({ onScore, onGameOver, onStat, paused, compact }: GameProps) {
  const [swatches, setSwatches] = useState<Colour[]>([]);
  const [target, setTarget] = useState<Colour | null>(null);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);

  const scoreRef = useRef(0);
  const livesRef = useRef(LIVES_START);
  const comboRef = useRef(0);
  const timeLeftRef = useRef(ROUND_TIME);
  const roundTimeLeftRef = useRef<number>(4);
  const roundDurationRef = useRef<number>(4);
  const gameOverRef = useRef(false);
  const swatchCountRef = useRef(4);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const targetRef = useRef<Colour | null>(null);

  const [, forceRender] = useState(0);

  const nextRound = useCallback(() => {
    const count = swatchCountRef.current;
    const chosen = pickRandom(PALETTE, count);
    const t = chosen[Math.floor(Math.random() * chosen.length)] ?? chosen[0] ?? null;
    setSwatches(chosen);
    setTarget(t ?? null);
    targetRef.current = t ?? null;
    roundDurationRef.current = Math.max(1.5, 4 - Math.floor(comboRef.current / 3) * 0.3);
    roundTimeLeftRef.current = roundDurationRef.current;
  }, []);

  const endGame = useCallback(() => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    onGameOver(scoreRef.current);
  }, [onGameOver]);

  const reportStats = useCallback(() => {
    onStat?.({
      Lives: livesRef.current,
      Time: Math.max(0, Math.ceil(timeLeftRef.current)),
      Combo: comboRef.current,
    });
  }, [onStat]);

  const loseLife = useCallback(() => {
    comboRef.current = 0;
    livesRef.current -= 1;
    setFlash("wrong");
    setTimeout(() => setFlash(null), 200);
    if (livesRef.current <= 0) {
      reportStats();
      endGame();
      return;
    }
    nextRound();
    reportStats();
  }, [endGame, nextRound, reportStats]);

  const handleTap = useCallback(
    (c: Colour) => {
      if (gameOverRef.current || paused) return;
      if (targetRef.current && c.name === targetRef.current.name) {
        comboRef.current += 1;
        scoreRef.current += 10 * comboRef.current;
        onScore(scoreRef.current);
        setFlash("correct");
        setTimeout(() => setFlash(null), 150);
        // increase difficulty
        if (comboRef.current % 3 === 0 && swatchCountRef.current < 9) {
          swatchCountRef.current += 1;
        }
        nextRound();
        reportStats();
      } else {
        loseLife();
      }
    },
    [nextRound, onScore, paused, reportStats, loseLife]
  );

  // init
  useEffect(() => {
    nextRound();
    reportStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (paused) {
      lastRef.current = null;
      return;
    }

    const tick = (t: number) => {
      if (gameOverRef.current) return;
      if (lastRef.current === null) lastRef.current = t;
      const dt = (t - lastRef.current) / 1000;
      lastRef.current = t;

      timeLeftRef.current -= dt;
      roundTimeLeftRef.current -= dt;

      if (timeLeftRef.current <= 0) {
        timeLeftRef.current = 0;
        reportStats();
        endGame();
        return;
      }

      if (roundTimeLeftRef.current <= 0) {
        loseLife();
      }

      forceRender((n) => n + 1);
      reportStats();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const roundPct = Math.max(
    0,
    Math.min(100, (roundTimeLeftRef.current / roundDurationRef.current) * 100)
  );

  const gridCols =
    swatches.length <= 4 ? "grid-cols-2" : swatches.length <= 6 ? "grid-cols-3" : "grid-cols-4";

  return (
    <div
      className={`no-touch-scroll flex flex-col items-center gap-4 w-full ${
        compact ? "max-w-sm" : "max-w-md"
      } mx-auto`}
      style={{ touchAction: "none" }}
    >
      <div className="w-full bg-surface-2 rounded-xl p-4 flex flex-col items-center gap-2">
        <div className="text-sm text-muted-foreground">Find this colour</div>
        <div
          className={`text-3xl font-bold transition-colors ${
            flash === "correct"
              ? "text-success"
              : flash === "wrong"
              ? "text-destructive"
              : "text-foreground"
          }`}
        >
          {target?.name ?? "..."}
        </div>
        <div className="w-full h-2 bg-surface rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${roundPct}%` }}
          />
        </div>
      </div>

      <div className={`grid ${gridCols} gap-3 w-full`}>
        {swatches.map((c) => (
          <button
            key={c.name}
            aria-label={`Swatch ${c.name}`}
            onClick={() => handleTap(c)}
            className="aspect-square rounded-xl border border-border shadow-sm active:scale-95 transition-transform"
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>

      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>Lives: {livesRef.current}</span>
        <span>Time: {Math.max(0, Math.ceil(timeLeftRef.current))}s</span>
        <span>Combo: x{comboRef.current}</span>
      </div>
    </div>
  );
}
