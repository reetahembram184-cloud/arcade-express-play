import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { GameCard } from "@/components/GameCard";
import { GAMES } from "@/games/registry";
import { BannerAd } from "@/components/ads/AdSlots";

export const Route = createFileRoute("/games/")({
  head: () => ({
    meta: [
      { title: "All Games — Play Free Online | OP Play Games" },
      {
        name: "description",
        content:
          "Browse all 10 free OP Play mini games: car racing, colour match, bubble shooter, fruit catch, brick breaker, memory, space dodge and more.",
      },
      { property: "og:title", content: "All Games | OP Play Games" },
      {
        property: "og:description",
        content: "Ten original browser mini games, free and instantly playable.",
      },
    ],
  }),
  component: GamesIndex,
});

function GamesIndex() {
  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl sm:text-4xl">All Games</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {GAMES.length} original mini games. Pick one and play instantly.
        </p>
        <div className="my-6">
          <BannerAd />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
