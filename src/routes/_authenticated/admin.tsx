import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin | OP Play Games" },
      { name: "description", content: "Administration dashboard for OP Play Games." },
      { property: "og:title", content: "Admin | OP Play Games" },
      { property: "og:description", content: "Administration dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.user.id)
        .eq("role", "admin")
        .maybeSingle();
      return Boolean(data);
    },
  });

  const { data: games, refetch } = useQuery({
    queryKey: ["admin-games"],
    enabled: isAdmin === true,
    queryFn: async () => {
      const { data } = await supabase.from("games").select("id, name, slug, is_active").order("name");
      return data ?? [];
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["admin-counts"],
    enabled: isAdmin === true,
    queryFn: async () => {
      const [devs, scores, embeds] = await Promise.all([
        supabase.from("developer_profiles").select("id", { count: "exact", head: true }),
        supabase.from("scores").select("id", { count: "exact", head: true }),
        supabase.from("embed_tokens").select("id", { count: "exact", head: true }).eq("status", "active"),
      ]);
      return {
        developers: devs.count ?? 0,
        plays: scores.count ?? 0,
        embeds: embeds.count ?? 0,
      };
    },
  });

  if (isLoading) {
    return (
      <SiteLayout>
        <p className="p-10 text-center text-sm text-muted-foreground">Checking permissions…</p>
      </SiteLayout>
    );
  }

  if (!isAdmin) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="font-display text-2xl">Admins only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account does not have administrator access.
          </p>
        </div>
      </SiteLayout>
    );
  }

  const toggle = async (id: string, next: boolean) => {
    const { error } = await supabase.from("games").update({ is_active: next }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(next ? "Game enabled" : "Game disabled");
      void refetch();
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <h1 className="font-display text-3xl">Admin</h1>
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Developers", counts?.developers ?? 0],
            ["Games", games?.length ?? 0],
            ["Recorded Plays", counts?.plays ?? 0],
            ["Active Embeds", counts?.embeds ?? 0],
          ].map(([label, value]) => (
            <div key={String(label)} className="glass rounded-2xl p-4">
              <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 font-display text-2xl">{value}</p>
            </div>
          ))}
        </div>

        <div className="glass mt-6 overflow-hidden rounded-2xl">
          <h2 className="border-b border-border/60 p-4 font-display text-lg">Games</h2>
          <ul>
            {(games ?? []).map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between gap-3 border-b border-border/40 p-4 text-sm last:border-0"
              >
                <span>{g.name}</span>
                <button
                  type="button"
                  onClick={() => void toggle(g.id, !g.is_active)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs"
                >
                  {g.is_active ? "Disable" : "Enable"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SiteLayout>
  );
}
