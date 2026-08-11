import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { GameShell } from "@/components/GameShell";
import { BannerAd } from "@/components/ads/AdSlots";
import { getGame } from "@/games/registry";
import { getLocalHighScore } from "@/lib/scores";

export const Route = createFileRoute("/games/$slug")({
  loader: ({ params }) => {
    const game = getGame(params.slug);
    if (!game) throw notFound();
    return { title: game.title, description: game.description };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Game unavailable | OP Play Games" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.title} — Play Free Online | OP Play Games`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.description },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.description },
      ],
    };
  },
  notFoundComponent: GameMissing,
  errorComponent: GameMissing,
  component: GamePage,
});

function GameMissing() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-2xl">Game unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sorry, this game is temporarily unavailable.
        </p>
        <Link
          to="/games"
          className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Back to Games
        </Link>
      </div>
    </SiteLayout>
  );
}

function GamePage() {
  const { slug } = Route.useParams();
  const game = getGame(slug);
  const [best, setBest] = useState(0);

  useEffect(() => {
    if (game) setBest(getLocalHighScore(game.slug));
  }, [game]);

  if (!game) return <GameMissing />;

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          <Link
            to="/games"
            aria-label="Back to games"
            className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm font-semibold"
          >
            ←
          </Link>
          <div>
            <h1 className="font-display text-2xl leading-tight sm:text-3xl">{game.title}</h1>
            <p className="text-xs text-muted-foreground">
              {game.category} · {game.difficulty}
            </p>
          </div>
        </div>

        <BannerAd className="mb-4" />

        <GameShell game={game} onScoreSaved={(s) => setBest((b) => Math.max(b, s))} />

        <BannerAd className="mt-4" />

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="glass rounded-2xl p-5">
            <h2 className="font-display text-lg">How to Play</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {game.howToPlay.map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden className="text-primary">
                    ▸
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-2xl p-5">
            <h2 className="font-display text-lg">Controls</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {game.controls.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm">
              Best score:{" "}
              <span className="font-display text-xl text-primary">{best}</span>
            </p>
          </div>
        </section>

        <section className="glass mt-4 rounded-2xl p-5">
          <h2 className="font-display text-lg">About {game.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{game.description}</p>
        </section>
      </div>
    </SiteLayout>
  );
}
