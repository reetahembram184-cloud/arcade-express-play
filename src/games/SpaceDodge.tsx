import { useEffect, useRef, useState } from "react";
import type { GameProps } from "./types";

interface Rock {
  x: number;
  y: number;
  r: number;
  speed: number;
  spin: number;
  rot: number;
  scored: boolean;
}

interface Star {
  x: number;
  y: number;
  r: number;
  speed: number;
}

export default function SpaceDodge({ onScore, onGameOver, onStat, paused, compact }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 320, h: 480 });

  const stateRef = useRef({
    shipX: 0.5,
    targetX: 0.5,
    rocks: [] as Rock[],
    stars: [] as Star[],
    time: 0,
    speed: 3,
    spawnTimer: 0,
    over: false,
    score: 0,
  });
  const rafRef = useRef<number | null>(null);
  const pausedRef = useRef(paused);
  const draggingRef = useRef(false);
  const keysRef = useRef({ left: false, right: false });

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
      const maxW = Math.min(w, 480);
      const h = maxW * 1.5;
      setSize({ w: maxW, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const s = stateRef.current;
    s.stars = Array.from({ length: 60 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.8 + 0.4,
      speed: Math.random() * 0.4 + 0.2,
    }));
  }, []);

  const setDir = (dx: number) => {
    const s = stateRef.current;
    if (s.over) return;
    s.targetX = Math.max(0.06, Math.min(0.94, s.targetX + dx));
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") keysRef.current.left = true;
      else if (e.key === "ArrowRight") keysRef.current.right = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") keysRef.current.left = false;
      else if (e.key === "ArrowRight") keysRef.current.right = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const s = stateRef.current;
    let lastTime = performance.now();

    const spawnRock = () => {
      const r = Math.random() * 18 + 10 + Math.min(14, s.time / 8);
      s.rocks.push({
        x: Math.random() * (size.w - r * 2) + r,
        y: -r * 2,
        r,
        speed: s.speed * (0.7 + Math.random() * 0.6),
        spin: (Math.random() - 0.5) * 3,
        rot: Math.random() * Math.PI * 2,
        scored: false,
      });
    };

    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - lastTime) / 1000);
      lastTime = t;

      if (!pausedRef.current && !s.over) {
        if (keysRef.current.left) s.targetX = Math.max(0.06, s.targetX - dt * 1.6);
        if (keysRef.current.right) s.targetX = Math.min(0.94, s.targetX + dt * 1.6);

        s.shipX += (s.targetX - s.shipX) * Math.min(1, dt * 12);

        s.time += dt;
        s.speed = Math.min(22, 3 + s.time / 6);

        s.spawnTimer -= dt;
        const spawnInterval = Math.max(0.22, 1 - s.time / 40);
        if (s.spawnTimer <= 0) {
          spawnRock();
          s.spawnTimer = spawnInterval;
        }

        for (const rock of s.rocks) {
          rock.y += rock.speed * dt * 60;
          rock.rot += rock.spin * dt;
        }

        const shipPx = s.shipX * size.w;
        const shipY = size.h - 70;
        const shipR = 16;

        for (const rock of s.rocks) {
          const dx = rock.x - shipPx;
          const dy = rock.y - shipY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < rock.r + shipR - 6) {
            s.over = true;
            onGameOver(Math.floor(s.score));
          } else if (!rock.scored && dist < rock.r + shipR + 22 && rock.y > shipY - 30) {
            rock.scored = true;
            s.score += 5;
          }
        }

        s.rocks = s.rocks.filter((rock) => rock.y - rock.r < size.h + 40);

        for (const star of s.stars) {
          star.y += star.speed * dt;
          if (star.y > 1) {
            star.y = 0;
            star.x = Math.random();
          }
        }

        s.score += dt * 8;
        const newScore = Math.floor(s.score);
        onScore(newScore);
        onStat?.({ Speed: `${s.speed.toFixed(1)}x` });
      }

      ctx.clearRect(0, 0, size.w, size.h);
      ctx.fillStyle = "#0b0e1a";
      ctx.fillRect(0, 0, size.w, size.h);

      ctx.fillStyle = "#ffffff";
      for (const star of s.stars) {
        ctx.globalAlpha = 0.5 + star.r / 4;
        ctx.beginPath();
        ctx.arc(star.x * size.w, star.y * size.h, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      for (const rock of s.rocks) {
        ctx.save();
        ctx.translate(rock.x, rock.y);
        ctx.rotate(rock.rot);
        ctx.fillStyle = "#8b8f9a";
        ctx.strokeStyle = "#5a5e68";
        ctx.lineWidth = 2;
        ctx.beginPath();
        const points = 8;
        for (let i = 0; i < points; i++) {
          const ang = (i / points) * Math.PI * 2;
          const rr = rock.r * (0.8 + Math.sin(i * 3.1 + rock.r) * 0.2);
          const px = Math.cos(ang) * rr;
          const py = Math.sin(ang) * rr;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      const shipPx = s.shipX * size.w;
      const shipY = size.h - 70;
      ctx.save();
      ctx.translate(shipPx, shipY);
      ctx.fillStyle = "#4ade80";
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(14, 16);
      ctx.lineTo(0, 8);
      ctx.lineTo(-14, 16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#f2b134";
      ctx.beginPath();
      ctx.moveTo(-6, 14);
      ctx.lineTo(0, 14 + 10 + Math.random() * 6);
      ctx.lineTo(6, 14);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      if (!s.over) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [size, onScore, onGameOver, onStat]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    handlePointer(e);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    handlePointer(e);
  };
  const onPointerUp = () => {
    draggingRef.current = false;
  };
  const handlePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    stateRef.current.targetX = Math.max(0.06, Math.min(0.94, x));
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
          <canvas ref={canvasRef} width={size.w} height={size.h} className="block" />
        </div>
      </div>
      {!compact && (
        <div className="flex gap-4 w-full max-w-[480px] px-2">
          <button
            type="button"
            aria-label="Move left"
            className="flex-1 py-4 rounded-xl bg-primary text-foreground text-lg font-semibold active:opacity-80"
            onPointerDown={() => setDir(-0.12)}
          >
            ◀ Left
          </button>
          <button
            type="button"
            aria-label="Move right"
            className="flex-1 py-4 rounded-xl bg-primary text-foreground text-lg font-semibold active:opacity-80"
            onPointerDown={() => setDir(0.12)}
          >
            Right ▶
          </button>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Use arrow keys, buttons, or drag on the field to dodge asteroids.
      </p>
    </div>
  );
}
