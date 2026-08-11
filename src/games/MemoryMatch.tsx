import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "./types";

const SYMBOLS = [
  "●", "■", "▲", "◆", "★", "✚", "◉", "⬟", "⬢", "⬣", "◐", "◇",
];

interface Card {
  id: number;
  symbol: string;
  flipped: boolean;
  matched: boolean;
}

const LEVEL_PAIRS = [4, 6, 8];

function pairsForLevel(level: number): number {
  const idx = Math.min(level - 1, LEVEL_PAIRS.length - 1);
  return LEVEL_PAIRS[idx] ?? 8;
}

function buildDeck(pairs: number): Card[] {
  const chosen = SYMBOLS.slice(0, pairs);
  const deck: Card[] = [];
  chosen.forEach((symbol, i) => {
    deck.push({ id: i * 2, symbol, flipped: false, matched: false });
    deck.push({ id: i * 2 + 1, symbol, flipped: false, matched: false });
  });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = deck[i]!;
    const b = deck[j]!;
    deck[i] = b;
    deck[j] = a;
  }
  return deck;
}

export default function MemoryMatch({ onScore, onGameOver, onStat, paused, compact }: GameProps) {
  const [level, setLevel] = useState(1);
  const [cards, setCards] = useState<Card[]>(() => buildDeck(pairsForLevel(1)));
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [locked, setLocked] = useState(false);

  const scoreRef = useRef(score);
  scoreRef.current = score;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [paused]);

  useEffect(() => {
    onStat?.({ Moves: moves, Time: seconds, Level: level });
  }, [moves, seconds, level, onStat]);

  const startLevel = useCallback((lvl: number) => {
    setCards(buildDeck(pairsForLevel(lvl)));
    setSelected([]);
    setMoves(0);
    setLocked(false);
  }, []);

  const handleFlip = (idx: number) => {
    if (paused || locked) return;
    const card = cards[idx];
    if (!card || card.flipped || card.matched) return;
    if (selected.length === 2) return;

    const newCards = cards.map((c, i) => (i === idx ? { ...c, flipped: true } : c));
    setCards(newCards);
    const newSelected = [...selected, idx];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setLocked(true);
      const [i1, i2] = newSelected as [number, number];
      const c1 = newCards[i1];
      const c2 = newCards[i2];
      const nextMoves = moves + 1;
      setMoves(nextMoves);

      if (c1 && c2 && c1.symbol === c2.symbol) {
        timeoutRef.current = setTimeout(() => {
          setCards((prev) => {
            const updated = prev.map((c, i) =>
              i === i1 || i === i2 ? { ...c, matched: true } : c
            );
            const allMatched = updated.every((c) => c.matched);
            const gained = Math.max(50, 200 - nextMoves * 5);
            const newScore = scoreRef.current + gained;
            setScore(newScore);
            onScore(newScore);
            setSelected([]);
            setLocked(false);

            if (allMatched) {
              const isHard = pairsForLevel(level) >= 8 && level >= LEVEL_PAIRS.length;
              if (isHard) {
                onGameOver(newScore);
              } else {
                const nextLevel = level + 1;
                setLevel(nextLevel);
                setTimeout(() => startLevel(nextLevel), 400);
              }
            }
            return updated;
          });
        }, 200);
      } else {
        timeoutRef.current = setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) => (i === i1 || i === i2 ? { ...c, flipped: false } : c))
          );
          setSelected([]);
          setLocked(false);
        }, 700);
      }
    }
  };

  const pairs = pairsForLevel(level);
  const cols = pairs <= 4 ? 4 : pairs <= 6 ? 4 : 4;

  const gridCols = useMemo(() => {
    if (pairs === 4) return "grid-cols-4";
    if (pairs === 6) return "grid-cols-4";
    return "grid-cols-4";
  }, [pairs]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>Level {level}</span>
        <span>Moves: {moves}</span>
        <span>Time: {seconds}s</span>
      </div>
      <div
        className={`grid ${gridCols} gap-2 sm:gap-3 w-full max-w-md`}
        role="grid"
        aria-label="Memory match board"
      >
        {cards.map((card, idx) => {
          const isVisible = card.flipped || card.matched;
          return (
            <button
              key={card.id}
              type="button"
              role="gridcell"
              aria-label={isVisible ? `Card showing ${card.symbol}` : "Hidden card"}
              disabled={paused || locked || card.matched || card.flipped}
              onClick={() => handleFlip(idx)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleFlip(idx);
                }
              }}
              className={`aspect-square rounded-lg border border-border flex items-center justify-center text-2xl sm:text-3xl font-bold select-none transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                card.matched
                  ? "bg-success text-primary-foreground opacity-80"
                  : isVisible
                    ? "bg-surface-2 text-primary-foreground"
                    : "bg-surface hover:bg-surface-2 text-transparent"
              } ${compact ? "min-h-10" : "min-h-14"}`}
              style={{
                transform: isVisible ? "rotateY(0deg)" : "rotateY(180deg)",
              }}
            >
              {isVisible ? card.symbol : "?"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
