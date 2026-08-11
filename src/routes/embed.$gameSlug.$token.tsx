import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GameShell } from "@/components/GameShell";
import { getGame } from "@/games/registry";
import { validateEmbed, recordEmbedEvent } from "@/lib/embeds.functions";
import type { EmbedValidation } from "@/lib/embeds.functions";

export const Route = createFileRoute("/embed/$gameSlug/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "OP Play Games — Embedded Game" },
      { name: "description", content: "An OP Play mini game embedded on a partner website." },
      { property: "og:title", content: "OP Play Games — Embedded Game" },
      { property: "og:description", content: "An embedded OP Play mini game." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EmbedPage,
});

const MESSAGES: Record<string, string> = {
  not_found: "This embed link is invalid or has been disabled.",
  disabled: "This embed link is invalid or has been disabled.",
  expired: "This embed link has expired.",
  game_inactive: "Sorry, this game is temporarily unavailable.",
  developer_inactive: "This embed link is invalid or has been disabled.",
  domain: "This embed link is not authorised for this website.",
};

function EmbedPage() {
  const { gameSlug, token } = Route.useParams();
  const [state, setState] = useState<EmbedValidation | null>(null);

  useEffect(() => {
    const origin =
      typeof document !== "undefined" && document.referrer ? document.referrer : undefined;
    let active = true;
    void validateEmbed({ data: { token, gameSlug, origin } }).then((res) => {
      if (!active) return;
      setState(res);
      if (res.ok) void recordEmbedEvent({ data: { token, eventType: "load", origin } });
    });
    return () => {
      active = false;
    };
  }, [gameSlug, token]);

  const game = getGame(gameSlug);

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-sm text-muted-foreground">
        Loading game…
      </div>
    );
  }

  if (!state.ok || !game) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <h1 className="font-display text-xl">Game unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {MESSAGES[state.reason ?? "not_found"] ??
              "This embed link is invalid or has been disabled."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2">
      <div className="mx-auto flex max-w-2xl flex-col gap-2">
        <GameShell
          game={game}
          mode="embed"
          showPreGameAd={false}
          onScoreSaved={() =>
            void recordEmbedEvent({ data: { token, eventType: "score" } })
          }
        />
        <p className="text-center text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
          Powered by OP Play Games
        </p>
      </div>
    </div>
  );
}
