import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import type { GameMeta } from "@/games/registry";
import { getLocalHighScore, setLocalHighScore, submitScore } from "@/lib/scores";
import { BannerAd, PostGameAd } from "@/components/ads/AdSlots";
import { InterstitialAd } from "@/components/ads/InterstitialAd";
import { initializeAds, shouldShowInterstitial } from "@/services/adService";
import { Button } from "@/components/ui/button";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { isGameSoundEnabled, playGameSound, setGameSoundEnabled } from "@/lib/gameAudio";

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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const startedAt = useRef<number>(Date.now());
  const endedRef = useRef(false);

  useEffect(() => {
    setHighScore(getLocalHighScore(game.slug));
    setSoundEnabled(isGameSoundEnabled());
  }, [game.slug]);

  // Warm up the ad library so the interstitial request is fast.
  useEffect(() => {
    void initializeAds();
  }, []);

  const lastSoundScore = useRef(0);
  const handleScore = useCallback((n: number) => {
    setScore(n);
    if (n > lastSoundScore.current) playGameSound("score");
    lastSoundScore.current = n;
  }, []);
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
      playGameSound(best ? "best" : "over");
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
    lastSoundScore.current = 0;
    setStats({});
    setPaused(false);
    setRunId((n) => n + 1);
    setPhase("playing");
    playGameSound("start");
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setGameSoundEnabled(next);
    if (next) playGameSound("click");
  };

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
      <div className="arcade-shell relative flex min-h-[25rem] w-full flex-col items-center justify-center overflow-hidden rounded-lg p-6 text-center sm:min-h-[29rem]">
        <div className="arcade-scanlines" aria-hidden />
        <span className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.3em] text-primary">Ready player</span>
        <h2 className="font-display text-3xl font-bold uppercase sm:text-4xl">{game.title}</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{game.short}</p>
        <Button onClick={handlePlay} size="icon" className="play-pulse relative mt-8 size-20 rounded-full border-4 border-primary-foreground/20" aria-label={`Play ${game.title}`}>
          <Play className="ml-1 size-9 fill-current" aria-hidden />
        </Button>
        <p className="mt-4 font-display text-xs font-bold uppercase tracking-[0.22em] text-primary">Tap to start</p>
        <p className="mt-5 text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">Best score · <span className="text-foreground">{highScore}</span></p>
        <BannerAd className="mt-6 max-w-md" />
      </div>
    );
  }

  if (phase === "ad") {
    return (
      <div className="flex w-full flex-col items-center gap-3">
        <InterstitialAd onFinished={startRun} />
        <BannerAd className="max-w-md" />
      </div>
    );
  }



  return (
    <div className="arcade-shell overflow-hidden rounded-lg">
      <div className="flex flex-wrap items-center gap-2 border-b border-border/70 bg-surface/90 p-3">
        <Stat label="Score" value={score} />
        <Stat label="Best" value={Math.max(highScore, score)} />
        {Object.entries(stats).map(([label, value]) => (
          <Stat key={label} label={label} value={value} />
        ))}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="icon" onClick={toggleSound} aria-label={soundEnabled ? "Mute game sounds" : "Enable game sounds"} title={soundEnabled ? "Mute sounds" : "Enable sounds"}>
            {soundEnabled ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
          </Button>
          {phase === "playing" ? (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Resume game" : "Pause game"}
              title={paused ? "Resume" : "Pause"}
            >
              {paused ? <Play aria-hidden /> : <Pause aria-hidden />}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="game-surface relative p-2 sm:p-3">
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
            <Button
              onClick={() => setPaused(false)}
            >
              <Play aria-hidden /> Resume
            </Button>
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
              <Button
                onClick={handlePlay}
              >
                <RotateCcw aria-hidden /> Play Again
              </Button>
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
