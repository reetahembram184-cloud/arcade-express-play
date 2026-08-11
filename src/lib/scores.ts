import { supabase } from "@/integrations/supabase/client";

const key = (slug: string) => `opplay:hs:${slug}`;

export function getLocalHighScore(slug: string): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(key(slug));
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function setLocalHighScore(slug: string, score: number): boolean {
  if (typeof window === "undefined") return false;
  const current = getLocalHighScore(slug);
  if (score > current) {
    window.localStorage.setItem(key(slug), String(score));
    return true;
  }
  return false;
}

export interface SubmitScoreArgs {
  slug: string;
  score: number;
  duration: number;
}

/**
 * Saves a score to the leaderboard. Works for guests (user_id null) and for
 * signed-in players. The database validates ranges and trims the display name.
 */
export async function submitScore({ slug, score, duration }: SubmitScoreArgs) {
  const { data: game } = await supabase
    .from("games")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!game) return { ok: false as const, error: "Game not found" };

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user ?? null;

  let playerName = "Guest Player";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    playerName = profile?.display_name || user.email?.split("@")[0] || "Player";
  }

  const { error } = await supabase.from("scores").insert({
    user_id: user?.id ?? null,
    game_id: game.id,
    score: Math.max(0, Math.round(score)),
    duration: Math.max(0, Math.round(duration)),
    player_name: playerName,
  });

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
