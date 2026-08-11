import { createServerFn } from "@tanstack/react-start";

export interface EmbedValidation {
  ok: boolean;
  reason?: "not_found" | "disabled" | "expired" | "game_inactive" | "developer_inactive" | "domain";
  gameSlug?: string;
  gameName?: string;
  tokenId?: string;
}

/**
 * Server-side validation of an embed token. Uses privileged access because
 * embed tokens are never readable by anonymous clients.
 */
export const validateEmbed = createServerFn({ method: "GET" })
  .inputValidator((input: { token: string; gameSlug: string; origin?: string | undefined }) => ({
    token: String(input.token ?? "").slice(0, 128),
    gameSlug: String(input.gameSlug ?? "").slice(0, 64),
    origin: input.origin ? String(input.origin).slice(0, 256) : undefined,
  }))
  .handler(async ({ data }): Promise<EmbedValidation> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row } = await supabaseAdmin
      .from("embed_tokens")
      .select(
        "id, status, expires_at, allowed_domain, games(slug, name, is_active), developer_profiles(is_active)",
      )
      .eq("token", data.token)
      .maybeSingle();

    if (!row) return { ok: false, reason: "not_found" };

    const game = row.games as { slug: string; name: string; is_active: boolean } | null;
    const dev = row.developer_profiles as { is_active: boolean } | null;

    if (row.status !== "active") return { ok: false, reason: "disabled" };
    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now())
      return { ok: false, reason: "expired" };
    if (!game || !game.is_active) return { ok: false, reason: "game_inactive" };
    if (game.slug !== data.gameSlug) return { ok: false, reason: "not_found" };
    if (!dev || !dev.is_active) return { ok: false, reason: "developer_inactive" };

    if (row.allowed_domain && data.origin) {
      let host = "";
      try {
        host = new URL(data.origin).hostname.toLowerCase();
      } catch {
        host = data.origin.toLowerCase();
      }
      const allowed = row.allowed_domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      if (host !== allowed && !host.endsWith("." + allowed)) {
        return { ok: false, reason: "domain" };
      }
    }

    return { ok: true, gameSlug: game.slug, gameName: game.name, tokenId: row.id };
  });

/** Records an embed lifecycle event (load / play / score) for developer analytics. */
export const recordEmbedEvent = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; eventType: string; origin?: string | undefined }) => ({
    token: String(input.token ?? "").slice(0, 128),
    eventType: ["load", "play", "score"].includes(String(input.eventType))
      ? String(input.eventType)
      : "load",
    origin: input.origin ? String(input.origin).slice(0, 256) : null,
  }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("embed_tokens")
      .select("id, game_id, status")
      .eq("token", data.token)
      .maybeSingle();
    if (!row || row.status !== "active") return { ok: false };

    await supabaseAdmin.from("embed_events").insert({
      embed_token_id: row.id,
      game_id: row.game_id,
      event_type: data.eventType,
      origin: data.origin,
    });
    await supabaseAdmin
      .from("embed_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", row.id);
    return { ok: true };
  });
