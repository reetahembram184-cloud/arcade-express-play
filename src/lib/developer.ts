import { supabase } from "@/integrations/supabase/client";

export interface DeveloperProfile {
  id: string;
  user_id: string;
  developer_name: string;
  developer_id: string;
  is_active: boolean;
  created_at: string;
}

/** Returns the signed-in user's developer profile, creating it on first visit. */
export async function ensureDeveloperProfile(): Promise<DeveloperProfile | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;

  const { data: existing } = await supabase
    .from("developer_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return existing as DeveloperProfile;

  const name =
    (user.user_metadata?.["display_name"] as string | undefined) ||
    user.email?.split("@")[0] ||
    "Developer";

  const { data: created, error } = await supabase
    .from("developer_profiles")
    .insert({ user_id: user.id, developer_name: name })
    .select("*")
    .maybeSingle();
  if (error) return null;
  return (created as DeveloperProfile) ?? null;
}

export function siteOrigin(): string {
  const configured = (import.meta.env as Record<string, string | undefined>)[
    "VITE_PUBLIC_SITE_URL"
  ];
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function embedUrl(gameSlug: string, token: string) {
  return `${siteOrigin()}/embed/${gameSlug}/${token}`;
}

export function embedIframe(gameSlug: string, token: string, height: string, width: string) {
  return `<iframe
  src="${embedUrl(gameSlug, token)}"
  width="${width}"
  height="${height}"
  style="border:0;max-width:100%"
  loading="lazy"
  allowfullscreen>
</iframe>`;
}
