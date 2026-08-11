import { useEffect, useRef, useCallback } from "react";
import type { GameProps } from "./types";
import { clamp } from "./types";

const W = 400;
const H = 600;
const PADDLE_Y = H - 30;
const PADDLE_W = 80;
const PADDLE_H = 12;
const BALL_R = 6;
const BRICK_ROWS_BASE = 4;
const BRICK_COLS = 8;
const BRICK_W = W / BRICK_COLS;
const BRICK_H = 20;
const BRICK_TOP = 50;

type PowerType = "wide" | "multi" | "slow";

interface Brick {
  x: number;
  y: number;
  alive: boolean;
  hp: number;
  color: string;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Capsule {
  x: number;
  y: number;
  type: PowerType;
}

const POWER_COLORS: Record<PowerType, string> = {
  wide: "#22d3ee",
  multi: "#f472b6",
  slow: "#facc15",
};

const POWER_LABELS: Record<PowerType, string> = {
  wide: "Wide Paddle",
  multi: "Multi-Ball",
  slow: "Slow Ball",
};

const BRICK_COLORS = ["#f87171", "#fb923c", "#fbbf24", "#a3e635", "#4ade80", "#34d399", "#22d3ee", "#818cf8"];

function makeLevel(level: number): Brick[] {
  const rows = Math.min(BRICK_ROWS_BASE + Math.floor(level / 2), 9);
  const bricks: Brick[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      if (Math.random() < 0.12 + level * 0.01) continue;
      const hp = Math.random() < Math.min(0.1 + level * 0.03, 0.4) ? 2 : 1;
      bricks.push({
        x: c * BRICK_W,
        y: BRICK_TOP + r * BRICK_H,
        alive: true,
        hp,
        color: BRICK_COLORS[r % BRICK_COLORS.length] ?? "#fff",
      });
    }
  }
  return bricks;
}

