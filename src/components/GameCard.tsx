import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { GameMeta } from "@/games/registry";
import { getLocalHighScore } from "@/lib/scores";

/** Simple deterministic thumbnail drawn with CSS — no external assets. */
function Thumb({ game }: { game: GameMeta }) {
  const initials = game.title
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      aria-hidden
      className={`relative grid h-28 place-items-center overflow-hidden rounded-xl bg-gradient-to-br ${game.accent} to-surface-2`}
    >
      <div className="absolute inset-0 opacity-40 [background-image:repeating-linear-gradient(45deg,transparent_0_10px,var(--color-border)_10px_11px)]" />
      <span className="relative font-display text-3xl font-bold tracking-tight text-foreground">
        {initials}
      </span>
    </div>
  );
}

export function GameCard({ game }: { game: GameMeta }) {
  const [best, setBest] = useState(0);
  useEffect(() => setBest(getLocalHighScore(game.slug)), [game.slug]);

  return (
    <article className="glass flex flex-col gap-3 rounded-2xl p-3 transition-transform duration-200 hover:-translate-y-1">
      <Thumb game={game} />
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-lg leading-tight">{game.title}</h3>
        <span className="rounded-full bg-surface-2 px-2 py-1 text-[0.62rem] uppercase tracking-wider text-muted-foreground">
          {game.category}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{game.short}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className="text-xs text-muted-foreground">
          Best <span className="font-semibold text-foreground">{best}</span>
        </span>
        <Link
          to="/games/$slug"
          params={{ slug: game.slug }}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Play
        </Link>
      </div>
    </article>
  );
}
