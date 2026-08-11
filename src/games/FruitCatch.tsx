import { useEffect, useRef, useState } from "react";
import type { GameProps } from "./types";

type FruitType = "apple" | "orange" | "banana" | "watermelon" | "strawberry" | "bomb";

interface Falling {
  x: number;
  y: number;
  type: FruitType;
  speed: number;
  size: number;
}

const BASKET_W_RATIO = 0.22;
const BASKET_H_RATIO = 0.08;

export default function FruitCatch({ onScore, onGameOver, onStat, paused, compact }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 320, h: 480 });

  const stateRef = useRef({
    basketX: 0.5,
    targetX: 0.5,
    items: [] as Falling[],
    spawnTimer: 0,
    elapsed: 0,
    score: 0,
    lives: 3,
    over: false,
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
      const h = maxW * 1.4;
      setSize({ w: maxW, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

    const spawnItem = () => {
      const roll = Math.random();
      let type: FruitType;
      if (roll < 0.1) type = "bomb";
      else if (roll < 0.2) type = "watermelon";
      else if (roll < 0.3) type = "strawberry";
      else {
        const commons: FruitType[] = ["apple", "orange", "banana"];
        const idx = Math.floor(Math.random() * commons.length);
        type = commons[idx] ?? "apple";
      }
      const size2 = type === "watermelon" ? 34 : type === "bomb" ? 26 : 26;
      const speedBase = 2 + s.elapsed / 20;
      s.items.push({
        x: 0.08 + Math.random() * 0.84,
        y: -0.05,
        type,
        speed: speedBase + Math.random() * 1.5,
        size: size2,
      });
    };

    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - lastTime) / 1000);
      lastTime = t;

      if (!pausedRef.current && !s.over) {
        s.elapsed += dt;

        if (keysRef.current.left) s.targetX -= dt * 1.4;
        if (keysRef.current.right) s.targetX += dt * 1.4;
        s.targetX = Math.max(BASKET_W_RATIO / 2, Math.min(1 - BASKET_W_RATIO / 2, s.targetX));
        s.basketX += (s.targetX - s.basketX) * Math.min(1, dt * 12);

        const spawnInterval = Math.max(0.35, 1.1 - s.elapsed / 60);
        s.spawnTimer -= dt;
        if (s.spawnTimer <= 0) {
          spawnItem();
          s.spawnTimer = spawnInterval;
        }

        for (const item of s.items) {
          item.y += (item.speed * dt) / (size.h / 200);
        }

        const basketY = 1 - BASKET_H_RATIO - 0.02;
        const remaining: Falling[] = [];
        for (const item of s.items) {
          const caught =
            item.y >= basketY - 0.02 &&
            item.y <= basketY + BASKET_H_RATIO + 0.03 &&
            Math.abs(item.x - s.basketX) < BASKET_W_RATIO / 2 + 0.03;

          if (caught) {
            if (item.type === "bomb") {
              s.over = true;
              onGameOver(Math.floor(s.score));
            } else {
              const pts = item.type === "watermelon" || item.type === "strawberry" ? 20 : 10;
              s.score += pts;
              onScore(s.score);
            }
            continue;
          }

          if (item.y > 1.05) {
            if (item.type !== "bomb") {
              s.lives -= 1;
              onStat?.({ Lives: s.lives });
              if (s.lives <= 0) {
                s.over = true;
                onGameOver(Math.floor(s.score));
              }
            }
            continue;
          }

          remaining.push(item);
        }
        s.items = remaining;
      }

      ctx.clearRect(0, 0, size.w, size.h);
      ctx.fillStyle = "#1b1f27";
      ctx.fillRect(0, 0, size.w, size.h);

      for (const item of s.items) {
        drawFruit(ctx, item.x * size.w, item.y * size.h, item.size, item.type);
      }

      const basketPx = s.basketX * size.w;
      const basketW = BASKET_W_RATIO * size.w;
      const basketH = BASKET_H_RATIO * size.h;
      const basketY = (1 - BASKET_H_RATIO - 0.02) * size.h;
      ctx.fillStyle = "#a97142";
      ctx.beginPath();
      ctx.roundRect(basketPx - basketW / 2, basketY, basketW, basketH, 8);
      ctx.fill();
      ctx.strokeStyle = "#7a4f2c";
      ctx.lineWidth = 3;
      ctx.stroke();

      if (!s.over) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [size, onScore, onGameOver, onStat]);

  useEffect(() => {
    onStat?.({ Lives: stateRef.current.lives });
  }, [onStat]);

  const drawFruit = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    type: FruitType,
  ) => {
    ctx.save();
    ctx.translate(x, y);
    switch (type) {
      case "apple": {
        ctx.fillStyle = "#e0554f";
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#5c3a21";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.5);
        ctx.lineTo(2, -r * 0.75);
        ctx.stroke();
        break;
      }
      case "orange": {
        ctx.fillStyle = "#f2952e";
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "banana": {
        ctx.strokeStyle = "#f2d21c";
        ctx.lineWidth = r * 0.35;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.45, Math.PI * 0.2, Math.PI * 1.1);
        ctx.stroke();
        break;
      }
      case "watermelon": {
        ctx.fillStyle = "#2f9e44";
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#1b6b2e";
        ctx.lineWidth = 3;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(i * r * 0.15, -r * 0.55);
          ctx.quadraticCurveTo(i * r * 0.25, 0, i * r * 0.15, r * 0.55);
          ctx.stroke();
        }
        break;
      }
      case "strawberry": {
        ctx.fillStyle = "#e0335e";
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.5);
        ctx.quadraticCurveTo(r * 0.55, -r * 0.1, 0, r * 0.55);
        ctx.quadraticCurveTo(-r * 0.55, -r * 0.1, 0, -r * 0.5);
        ctx.fill();
        ctx.fillStyle = "#3fa34d";
        ctx.beginPath();
        ctx.moveTo(-r * 0.2, -r * 0.5);
        ctx.lineTo(r * 0.2, -r * 0.5);
        ctx.lineTo(0, -r * 0.7);
        ctx.fill();
        break;
      }
      case "bomb": {
        ctx.fillStyle = "#2b2b2b";
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ff6b6b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.45);
        ctx.lineTo(r * 0.2, -r * 0.75);
        ctx.stroke();
        ctx.fillStyle = "#ffb703";
        ctx.beginPath();
        ctx.arc(r * 0.2, -r * 0.78, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      default:
        break;
    }
    ctx.restore();
  };

  const moveBasketTo = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const rel = (clientX - rect.left) / rect.width;
    stateRef.current.targetX = Math.max(
      BASKET_W_RATIO / 2,
      Math.min(1 - BASKET_W_RATIO / 2, rel),
    );
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    moveBasketTo(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    moveBasketTo(e.clientX);
  };
  const onPointerUp = () => {
    draggingRef.current = false;
  };

  const nudge = (dir: -1 | 1) => {
    const s = stateRef.current;
    s.targetX = Math.max(
      BASKET_W_RATIO / 2,
      Math.min(1 - BASKET_W_RATIO / 2, s.targetX + dir * 0.12),
    );
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
            aria-label="Move basket left"
            className="flex-1 py-4 rounded-xl bg-primary text-foreground text-lg font-semibold active:opacity-80"
            onPointerDown={() => nudge(-1)}
          >
            ◀ Left
          </button>
          <button
            type="button"
            aria-label="Move basket right"
            className="flex-1 py-4 rounded-xl bg-primary text-foreground text-lg font-semibold active:opacity-80"
            onPointerDown={() => nudge(1)}
          >
            Right ▶
          </button>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Drag, use arrow keys, or the buttons to catch fruit. Avoid bombs!
      </p>
    </div>
  );
}
