import { useCallback, useEffect, useRef, useState } from "react";
import type { GameProps } from "./types";

const DURATION = 30;
const MIN_SIZE = 34;
const MAX_SIZE = 70;
const MIN_RELOCATE_MS = 700;
const MAX_RELOCATE_MS = 1800;

interface TargetState {
  x: number; // percent 0-100
  y: number; // percent 0-100
  size: number; // px
  key: number;
}

function randomTarget(size: number, key: number): TargetState {
  const margin = 8;
  const x = margin + Math.random() * (100 - margin * 2);
  const y = margin + Math.random() * (100 - margin * 2);
  return { x, y, size, key };
}

export default function TapTarget({ onScore, onGameOver, onStat, paused, compact }: GameProps) {
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hits, setHits] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [target, setTarget] = useState<TargetState>(() => randomTarget(MAX_SIZE, 0));
  const [popKey, setPopKey] = useState<number | null>(null);

  const pausedRef = useRef(paused);
  const overRef = useRef(false);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const hitsRef = useRef(0);
  const attemptsRef = useRef(0);
  const keyRef = useRef(0);
  const sizeRef = useRef(MAX_SIZE);
  const relocateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const clearRelocateTimer = () => {
    if (relocateTimerRef.current) {
      clearTimeout(relocateTimerRef.current);
      relocateTimerRef.current = null;
    }
  };

  const spawnNew = useCallback((shrink: boolean, missed: boolean) => {
    if (overRef.current) return;
    if (missed) {
      comboRef.current = 0;
      setCombo(0);
    }
    if (shrink) {
      sizeRef.current = Math.max(MIN_SIZE, sizeRef.current - 2);
    }
    keyRef.current += 1;
    const t = randomTarget(sizeRef.current, keyRef.current);
    setTarget(t);
    scheduleRelocate();
  }, []);

  const scheduleRelocate = useCallback(() => {
    clearRelocateTimer();
    const elapsedRatio = 1 - (Math.min(DURATION, DURATION)) / DURATION;
    void elapsedRatio;
    const delay = Math.max(
      MIN_RELOCATE_MS,
      MAX_RELOCATE_MS - (DURATION - (timeLeftRef.current)) * 40
    );
    relocateTimerRef.current = setTimeout(() => {
      if (pausedRef.current || overRef.current) {
        scheduleRelocate();
        return;
      }
      // untapped relocation counts as a miss
      attemptsRef.current += 1;
      setAttempts(attemptsRef.current);
      spawnNew(true, true);
    }, delay);
  }, [spawnNew]);

  const timeLeftRef = useRef(DURATION);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // Countdown timer
  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current || overRef.current) return;
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          overRef.current = true;
          clearRelocateTimer();
          onGameOver(scoreRef.current);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onGameOver]);

  // Initial relocate schedule
  useEffect(() => {
    scheduleRelocate();
    return () => clearRelocateTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Report stats
  useEffect(() => {
    const accuracy = attempts > 0 ? Math.round((hits / attempts) * 100) : 100;
    onStat?.({
      Time: `${timeLeft}s`,
      Accuracy: `${accuracy}%`,
      Combo: combo,
    });
  }, [timeLeft, hits, attempts, combo, onStat]);

  const handleHit = () => {
    if (paused || overRef.current) return;
    clearRelocateTimer();
    attemptsRef.current += 1;
    hitsRef.current += 1;
    comboRef.current += 1;
    setAttempts(attemptsRef.current);
    setHits(hitsRef.current);
    setCombo(comboRef.current);
    const gained = 10 * comboRef.current;
    scoreRef.current += gained;
    setScore(scoreRef.current);
    onScore(scoreRef.current);
    setPopKey(target.key);
    spawnNew(true, false);
  };

  const handleMiss = () => {
    if (paused || overRef.current) return;
    attemptsRef.current += 1;
    setAttempts(attemptsRef.current);
    comboRef.current = 0;
    setCombo(0);
  };

  return (
    <div className="flex h-full w-full flex-col items-center gap-2">
      {!compact && (
        <div className="flex w-full max-w-md items-center justify-between px-1 text-sm text-muted-foreground">
          <span>Score: {score}</span>
          <span>Combo x{combo}</span>
          <span>{timeLeft}s</span>
        </div>
      )}
      <div
        className="no-touch-scroll relative w-full max-w-md touch-none select-none overflow-hidden rounded-xl border border-border bg-card"
        style={{ aspectRatio: "3 / 4" }}
        onPointerDown={handleMiss}
      >
        <button
          key={target.key}
          type="button"
          aria-label="Tap target"
          onPointerDown={(e) => {
            e.stopPropagation();
            handleHit();
          }}
          className="absolute rounded-full bg-primary shadow-lg shadow-primary/40 transition-transform duration-150 active:scale-90"
          style={{
            left: `${target.x}%`,
            top: `${target.y}%`,
            width: target.size,
            height: target.size,
            transform: "translate(-50%, -50%)",
          }}
        />
        {popKey !== null && (
          <div
            key={`pop-${popKey}`}
            className="pointer-events-none absolute text-sm font-bold text-primary"
            style={{
              left: `${target.x}%`,
              top: `${target.y}%`,
              transform: "translate(-50%, -150%)",
            }}
          >
            +{10 * Math.max(1, comboRef.current)}
          </div>
        )}
      </div>
    </div>
  );
}
