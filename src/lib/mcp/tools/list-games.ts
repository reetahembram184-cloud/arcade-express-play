import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "list_games",
  title: "List games",
  description: "List the mini games available on OP Play Games, with slug, category and description.",
  inputSchema: {
    category: z.string().trim().min(1).optional().describe("Filter by category, e.g. 'arcade'."),
    limit: z.number().int().min(1).max(50).default(20).describe("Maximum number of games to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category, limit }) => {
    const supabase = supabaseAnon();
    let query = supabase
      .from("games")
      .select("name, slug, category, description, is_active")
      .eq("is_active", true)
      .order("name")
      .limit(limit ?? 20);
    if (category) query = query.eq("category", category);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { games: data ?? [] },
    };
  },
});
