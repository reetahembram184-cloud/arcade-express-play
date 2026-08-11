import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "./types";

interface WordEntry {
  word: string;
  clue: string;
  difficulty: "easy" | "medium" | "hard";
}

const WORDS: WordEntry[] = [
  // easy: 4-5 letters
  { word: "BOOK", clue: "You read this", difficulty: "easy" },
  { word: "MOON", clue: "Orbits the Earth at night", difficulty: "easy" },
  { word: "FISH", clue: "Swims in water", difficulty: "easy" },
  { word: "STAR", clue: "Twinkles in the sky", difficulty: "easy" },
  { word: "BIRD", clue: "Has feathers and flies", difficulty: "easy" },
  { word: "CAKE", clue: "Baked and eaten on birthdays", difficulty: "easy" },
  { word: "TREE", clue: "Has roots, trunk and leaves", difficulty: "easy" },
  { word: "RIVER", clue: "Flowing body of water", difficulty: "easy" },
  { word: "CHAIR", clue: "You sit on it", difficulty: "easy" },
  { word: "HOUSE", clue: "A place people live in", difficulty: "easy" },
  { word: "BREAD", clue: "Baked from flour", difficulty: "easy" },
  { word: "CLOCK", clue: "Tells the time", difficulty: "easy" },
  { word: "GRAPE", clue: "Small fruit that grows in bunches", difficulty: "easy" },
  { word: "PLANT", clue: "Grows in soil, needs water", difficulty: "easy" },
  { word: "SMILE", clue: "Happy facial expression", difficulty: "easy" },
  { word: "WATER", clue: "H2O", difficulty: "easy" },
  { word: "LIGHT", clue: "Opposite of dark", difficulty: "easy" },
  { word: "MUSIC", clue: "Sounds arranged pleasingly", difficulty: "easy" },
  { word: "PIZZA", clue: "Italian dish with cheese and toppings", difficulty: "easy" },
  { word: "TIGER", clue: "Striped big cat", difficulty: "easy" },
  // medium: 6-7 letters
  { word: "PLANET", clue: "Orbits a star", difficulty: "medium" },
  { word: "GARDEN", clue: "Place to grow flowers", difficulty: "medium" },
  { word: "CASTLE", clue: "Home of a king or queen", difficulty: "medium" },
  { word: "WINDOW", clue: "Lets light into a room", difficulty: "medium" },
  { word: "PENCIL", clue: "Used for writing or drawing", difficulty: "medium" },
  { word: "MARKET", clue: "Place to buy goods", difficulty: "medium" },
  { word: "FRIEND", clue: "Someone you like and trust", difficulty: "medium" },
  { word: "ISLAND", clue: "Land surrounded by water", difficulty: "medium" },
  { word: "ROCKET", clue: "Travels to space", difficulty: "medium" },
  { word: "BASKET", clue: "Container woven from material", difficulty: "medium" },
  { word: "DRAGON", clue: "Mythical fire-breathing creature", difficulty: "medium" },
  { word: "WIZARD", clue: "Practices magic", difficulty: "medium" },
  { word: "JOURNEY", clue: "A long trip", difficulty: "medium" },
  { word: "FREEDOM", clue: "Being free", difficulty: "medium" },
  { word: "MYSTERY", clue: "Something unexplained", difficulty: "medium" },
  { word: "AIRPORT", clue: "Where planes take off", difficulty: "medium" },
  { word: "PICTURE", clue: "An image or photo", difficulty: "medium" },
  { word: "KITCHEN", clue: "Room for cooking", difficulty: "medium" },
  { word: "TEACHER", clue: "Person who instructs students", difficulty: "medium" },
  { word: "RAINBOW", clue: "Colorful arc after rain", difficulty: "medium" },
  // hard: 8+ letters
  { word: "ELEPHANT", clue: "Large mammal with a trunk", difficulty: "hard" },
  { word: "COMPUTER", clue: "Machine for processing data", difficulty: "hard" },
  { word: "MOUNTAIN", clue: "Very tall landform", difficulty: "hard" },
  { word: "SANDWICH", clue: "Food between two bread slices", difficulty: "hard" },
  { word: "TELESCOPE", clue: "Used to view distant stars", difficulty: "hard" },
  { word: "UMBRELLA", clue: "Keeps you dry in the rain", difficulty: "hard" },
  { word: "CHOCOLATE", clue: "Sweet treat made from cacao", difficulty: "hard" },
  { word: "ADVENTURE", clue: "An exciting journey or experience", difficulty: "hard" },
  { word: "DINOSAUR", clue: "Extinct prehistoric reptile", difficulty: "hard" },
  { word: "BUTTERFLY", clue: "Insect with colorful wings", difficulty: "hard" },
  { word: "KEYBOARD", clue: "Used to type on a computer", difficulty: "hard" },
  { word: "BACKPACK", clue: "Bag carried on your back", difficulty: "hard" },
  { word: "VOLCANO", clue: "Mountain that erupts lava", difficulty: "hard" },
  { word: "PAINTING", clue: "Artwork made with paint", difficulty: "hard" },
  { word: "HOSPITAL", clue: "Place to treat sick people", difficulty: "hard" },
  { word: "LANGUAGE", clue: "System of communication", difficulty: "hard" },
  { word: "SCULPTURE", clue: "3D piece of art", difficulty: "hard" },
  { word: "SYMPHONY", clue: "Large orchestral composition", difficulty: "hard" },
  { word: "CRYSTAL", clue: "Clear, structured mineral", difficulty: "hard" },
  { word: "FANTASTIC", clue: "Extremely good or impressive", difficulty: "hard" },
  { word: "UNIVERSE", clue: "All of space and everything in it", difficulty: "hard" },
];

