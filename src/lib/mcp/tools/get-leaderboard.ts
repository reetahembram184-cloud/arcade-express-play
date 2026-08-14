import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "get_leaderboard",
  title: "Get leaderboard",
  description: "Get the public high scores, optionally for one game (by slug).",
  inputSchema: {
    game_slug: z.string().trim().min(1).optional().describe("Game slug, e.g. 'car-race'."),
    limit: z.number().int().min(1).max(50).default(10).describe("Number of top scores to return."),
  },
  outputSchema: { scores: z.array(z.record(z.string(), z.unknown())) },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ game_slug, limit }) => {
    const supabase = supabaseAnon();
    let gameId: string | undefined;
    if (game_slug) {
      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("id")
        .eq("slug", game_slug)
        .maybeSingle();
      if (gameError) return { content: [{ type: "text", text: gameError.message }], isError: true };
      if (!game) return { content: [{ type: "text", text: `No game found with slug "${game_slug}"` }], isError: true };
      gameId = game.id;
    }

    let query = supabase
      .from("scores")
      .select("player_name, score, duration, created_at, games(name, slug)")
      .order("score", { ascending: false })
      .limit(limit ?? 10);
    if (gameId) query = query.eq("game_id", gameId);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { scores: data ?? [] },
    };
  },
});
