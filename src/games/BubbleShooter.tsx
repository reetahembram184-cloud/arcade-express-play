import { useCallback, useEffect, useRef } from "react";
import type { GameProps } from "./types";

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#ec4899"];
const COLS = 10;
const ROWS_VISIBLE = 12;
const AR = 0.9; // height/width
const SHOTS_PER_ROW = 5;

type Bubble = { color: number } | null;

interface Shot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
}

export default function BubbleShooter({ onScore, onGameOver, onStat, paused, compact }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const gridRef = useRef<Bubble[][]>([]);
  const rowOffsetRef = useRef(0); // number of rows scrolled (for infinite descend simulate via shifting array)
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const shotsFiredRef = useRef(0);
  const shotRef = useRef<Shot | null>(null);
  const aimRef = useRef({ x: 0.5, y: 0 });
  const nextColorRef = useRef(0);
  const curColorRef = useRef(0);
  const overRef = useRef(false);
  const pausedRef = useRef(paused);
  const sizeRef = useRef({ w: 360, h: 324, cell: 36 });

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const randColor = useCallback(() => Math.floor(Math.random() * COLORS.length), []);

  const initGrid = useCallback(() => {
    const grid: Bubble[][] = [];
    for (let r = 0; r < 5; r++) {
      const row: Bubble[] = [];
      for (let c = 0; c < COLS; c++) {
        row.push({ color: randColor() });
      }
      grid.push(row);
    }
    gridRef.current = grid;
  }, [randColor]);

  const cellGeom = useCallback((cell: number) => {
    const radius = cell / 2;
    return { radius };
  }, []);

  // convert row/col to pixel center; odd rows offset by half cell
  const rcToXY = useCallback((r: number, c: number, cell: number) => {
    const offset = r % 2 === 1 ? cell / 2 : 0;
    const x = c * cell + cell / 2 + offset;
    const y = r * cell * 0.87 + cell / 2;
    return { x, y };
  }, []);

  const xyToRC = useCallback(
    (x: number, y: number, cell: number) => {
      let bestR = 0;
      let bestC = 0;
      let bestD = Infinity;
      const rows = gridRef.current.length + 2;
      for (let r = 0; r < rows; r++) {
        const offset = r % 2 === 1 ? cell / 2 : 0;
        for (let c = 0; c < COLS; c++) {
          const cx = c * cell + cell / 2 + offset;
          const cy = r * cell * 0.87 + cell / 2;
          const d = (cx - x) ** 2 + (cy - y) ** 2;
          if (d < bestD) {
            bestD = d;
            bestR = r;
            bestC = c;
          }
        }
      }
      return { r: bestR, c: bestC };
    },
    []
  );

  const ensureRow = useCallback((r: number) => {
    const grid = gridRef.current;
    while (grid.length <= r) {
      const row: Bubble[] = [];
      for (let c = 0; c < COLS; c++) row.push(null);
      grid.push(row);
    }
  }, []);

  const neighbors = useCallback((r: number, c: number) => {
    const odd = r % 2 === 1;
    const deltas = odd
      ? [
          [0, -1],
          [0, 1],
          [-1, 0],
          [-1, 1],
          [1, 0],
          [1, 1],
        ]
      : [
          [0, -1],
          [0, 1],
          [-1, -1],
          [-1, 0],
          [1, -1],
          [1, 0],
        ];
    return deltas.map(([dr, dc]) => [r + (dr ?? 0), c + (dc ?? 0)] as [number, number]);
  }, []);

  const floodMatch = useCallback(
    (r: number, c: number) => {
      const grid = gridRef.current;
      const start = grid[r]?.[c];
      if (!start) return [] as [number, number][];
      const color = start.color;
      const seen = new Set<string>();
      const stack: [number, number][] = [[r, c]];
      const result: [number, number][] = [];
      seen.add(`${r},${c}`);
      while (stack.length) {
        const cur = stack.pop();
        if (!cur) continue;
        const [cr, cc] = cur;
        const b = grid[cr]?.[cc];
        if (!b || b.color !== color) continue;
        result.push([cr, cc]);
        for (const [nr, nc] of neighbors(cr, cc)) {
          const key = `${nr},${nc}`;
          if (seen.has(key)) continue;
          if (nr < 0 || nr >= grid.length || nc < 0 || nc >= COLS) continue;
          const nb = grid[nr]?.[nc];
          if (nb && nb.color === color) {
            seen.add(key);
            stack.push([nr, nc]);
          }
        }
      }
      return result;
    },
    [neighbors]
  );

  const findFloating = useCallback(() => {
    const grid = gridRef.current;
    const attached = new Set<string>();
    const stack: [number, number][] = [];
    for (let c = 0; c < COLS; c++) {
      if (grid[0]?.[c]) {
        stack.push([0, c]);
        attached.add(`0,${c}`);
      }
    }
    while (stack.length) {
      const cur = stack.pop();
      if (!cur) continue;
      const [r, c] = cur;
      for (const [nr, nc] of neighbors(r, c)) {
        const key = `${nr},${nc}`;
        if (attached.has(key)) continue;
        if (nr < 0 || nr >= grid.length || nc < 0 || nc >= COLS) continue;
        if (grid[nr]?.[nc]) {
          attached.add(key);
          stack.push([nr, nc]);
        }
      }
    }
    const floating: [number, number][] = [];
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r]?.[c] && !attached.has(`${r},${c}`)) floating.push([r, c]);
      }
    }
    return floating;
  }, [neighbors]);

  const countBubbles = useCallback(() => {
    let n = 0;
    for (const row of gridRef.current) for (const b of row) if (b) n++;
    return n;
  }, []);

  const pushStats = useCallback(() => {
    onStat?.({ Level: levelRef.current, Bubbles: countBubbles() });
  }, [onStat, countBubbles]);

  const addRowTop = useCallback(() => {
    const grid = gridRef.current;
    const row: Bubble[] = [];
    for (let c = 0; c < COLS; c++) row.push({ color: randColor() });
    grid.unshift(row);
  }, [randColor]);

  const checkGameOver = useCallback(() => {
    const grid = gridRef.current;
    const limitRow = ROWS_VISIBLE - 2;
    for (let r = limitRow; r < grid.length; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r]?.[c]) return true;
      }
    }
    return false;
  }, []);

  const endGame = useCallback(() => {
    if (overRef.current) return;
    overRef.current = true;
    onGameOver(scoreRef.current);
  }, [onGameOver]);

  const nextLevel = useCallback(() => {
    levelRef.current += 1;
    scoreRef.current += 500;
    onScore(scoreRef.current);
    initGrid();
    shotsFiredRef.current = 0;
    pushStats();
  }, [initGrid, onScore, pushStats]);

  const resolveShot = useCallback(
    (shot: Shot, cell: number) => {
      ensureRow(0);
      const { r, c } = xyToRC(shot.x, shot.y, cell);
      const rr = Math.max(0, r);
      const cc = Math.max(0, Math.min(COLS - 1, c));
      ensureRow(rr);
      const grid = gridRef.current;
      const row = grid[rr];
      if (row && !row[cc]) {
        row[cc] = { color: shot.color };
      } else {
        // find nearest empty neighbor
        let placed = false;
        for (const [nr, nc] of neighbors(rr, cc)) {
          if (nr < 0 || nc < 0 || nc >= COLS) continue;
          ensureRow(nr);
          const nrow = gridRef.current[nr];
          if (nrow && !nrow[nc]) {
            nrow[nc] = { color: shot.color };
            placed = true;
            break;
          }
        }
        if (!placed) {
          ensureRow(rr + 1);
          const frow = gridRef.current[rr + 1];
          if (frow) frow[cc] = { color: shot.color };
        }
      }
      shotRef.current = null;

      const matchAt = (mr: number, mc: number) => {
        const match = floodMatch(mr, mc);
        if (match.length >= 3) {
          for (const [xr, xc] of match) {
            const rowArr = gridRef.current[xr];
            if (rowArr) rowArr[xc] = null;
          }
          scoreRef.current += match.length * 10;
          const floating = findFloating();
          if (floating.length) {
            scoreRef.current += floating.length * 20;
            for (const [fr, fc] of floating) {
              const rowArr = gridRef.current[fr];
              if (rowArr) rowArr[fc] = null;
            }
          }
          onScore(scoreRef.current);
        }
      };
      // find actual placed coordinates
      outer: for (let sr = 0; sr < gridRef.current.length; sr++) {
        for (let sc = 0; sc < COLS; sc++) {
          const b = gridRef.current[sr]?.[sc];
          if (b && b.color === shot.color) {
            // heuristic: just check the cell we placed at (rr,cc) directly
          }
        }
        break outer;
      }
      matchAt(rr, cc);

      shotsFiredRef.current += 1;
      if (shotsFiredRef.current >= SHOTS_PER_ROW) {
        shotsFiredRef.current = 0;
        addRowTop();
      }

      if (countBubbles() === 0) {
        nextLevel();
      } else if (checkGameOver()) {
        endGame();
      }
      pushStats();
    },
    [
      ensureRow,
      xyToRC,
      neighbors,
      floodMatch,
      findFloating,
      onScore,
      addRowTop,
      countBubbles,
      nextLevel,
      checkGameOver,
      endGame,
      pushStats,
    ]
  );

  useEffect(() => {
    initGrid();
    curColorRef.current = randColor();
    nextColorRef.current = randColor();
    pushStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const resize = () => {
      const w = Math.min(wrap.clientWidth, 480);
      const h = w * AR;
      canvas.width = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      sizeRef.current = { w, h, cell: w / COLS };
    };
    resize();
    window.addEventListener("resize", resize);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const getPointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * sizeRef.current.w,
        y: ((clientY - rect.top) / rect.height) * sizeRef.current.h,
      };
    };

    const setAim = (x: number, y: number) => {
      aimRef.current = { x, y };
    };

    const fire = () => {
      if (pausedRef.current || overRef.current || shotRef.current) return;
      const { w, h } = sizeRef.current;
      const sx = w / 2;
      const sy = h - 20;
      const { x: ax, y: ay } = aimRef.current;
      const dx = ax - sx;
      const dy = ay - sy;
      const len = Math.hypot(dx, dy) || 1;
      const speed = 9;
      shotRef.current = {
        x: sx,
        y: sy,
        vx: (dx / len) * speed,
        vy: (dy / len) * speed,
        color: curColorRef.current,
      };
      curColorRef.current = nextColorRef.current;
      nextColorRef.current = randColor();
    };

    const onMove = (e: PointerEvent) => {
      const p = getPointer(e.clientX, e.clientY);
      setAim(p.x, p.y);
    };
    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      const p = getPointer(e.clientX, e.clientY);
      setAim(p.x, p.y);
      fire();
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      if (!t) return;
      const p = getPointer(t.clientX, t.clientY);
      setAim(p.x, p.y);
    };

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        const t = e.touches[0];
        if (!t) return;
        const p = getPointer(t.clientX, t.clientY);
        setAim(p.x, p.y);
        fire();
      },
      { passive: false }
    );

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (pausedRef.current || overRef.current) {
        draw(ctx);
        return;
      }
      const { w, cell } = sizeRef.current;
      const shot = shotRef.current;
      if (shot) {
        shot.x += shot.vx;
        shot.y += shot.vy;
        const radius = cell / 2 - 2;
        if (shot.x - radius < 0) {
          shot.x = radius;
          shot.vx *= -1;
        } else if (shot.x + radius > w) {
          shot.x = w - radius;
          shot.vx *= -1;
        }
        // collide with top
        let collide = shot.y - radius <= 0;
        if (!collide) {
          const grid = gridRef.current;
          for (let r = 0; r < grid.length && !collide; r++) {
            for (let c = 0; c < COLS; c++) {
              const b = grid[r]?.[c];
              if (!b) continue;
              const { x, y } = rcToXY(r, c, cell);
              if ((x - shot.x) ** 2 + (y - shot.y) ** 2 < (cell * 0.9) ** 2) {
                collide = true;
                break;
              }
            }
          }
        }
        if (collide) {
          resolveShot(shot, cell);
        }
      }
      draw(ctx);
    };

    const draw = (context: CanvasRenderingContext2D) => {
      const { w, h, cell } = sizeRef.current;
      context.save();
      context.scale(devicePixelRatio, devicePixelRatio);
      context.fillStyle = "#0f172a";
      context.fillRect(0, 0, w, h);

      // danger line
      context.strokeStyle = "#7f1d1d";
      context.setLineDash([4, 4]);
      const dangerY = (ROWS_VISIBLE - 2) * cell * 0.87 + cell / 2;
      context.beginPath();
      context.moveTo(0, dangerY);
      context.lineTo(w, dangerY);
      context.stroke();
      context.setLineDash([]);

      const radius = cell / 2 - 2;
      const grid = gridRef.current;
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < COLS; c++) {
          const b = grid[r]?.[c];
          if (!b) continue;
          const { x, y } = rcToXY(r, c, cell);
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fillStyle = COLORS[b.color] ?? "#fff";
          context.fill();
          context.strokeStyle = "rgba(0,0,0,0.3)";
          context.stroke();
        }
      }

      const sx = w / 2;
      const sy = h - 20;
      const { x: ax, y: ay } = aimRef.current;
      const dx = ax - sx;
      const dy = ay - sy;
      const len = Math.hypot(dx, dy) || 1;
      context.strokeStyle = "rgba(255,255,255,0.4)";
      context.beginPath();
      context.moveTo(sx, sy);
      context.lineTo(sx + (dx / len) * 200, sy + (dy / len) * 200);
      context.stroke();

      context.beginPath();
      context.arc(sx, sy, radius, 0, Math.PI * 2);
      context.fillStyle = COLORS[curColorRef.current] ?? "#fff";
      context.fill();
      context.strokeStyle = "#fff";
      context.stroke();

      context.beginPath();
      context.arc(sx + cell * 1.4, sy, radius * 0.6, 0, Math.PI * 2);
      context.fillStyle = COLORS[nextColorRef.current] ?? "#fff";
      context.fill();

      const shot = shotRef.current;
      if (shot) {
        context.beginPath();
        context.arc(shot.x, shot.y, radius, 0, Math.PI * 2);
        context.fillStyle = COLORS[shot.color] ?? "#fff";
        context.fill();
        context.strokeStyle = "#fff";
        context.stroke();
      }

      context.restore();
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("touchmove", onTouchMove);
    };
  }, [randColor, rcToXY, resolveShot]);

  return (
    <div ref={wrapRef} className="w-full flex justify-center">
      <canvas
        ref={canvasRef}
        className="no-touch-scroll rounded-lg bg-slate-900 touch-none"
        style={{ touchAction: "none", maxWidth: compact ? 320 : 480 }}
      />
    </div>
  );
}