const ROUND_TIME = 30;
const MAX_HINTS = 3;
const WRONG_PENALTY = 5;
const HINT_COST = 3;

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const ai = a[i];
    const aj = a[j];
    if (ai === undefined || aj === undefined) continue;
    a[i] = aj;
    a[j] = ai;
  }
  return a;
}

function pickWord(round: number): WordEntry {
  let pool: WordEntry[];
  if (round <= 3) pool = WORDS.filter((w) => w.difficulty === "easy");
  else if (round <= 7) pool = WORDS.filter((w) => w.difficulty === "medium");
  else pool = WORDS.filter((w) => w.difficulty === "hard");
  if (pool.length === 0) pool = WORDS;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx] ?? WORDS[0]!;
}

function scrambleWord(word: string): string[] {
  let letters = shuffleArr(word.split(""));
  // avoid the scramble being identical to the answer, when possible
  let tries = 0;
  while (letters.join("") === word && tries < 10) {
    letters = shuffleArr(word.split(""));
    tries++;
  }
  return letters;
}

export default function WordScramble({ onScore, onGameOver, onStat, paused, compact }: GameProps) {
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [current, setCurrent] = useState<WordEntry>(() => pickWord(1));
  const [tiles, setTiles] = useState<{ letter: string; used: boolean; key: number }[]>([]);
  const [built, setBuilt] = useState<number[]>([]); // indices into tiles
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintsThisRound, setHintsThisRound] = useState(0);
  const [showClue, setShowClue] = useState(false);
  const [revealedFirst, setRevealedFirst] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [ended, setEnded] = useState(false);
  const keyCounter = useRef(0);

  const setupRound = useCallback((entry: WordEntry) => {
    const letters = scrambleWord(entry.word);
    keyCounter.current = 0;
    setTiles(letters.map((letter) => ({ letter, used: false, key: keyCounter.current++ })));
    setBuilt([]);
    setTimeLeft(ROUND_TIME);
    setHintsThisRound(0);
    setShowClue(false);
    setRevealedFirst(false);
    setMessage(null);
    setTextInput("");
  }, []);

  useEffect(() => {
    setupRound(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onStat?.({ Time: timeLeft, Round: round, Hints: hintsUsed });
  }, [timeLeft, round, hintsUsed, onStat]);

  useEffect(() => {
    if (paused || ended) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          setEnded(true);
          onGameOver(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [paused, ended, onGameOver, score]);

  const currentBuiltWord = built
    .map((i) => tiles[i]?.letter ?? "")
    .join("");

  const tapTile = (idx: number) => {
    if (ended) return;
    const tile = tiles[idx];
    if (!tile || tile.used) return;
    setTiles((prev) => prev.map((t, i) => (i === idx ? { ...t, used: true } : t)));
    setBuilt((prev) => [...prev, idx]);
  };

  const removeLast = () => {
    if (built.length === 0) return;
    const lastIdx = built[built.length - 1];
    if (lastIdx === undefined) return;
    setTiles((prev) => prev.map((t, i) => (i === lastIdx ? { ...t, used: false } : t)));
    setBuilt((prev) => prev.slice(0, -1));
  };

  const clearAll = () => {
    setTiles((prev) => prev.map((t) => ({ ...t, used: false })));
    setBuilt([]);
  };

  const shuffleTiles = () => {
    if (built.length > 0) return;
    setTiles((prev) => shuffleArr(prev));
  };

  const nextRound = useCallback(() => {
    const nextRoundNum = round + 1;
    setRound(nextRoundNum);
    const entry = pickWord(nextRoundNum);
    setCurrent(entry);
    setupRound(entry);
  }, [round, setupRound]);

  const submit = useCallback(
    (answer: string) => {
      if (ended) return;
      const guess = answer.trim().toUpperCase();
      if (!guess) return;
      if (guess === current.word) {
        const lengthBonus = current.word.length * 10;
        const timeBonus = timeLeft * 3;
        const gained = lengthBonus + timeBonus;
        const newScore = score + gained;
        setScore(newScore);
        onScore(newScore);
        setMessage(`Correct! +${gained}`);
        setTimeout(() => {
          nextRound();
        }, 700);
      } else {
        const newScore = Math.max(0, score - WRONG_PENALTY);
        setScore(newScore);
        onScore(newScore);
        setMessage("Wrong, try again!");
        clearAll();
        setTextInput("");
      }
    },
    [current, ended, nextRound, onScore, score, timeLeft]
  );

  const useHint = () => {
    if (hintsUsed >= MAX_HINTS || ended) return;
    const newScore = Math.max(0, score - HINT_COST);
    setScore(newScore);
    onScore(newScore);
    setHintsUsed((h) => h + 1);
    setHintsThisRound((h) => h + 1);
    if (!showClue) {
      setShowClue(true);
    } else {
      setRevealedFirst(true);
    }
  };

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      submit(textInput);
    } else if (e.key === "Backspace" && textInput.length === 0) {
      removeLast();
    }
  };

  const remainingPct = useMemo(() => (timeLeft / ROUND_TIME) * 100, [timeLeft]);

  return (
    <div className={`flex h-full w-full flex-col items-center gap-4 rounded-lg bg-card p-4 text-primary-foreground ${compact ? "text-sm" : ""}`}>
      <div className="flex w-full max-w-md flex-col gap-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Round {round}</span>
          <span>Score: {score}</span>
          <span>Time: {timeLeft}s</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded bg-surface-2">
          <div
            className="h-full bg-primary transition-all duration-1000"
            style={{ width: `${remainingPct}%` }}
          />
        </div>
      </div>

      <div className="flex min-h-[2rem] items-center justify-center">
        {showClue ? (
          <p className="text-center text-sm text-muted-foreground">
            Clue: {current.clue}
            {revealedFirst && (
              <span className="ml-2 font-bold text-accent">
                Starts with "{current.word[0]}"
              </span>
            )}
          </p>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Unscramble the {current.word.length}-letter word
          </p>
        )}
      </div>

      <div className="flex min-h-12 flex-wrap items-center justify-center gap-2 rounded-md border border-border bg-surface p-3">
        {built.length === 0 && (
          <span className="text-sm text-muted-foreground">Tap letters below to build your answer</span>
        )}
        {built.map((idx, pos) => {
          const t = tiles[idx];
          return (
            <button
              key={`built-${pos}`}
              type="button"
              aria-label={`Remove letter ${t?.letter ?? ""}`}
              onClick={() => {
                setTiles((prev) => prev.map((tt, i) => (i === idx ? { ...tt, used: false } : tt)));
                setBuilt((prev) => prev.filter((_, i) => i !== pos));
              }}
              className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-lg font-bold text-primary-foreground"
            >
              {t?.letter}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {tiles.map((t, idx) => (
          <button
            key={t.key}
            type="button"
            disabled={t.used}
            aria-label={`Letter tile ${t.letter}`}
            onClick={() => tapTile(idx)}
            className={`flex h-12 w-12 items-center justify-center rounded-md border border-border text-lg font-bold transition ${
              t.used ? "invisible" : "bg-surface-2 text-primary-foreground hover:bg-accent"
            }`}
          >
            {t.letter}
          </button>
        ))}
      </div>

      <div className="flex w-full max-w-md flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          aria-label="Clear answer"
          onClick={clearAll}
          className="rounded-md bg-surface-2 px-3 py-2 text-sm hover:bg-surface"
        >
          Clear
        </button>
        <button
          type="button"
          aria-label="Shuffle letters"
          onClick={shuffleTiles}
          className="rounded-md bg-surface-2 px-3 py-2 text-sm hover:bg-surface"
        >
          Shuffle
        </button>
        <button
          type="button"
          aria-label="Use hint"
          onClick={useHint}
          disabled={hintsUsed >= MAX_HINTS || ended}
          className="rounded-md bg-warning px-3 py-2 text-sm text-primary-foreground disabled:opacity-40"
        >
          Hint ({MAX_HINTS - hintsUsed} left)
        </button>
        <button
          type="button"
          aria-label="Submit answer"
          onClick={() => submit(currentBuiltWord)}
          className="rounded-md bg-success px-3 py-2 text-sm font-bold text-primary-foreground"
        >
          Submit
        </button>
      </div>

      <input
        type="text"
        value={textInput}
        onChange={(e) => setTextInput(e.target.value.toUpperCase())}
        onKeyDown={handleTextKeyDown}
        placeholder="Or type your answer"
        aria-label="Type your answer"
        disabled={ended}
        className="w-full max-w-md rounded-md border border-border bg-surface px-3 py-2 text-center text-lg tracking-widest text-primary-foreground outline-none focus:border-primary"
      />

      {message && (
        <p className="text-sm font-semibold text-accent" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
