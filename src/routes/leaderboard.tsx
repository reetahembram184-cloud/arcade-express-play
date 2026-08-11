import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { GAMES } from "@/games/registry";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Top Scores | OP Play Games" },
      {
        name: "description",
        content:
          "See the highest scores across all OP Play mini games and compare your best runs with other players.",
      },
      { property: "og:title", content: "Leaderboard | OP Play Games" },
      { property: "og:description", content: "Top scores across all OP Play mini games." },
    ],
  }),
  component: Leaderboard,
});

interface Row {
  id: string;
  player_name: string;
  score: number;
  created_at: string;
  games: { name: string; slug: string } | null;
}

function Leaderboard() {
  const [tab, setTab] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", tab],
    queryFn: async () => {
      let q = supabase
        .from("scores")
        .select("id, player_name, score, created_at, games!inner(name, slug)")
        .order("score", { ascending: false })
        .limit(25);
      if (tab !== "all") q = q.eq("games.slug", tab);
      const { data: rows, error } = await q;
      if (error) throw error;
      return (rows ?? []) as unknown as Row[];
    },
  });

  const tabs = [{ slug: "all", title: "All Games" }, ...GAMES.map((g) => ({ slug: g.slug, title: g.title }))];

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <h1 className="font-display text-3xl sm:text-4xl">Leaderboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Top 25 scores. Play without an account and you appear as Guest Player.
        </p>

        <div className="-mx-4 mt-6 overflow-x-auto px-4">
          <div role="tablist" aria-label="Leaderboard filters" className="flex w-max gap-2 pb-2">
            {tabs.map((t) => (
              <button
                key={t.slug}
                role="tab"
                aria-selected={tab === t.slug}
                onClick={() => setTab(t.slug)}
                className={
                  "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-colors " +
                  (tab === t.slug
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-surface-2 text-muted-foreground hover:text-foreground")
                }
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>

        <div className="glass mt-4 overflow-hidden rounded-2xl">
          <div className="grid grid-cols-[3rem_1fr_auto] gap-3 border-b border-border/70 px-4 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span>Rank</span>
            <span>Player</span>
            <span>Score</span>
          </div>
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-surface-2" />
              ))}
            </div>
          ) : !data || data.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No scores yet — be the first to set one.
            </p>
          ) : (
            <ul>
              {data.map((row, i) => (
                <li
                  key={row.id}
                  className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 border-b border-border/40 px-4 py-3 text-sm last:border-0"
                >
                  <span className="font-display text-base text-primary">#{i + 1}</span>
                  <span className="truncate">
                    {row.player_name}
                    {tab === "all" && row.games ? (
                      <span className="ml-2 text-xs text-muted-foreground">{row.games.name}</span>
                    ) : null}
                  </span>
                  <span className="font-display text-base">{row.score}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