export default function BrickBreaker({ onScore, onGameOver, onStat, paused, compact }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const levelRef = useRef(1);
  const paddleXRef = useRef((W - PADDLE_W) / 2);
  const paddleWRef = useRef(PADDLE_W);
  const bricksRef = useRef<Brick[]>(makeLevel(1));
  const ballsRef = useRef<Ball[]>([]);
  const capsulesRef = useRef<Capsule[]>([]);
  const speedMulRef = useRef(1);
  const slowUntilRef = useRef(0);
  const wideUntilRef = useRef(0);
  const gameOverRef = useRef(false);
  const startedRef = useRef(false);
  const pausedRef = useRef(paused);
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const resetBall = useCallback((speed: number) => {
    ballsRef.current = [
      {
        x: W / 2,
        y: PADDLE_Y - 20,
        vx: (Math.random() * 2 - 1) * 2,
        vy: -3.2 * speed,
      },
    ];
  }, []);

  const nextLevel = useCallback(() => {
    levelRef.current += 1;
    speedMulRef.current = 1 + (levelRef.current - 1) * 0.12;
    bricksRef.current = makeLevel(levelRef.current);
    capsulesRef.current = [];
    paddleWRef.current = PADDLE_W;
    wideUntilRef.current = 0;
    slowUntilRef.current = 0;
    resetBall(speedMulRef.current);
    onStat?.({ Level: levelRef.current, Lives: livesRef.current });
  }, [onStat, resetBall]);

  const loseLife = useCallback(() => {
    livesRef.current -= 1;
    onStat?.({ Level: levelRef.current, Lives: livesRef.current });
    if (livesRef.current <= 0) {
      gameOverRef.current = true;
      onGameOver(scoreRef.current);
      return;
    }
    paddleWRef.current = PADDLE_W;
    wideUntilRef.current = 0;
    slowUntilRef.current = 0;
    resetBall(speedMulRef.current);
  }, [onGameOver, onStat, resetBall]);

  useEffect(() => {
    scoreRef.current = 0;
    livesRef.current = 3;
    levelRef.current = 1;
    speedMulRef.current = 1;
    bricksRef.current = makeLevel(1);
    capsulesRef.current = [];
    paddleWRef.current = PADDLE_W;
    paddleXRef.current = (W - PADDLE_W) / 2;
    gameOverRef.current = false;
    startedRef.current = false;
    resetBall(1);
    onScore(0);
    onStat?.({ Level: 1, Lives: 3 });
  }, [onScore, onStat, resetBall]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMove = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const scale = W / rect.width;
      const x = (clientX - rect.left) * scale;
      paddleXRef.current = clamp(x - paddleWRef.current / 2, 0, W - paddleWRef.current);
      startedRef.current = true;
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      if (t) handleMove(t.clientX);
    };
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      if (t) handleMove(t.clientX);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") keysRef.current.left = true;
      if (e.key === "ArrowRight") keysRef.current.right = true;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") startedRef.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") keysRef.current.left = false;
      if (e.key === "ArrowRight") keysRef.current.right = false;
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const spawnCapsuleMaybe = (x: number, y: number) => {
      if (Math.random() < 0.16) {
        const types: PowerType[] = ["wide", "multi", "slow"];
        const type = types[Math.floor(Math.random() * types.length)] ?? "wide";
        capsulesRef.current.push({ x, y, type });
      }
    };

    const tick = () => {
      if (!pausedRef.current && !gameOverRef.current) {
        const keys = keysRef.current;
        const paddleSpeed = 7;
        if (keys.left) paddleXRef.current = clamp(paddleXRef.current - paddleSpeed, 0, W - paddleWRef.current);
        if (keys.right) paddleXRef.current = clamp(paddleXRef.current + paddleSpeed, 0, W - paddleWRef.current);

        const now = performance.now();
        if (wideUntilRef.current && now > wideUntilRef.current) {
          wideUntilRef.current = 0;
          paddleWRef.current = PADDLE_W;
        }
        const slowFactor = slowUntilRef.current && now < slowUntilRef.current ? 0.55 : 1;
        if (slowUntilRef.current && now > slowUntilRef.current) slowUntilRef.current = 0;

        if (startedRef.current) {
          const balls = ballsRef.current;
          const paddleX = paddleXRef.current;
          const paddleW = paddleWRef.current;

          for (const ball of balls) {
            ball.x += ball.vx * slowFactor;
            ball.y += ball.vy * slowFactor;

            if (ball.x - BALL_R < 0) {
              ball.x = BALL_R;
              ball.vx *= -1;
            } else if (ball.x + BALL_R > W) {
              ball.x = W - BALL_R;
              ball.vx *= -1;
            }
            if (ball.y - BALL_R < 0) {
              ball.y = BALL_R;
              ball.vy *= -1;
            }

            if (
              ball.vy > 0 &&
              ball.y + BALL_R >= PADDLE_Y &&
              ball.y + BALL_R <= PADDLE_Y + PADDLE_H + 6 &&
              ball.x >= paddleX &&
              ball.x <= paddleX + paddleW
            ) {
              const hit = (ball.x - (paddleX + paddleW / 2)) / (paddleW / 2);
              const speed = Math.hypot(ball.vx, ball.vy);
              const angle = hit * (Math.PI / 3);
              ball.vx = speed * Math.sin(angle);
              ball.vy = -Math.abs(speed * Math.cos(angle));
              ball.y = PADDLE_Y - BALL_R - 1;
            }

            for (const brick of bricksRef.current) {
              if (!brick.alive) continue;
              if (
                ball.x + BALL_R > brick.x &&
                ball.x - BALL_R < brick.x + BRICK_W &&
                ball.y + BALL_R > brick.y &&
                ball.y - BALL_R < brick.y + BRICK_H
              ) {
                brick.hp -= 1;
                if (brick.hp <= 0) {
                  brick.alive = false;
                  scoreRef.current += 10;
                  onScore(scoreRef.current);
                  spawnCapsuleMaybe(brick.x + BRICK_W / 2, brick.y + BRICK_H / 2);
                } else {
                  scoreRef.current += 5;
                  onScore(scoreRef.current);
                }
                const overlapX = Math.min(
                  ball.x + BALL_R - brick.x,
                  brick.x + BRICK_W - (ball.x - BALL_R)
                );
                const overlapY = Math.min(
                  ball.y + BALL_R - brick.y,
                  brick.y + BRICK_H - (ball.y - BALL_R)
                );
                if (overlapX < overlapY) {
                  ball.vx *= -1;
                } else {
                  ball.vy *= -1;
                }
                break;
              }
            }
          }

          ballsRef.current = balls.filter((b) => b.y - BALL_R < H + 20);
          if (ballsRef.current.length === 0) {
            loseLife();
          }

          capsulesRef.current.forEach((cap) => {
            cap.y += 2.5;
          });
          const remainingCaps: Capsule[] = [];
          for (const cap of capsulesRef.current) {
            if (
              cap.y + 10 >= PADDLE_Y &&
              cap.y <= PADDLE_Y + PADDLE_H &&
              cap.x >= paddleXRef.current &&
              cap.x <= paddleXRef.current + paddleWRef.current
            ) {
              if (cap.type === "wide") {
                paddleWRef.current = PADDLE_W * 1.6;
                wideUntilRef.current = performance.now() + 10000;
              } else if (cap.type === "multi") {
                const base = ballsRef.current[0];
                if (base) {
                  ballsRef.current.push(
                    { x: base.x, y: base.y, vx: -base.vx || 2, vy: base.vy },
                    { x: base.x, y: base.y, vx: (base.vx || 2) * 1.3, vy: base.vy }
                  );
                }
              } else if (cap.type === "slow") {
                slowUntilRef.current = performance.now() + 8000;
              }
              continue;
            }
            if (cap.y < H + 20) remainingCaps.push(cap);
          }
          capsulesRef.current = remainingCaps;

          if (bricksRef.current.every((b) => !b.alive)) {
            nextLevel();
          }
        } else {
          ballsRef.current = [
            {
              x: paddleXRef.current + paddleWRef.current / 2,
              y: PADDLE_Y - 20,
              vx: 0,
              vy: -3.2 * speedMulRef.current,
            },
          ];
        }
      }

      ctx.fillStyle = "#0b0f1a";
      ctx.fillRect(0, 0, W, H);

      for (const brick of bricksRef.current) {
        if (!brick.alive) continue;
        ctx.fillStyle = brick.hp > 1 ? "#ffffff" : brick.color;
        ctx.fillRect(brick.x + 2, brick.y + 2, BRICK_W - 4, BRICK_H - 4);
        if (brick.hp > 1) {
          ctx.fillStyle = brick.color;
          ctx.fillRect(brick.x + 6, brick.y + 6, BRICK_W - 12, BRICK_H - 12);
        }
      }

      for (const cap of capsulesRef.current) {
        ctx.fillStyle = POWER_COLORS[cap.type];
        ctx.beginPath();
        ctx.roundRect(cap.x - 12, cap.y - 8, 24, 16, 8);
        ctx.fill();
      }

      ctx.fillStyle = wideUntilRef.current ? "#22d3ee" : "#e5e7eb";
      ctx.fillRect(paddleXRef.current, PADDLE_Y, paddleWRef.current, PADDLE_H);

      ctx.fillStyle = slowUntilRef.current ? "#facc15" : "#f9fafb";
      for (const ball of ballsRef.current) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!startedRef.current && !gameOverRef.current) {
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Move paddle to launch", W / 2, H / 2);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [loseLife, nextLevel, onScore]);

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="no-touch-scroll w-full max-w-sm touch-none rounded-lg border border-border bg-card"
        style={{ aspectRatio: `${W} / ${H}` }}
      />
      {!compact && (
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
          {(Object.keys(POWER_LABELS) as PowerType[]).map((type) => (
            <span key={type} className="flex items-center gap-1">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: POWER_COLORS[type] }}
              />
              {POWER_LABELS[type]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
