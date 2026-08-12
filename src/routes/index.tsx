import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { GameCard } from "@/components/GameCard";
import { FEATURED_SLUGS, GAMES } from "@/games/registry";
import { BannerAd, InterstitialAdSlot } from "@/components/ads/AdSlots";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OP Play Games — Free Online Mini Games" },
      {
        name: "description",
        content:
          "Play 10 free browser mini games — car racing, bubble shooter, brick breaker and more. No installation, instant play on mobile and desktop.",
      },
      { property: "og:title", content: "OP Play Games — Free Online Mini Games" },
      {
        property: "og:description",
        content: "Fast, fun and addictive browser games — no installation required.",
      },
    ],
  }),
  component: Home,
});

const REASONS = [
  { title: "Free to Play", body: "Every game is free, forever. No accounts, no paywalls." },
  { title: "Mobile Friendly", body: "Touch controls designed for phones and tablets first." },
  { title: "No Installation", body: "Games load instantly in the browser — nothing to download." },
  { title: "Fast Games", body: "Short, addictive runs that fit into a coffee break." },
  { title: "Developer Embeds", body: "Generate an authorised embed link and add games to your site." },
];

function Home() {
  const featured = GAMES.filter((g) => FEATURED_SLUGS.includes(g.slug));

  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:py-24">
          <span className="rounded-full border border-border bg-surface-2/70 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Play. Score. Have Fun.
          </span>
          <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.05] sm:text-6xl">
            Play <span className="text-gradient">Free Mini Games</span> Online
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            Fast, fun and addictive browser games — no installation required.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              to="/games"
              className="rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Play Games
            </Link>
            <Link
              to="/developer"
              className="rounded-xl border border-border bg-surface-2 px-7 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
            >
              Developer Portal
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-4">
        <BannerAd />
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <h2 className="mb-5 font-display text-2xl sm:text-3xl">Popular Games</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-6">
        <InterstitialAdSlot />
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl sm:text-3xl">All Games</h2>
          <Link to="/games" className="text-sm text-primary hover:underline">
            Browse all
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <h2 className="mb-5 font-display text-2xl sm:text-3xl">Why OP Play?</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((r) => (
            <div key={r.title} className="glass rounded-2xl p-5">
              <h3 className="font-display text-lg">{r.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="glass flex flex-col items-start gap-4 rounded-2xl p-6 sm:p-10">
          <h2 className="font-display text-2xl sm:text-3xl">
            Add OP Play Games to Your Website
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Developers can generate an authorised embed link for selected games and add
            the game to their own website with a single iframe.
          </p>
          <Link
            to="/developer"
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Open Developer Portal
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
