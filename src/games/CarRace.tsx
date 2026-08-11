import { useEffect, useRef, useState } from "react";
import type { GameProps } from "./types";

const LANES = 4;

interface Enemy {
  lane: number;
  y: number;
  color: string;
}

export default function CarRace({ onScore, onGameOver, onStat, paused, compact }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 320, h: 427 });

  const stateRef = useRef({
    lane: 1,
    targetLane: 1,
    laneX: 1,
    enemies: [] as Enemy[],
    dist: 0,
    speed: 4,
    spawnTimer: 0,
    dashOffset: 0,
    over: false,
    score: 0,
  });
  const rafRef = useRef<number | null>(null);
  const pausedRef = useRef(paused);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartLaneRef = useRef(1);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = entry.contentRect.width;
      const maxW = Math.min(w, 520);
      const h = maxW * (4 / 3);
      setSize({ w: maxW, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const move = (dir: -1 | 1) => {
    const s = stateRef.current;
    if (s.over) return;
    s.targetLane = Math.max(0, Math.min(LANES - 1, s.targetLane + dir));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") move(-1);
      else if (e.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const s = stateRef.current;
    let lastTime = performance.now();

    const laneWidth = () => size.w / LANES;

    const spawnEnemy = () => {
      const lane = Math.floor(Math.random() * LANES);
      const colors = ["#e0555c", "#5b8def", "#f2b134", "#7fbf7f"];
      const idx = Math.floor(Math.random() * colors.length);
      s.enemies.push({ lane, y: -80, color: colors[idx] ?? "#e0555c" });
    };

    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - lastTime) / 1000);
      lastTime = t;

      if (!pausedRef.current && !s.over) {
        s.laneX += (s.targetLane - s.laneX) * Math.min(1, dt * 10);

        s.speed = Math.min(16, 4 + s.dist / 800);
        s.dist += s.speed * dt * 60;
        s.dashOffset = (s.dashOffset + s.speed * dt * 60) % 60;

        s.spawnTimer -= dt;
        const spawnInterval = Math.max(0.5, 1.3 - s.dist / 4000);
        if (s.spawnTimer <= 0) {
          spawnEnemy();
          s.spawnTimer = spawnInterval;
        }

        const lw = laneWidth();
        for (const e of s.enemies) {
          e.y += s.speed * dt * 60;
        }
        s.enemies = s.enemies.filter((e) => e.y < size.h + 100);

        const playerLaneX = s.laneX * lw + lw / 2;
        const playerY = size.h - 90;
        const carW = lw * 0.6;
        const carH = 80;

        for (const e of s.enemies) {
          const ex = e.lane * lw + lw / 2;
          const ew = lw * 0.6;
          const eh = 80;
          const dx = Math.abs(ex - playerLaneX);
          const dy = Math.abs(e.y - playerY);
          if (dx < (carW + ew) / 2 - 6 && dy < (carH + eh) / 2 - 10) {
            s.over = true;
            onGameOver(Math.floor(s.score));
          }
        }

        const newScore = Math.floor(s.dist / 10);
        if (newScore !== s.score) {
          s.score = newScore;
          onScore(s.score);
        }
        onStat?.({ Speed: `${Math.floor(s.speed * 12)} km/h` });
      }

      ctx.clearRect(0, 0, size.w, size.h);
      // road background
      ctx.fillStyle = "#2a2d34";
      ctx.fillRect(0, 0, size.w, size.h);

      const lw = laneWidth();
      // lane markings
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 4;
      ctx.setLineDash([30, 30]);
      for (let i = 1; i < LANES; i++) {
        ctx.beginPath();
        ctx.lineDashOffset = -s.dashOffset;
        ctx.moveTo(i * lw, 0);
        ctx.lineTo(i * lw, size.h);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // road edges
      ctx.fillStyle = "#c94f4f";
      ctx.fillRect(0, 0, 6, size.h);
      ctx.fillRect(size.w - 6, 0, 6, size.h);

      // enemies
      for (const e of s.enemies) {
        const ex = e.lane * lw + lw / 2;
        drawCar(ctx, ex, e.y, lw * 0.6, 80, e.color);
      }

      // player
      const playerLaneX = s.laneX * lw + lw / 2;
      drawCar(ctx, playerLaneX, size.h - 90, lw * 0.6, 80, "#4ade80");

      if (!s.over) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [size, onScore, onGameOver, onStat]);

  const drawCar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    w: number,
    h: number,
    color: string,
  ) => {
    const x = cx - w / 2;
    const y = cy - h / 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(x + w * 0.15, y + h * 0.15, w * 0.7, h * 0.3);
    ctx.fillRect(x + w * 0.15, y + h * 0.55, w * 0.7, h * 0.25);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartLaneRef.current = stateRef.current.targetLane;
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    const dx = e.clientX - dragStartXRef.current;
    const laneWidth = size.w / LANES;
    const laneDelta = Math.round(dx / laneWidth);
    const s = stateRef.current;
    s.targetLane = Math.max(0, Math.min(LANES - 1, dragStartLaneRef.current + laneDelta));
  };
  const onPointerUp = () => {
    draggingRef.current = false;
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div
        ref={wrapRef}
        className="w-full flex justify-center no-touch-scroll"
        style={{ touchAction: "none" }}
      >
        <div
          className="relative overflow-hidden rounded-xl border border-border bg-surface"
          style={{ width: size.w, height: size.h }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <canvas
            ref={canvasRef}
            width={size.w}
            height={size.h}
            className="block"
          />
        </div>
      </div>
      {!compact && (
        <div className="flex gap-4 w-full max-w-[520px] px-2">
          <button
            type="button"
            aria-label="Steer left"
            className="flex-1 py-4 rounded-xl bg-primary text-foreground text-lg font-semibold active:opacity-80"
            onPointerDown={() => move(-1)}
          >
            ◀ Left
          </button>
          <button
            type="button"
            aria-label="Steer right"
            className="flex-1 py-4 rounded-xl bg-primary text-foreground text-lg font-semibold active:opacity-80"
            onPointerDown={() => move(1)}
          >
            Right ▶
          </button>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Use arrow keys, buttons, or drag on the road to steer.
      </p>
    </div>
  );
}
