import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "my_embeds",
  title: "My embed links",
  description: "List the signed-in developer's embed tokens with their game, allowed domain and status.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).default(20).describe("Number of embeds to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: profile, error: profileError } = await supabase
      .from("developer_profiles")
      .select("id, developer_id, developer_name")
      .eq("user_id", ctx.getUserId()!)
      .maybeSingle();
    if (profileError) return { content: [{ type: "text", text: profileError.message }], isError: true };
    if (!profile) {
      return {
        content: [{ type: "text", text: "No developer profile yet — create one in the developer portal." }],
        structuredContent: { embeds: [] },
      };
    }

    const { data, error } = await supabase
      .from("embed_tokens")
      .select("token, status, allowed_domain, created_at, last_used_at, expires_at, games(name, slug)")
      .eq("developer_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify({ developer: profile.developer_name, embeds: data ?? [] }) }],
      structuredContent: { developer: profile.developer_name, embeds: data ?? [] },
    };
  },
});
