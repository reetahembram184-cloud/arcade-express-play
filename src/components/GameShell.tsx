import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import type { GameMeta } from "@/games/registry";
import { getLocalHighScore, setLocalHighScore, submitScore } from "@/lib/scores";
import { PostGameAd } from "@/components/ads/AdSlots";
import { InterstitialAd } from "@/components/ads/InterstitialAd";
import { initializeAds, shouldShowInterstitial } from "@/services/adService";

type Phase = "intro" | "ad" | "playing" | "over";

interface GameShellProps {
  game: GameMeta;
  /** "embed" hides links back into the main site. */
  mode?: "page" | "embed";
  onScoreSaved?: (score: number) => void;
  showPreGameAd?: boolean;
}


function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex min-w-[4.5rem] flex-col rounded-xl bg-surface-2/70 px-3 py-2">
      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className="font-display text-lg leading-tight text-foreground">{value}</span>
    </div>
  );
}

export function GameShell({
  game,
  mode = "page",
  onScoreSaved,
  showPreGameAd = true,
}: GameShellProps) {
  const [phase, setPhase] = useState<Phase>(showPreGameAd ? "intro" : "playing");
  const [runId, setRunId] = useState(0);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [stats, setStats] = useState<Record<string, string | number>>({});
  const [highScore, setHighScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [isBest, setIsBest] = useState(false);
  const startedAt = useRef<number>(Date.now());
  const endedRef = useRef(false);

  useEffect(() => {
    setHighScore(getLocalHighScore(game.slug));
  }, [game.slug]);

  const handleScore = useCallback((n: number) => setScore(n), []);
  const handleStat = useCallback(
    (s: Record<string, string | number>) => setStats(s),
    [],
  );

  const handleGameOver = useCallback(
    (final: number) => {
      if (endedRef.current) return;
      endedRef.current = true;
      const duration = Math.round((Date.now() - startedAt.current) / 1000);
      setFinalScore(final);
      setPhase("over");
      const best = setLocalHighScore(game.slug, final);
      setIsBest(best);
      if (best) setHighScore(final);
      void submitScore({ slug: game.slug, score: final, duration }).then((res) => {
        if (res.ok) {
          onScoreSaved?.(final);
          if (mode === "page") toast.success("Score saved to the leaderboard");
        }
      });
    },
    [game.slug, mode, onScoreSaved],
  );

  const startRun = useCallback(() => {
    endedRef.current = false;
    startedAt.current = Date.now();
    setScore(0);
    setStats({});
    setPaused(false);
    setRunId((n) => n + 1);
    setPhase("playing");
  }, []);

  /** PLAY GAME → (maybe) interstitial → game. Ads never block gameplay. */
  const handlePlay = useCallback(() => {
    if (showPreGameAd && shouldShowInterstitial()) {
      setPhase("ad");
      return;
    }
    startRun();
  }, [showPreGameAd, startRun]);

  const Game = game.Component;

  if (phase === "intro") {
    return (
      <div className="glass flex w-full flex-col items-center gap-4 rounded-2xl p-8 text-center">
        <h2 className="font-display text-2xl">{game.title}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{game.short}</p>
        <button
          type="button"
          onClick={handlePlay}
          className="w-full rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
        >
          ▶ Play Game
        </button>
        <p className="text-xs text-muted-foreground">
          An advertisement may play before the game starts.
        </p>
      </div>
    );
  }

  if (phase === "ad") {
    return <InterstitialAd onFinished={startRun} />;
  }


  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="flex flex-wrap items-center gap-2 border-b border-border/70 p-3">
        <Stat label="Score" value={score} />
        <Stat label="Best" value={Math.max(highScore, score)} />
        {Object.entries(stats).map(([label, value]) => (
          <Stat key={label} label={label} value={value} />
        ))}
        <div className="ml-auto">
          {phase === "playing" ? (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Resume game" : "Pause game"}
              className="rounded-xl border border-border bg-surface-2 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
            >
              {paused ? "Resume" : "Pause"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="relative p-3">
        {phase === "playing" ? (
          <Suspense
            fallback={
              <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                Loading game…
              </div>
            }
          >
            <Game
              key={runId}
              paused={paused}
              compact={mode === "embed"}
              onScore={handleScore}
              onStat={handleStat}
              onGameOver={handleGameOver}
            />
          </Suspense>
        ) : null}

        {phase === "playing" && paused ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-xl bg-background/80 backdrop-blur-sm">
            <p className="font-display text-2xl">Paused</p>
            <button
              type="button"
              onClick={() => setPaused(false)}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Resume
            </button>
          </div>
        ) : null}

        {phase === "over" ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <h2 className="font-display text-3xl text-gradient">Game Over</h2>
            <div className="flex gap-3">
              <Stat label="Final Score" value={finalScore} />
              <Stat label="Best Score" value={highScore} />
            </div>
            {isBest ? (
              <p className="text-sm font-semibold text-success">New personal best!</p>
            ) : null}
            <PostGameAd className="max-w-md" />
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={startRun}
                className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Play Again
              </button>
              {mode === "page" ? (
                <Link
                  to="/games"
                  className="rounded-xl border border-border bg-surface-2 px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
                >
                  Back to Games
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
