import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { GAMES, getGame } from "@/games/registry";
import {
  ensureDeveloperProfile,
  embedIframe,
  embedUrl,
  type DeveloperProfile,
} from "@/lib/developer";

const DEV_NAV = [
  { to: "/developer/dashboard", label: "Overview" },
  { to: "/developer/generate", label: "Generate Embed" },
  { to: "/developer/embeds", label: "Embed Links" },
  { to: "/developer/analytics", label: "Analytics" },
  { to: "/developer/settings", label: "Account" },
] as const;

export function DevShell({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/developer/login", replace: true });
  };

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl sm:text-3xl">{title}</h1>
          <button
            type="button"
            onClick={signOut}
            className="rounded-xl border border-border bg-surface-2 px-4 py-2 text-sm font-semibold"
          >
            Sign out
          </button>
        </div>
        <div className="-mx-4 mt-4 overflow-x-auto px-4">
          <nav aria-label="Developer" className="flex w-max gap-2 pb-2">
            {DEV_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeProps={{ className: "bg-primary text-primary-foreground" }}
                className="whitespace-nowrap rounded-xl border border-border bg-surface-2 px-4 py-2 text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </SiteLayout>
  );
}

export function useDeveloper() {
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void ensureDeveloperProfile().then((p) => {
      setProfile(p);
      setLoading(false);
    });
  }, []);
  return { profile, loading };
}

interface TokenRow {
  id: string;
  token: string;
  status: string;
  allowed_domain: string | null;
  created_at: string;
  expires_at: string | null;
  game_id: string;
  games: { slug: string; name: string } | null;
}

export function useTokens(developerId: string | undefined) {
  return useQuery({
    queryKey: ["embed-tokens", developerId],
    enabled: Boolean(developerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("embed_tokens")
        .select("id, token, status, allowed_domain, created_at, expires_at, game_id, games(slug, name)")
        .eq("developer_id", developerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as TokenRow[];
    },
  });
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl">{value}</p>
    </div>
  );
}

export function Overview() {
  const { profile, loading } = useDeveloper();
  const { data: tokens } = useTokens(profile?.id);

  const { data: events } = useQuery({
    queryKey: ["embed-events", profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("embed_events")
        .select("id, event_type, created_at, game_id")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (loading) return <p className="text-sm text-muted-foreground">Loading your profile…</p>;
  if (!profile)
    return <p className="text-sm text-muted-foreground">Could not load your developer profile.</p>;

  const plays = (events ?? []).filter((e) => e.event_type === "play");
  const today = plays.filter(
    (e) => new Date(e.created_at).toDateString() === new Date().toDateString(),
  ).length;
  const week = plays.filter(
    (e) => Date.now() - new Date(e.created_at).getTime() < 7 * 864e5,
  ).length;
  const active = (tokens ?? []).filter((t) => t.status === "active").length;

  const byGame = new Map<string, number>();
  for (const p of plays) {
    const gid = p.game_id ?? "";
    byGame.set(gid, (byGame.get(gid) ?? 0) + 1);
  }
  let topGameId: string | null = null;
  let topCount = 0;
  for (const [gid, count] of byGame) if (count > topCount) [topGameId, topCount] = [gid, count];
  const topGame =
    (tokens ?? []).find((t) => t.game_id === topGameId)?.games?.name ?? "—";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Total Plays" value={plays.length} />
        <Stat label="Active Embeds" value={active} />
        <Stat label="Total Games" value={GAMES.length} />
        <Stat label="Top Game" value={topGame} />
        <Stat label="Plays Today" value={today} />
        <Stat label="Plays This Week" value={week} />
      </div>
      <div className="glass rounded-2xl p-5">
        <h2 className="font-display text-lg">My Developer Profile</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Name</dt>
            <dd>{profile.developer_name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Developer ID</dt>
            <dd className="font-mono text-xs">{profile.developer_id}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd>{new Date(profile.created_at).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd>{profile.is_active ? "Active" : "Disabled"}</dd>
          </div>
        </dl>
      </div>
      <div className="glass rounded-2xl p-5">
        <h2 className="font-display text-lg">My Games</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every OP Play game is available to embed.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {GAMES.map((g) => (
            <span key={g.slug} className="rounded-full bg-surface-2 px-3 py-1 text-xs">
              {g.title}
            </span>
          ))}
        </div>
        <Link
          to="/developer/generate"
          className="mt-4 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Generate Embed
        </Link>
      </div>
    </div>
  );
}

export function GenerateEmbed() {
  const { profile, loading } = useDeveloper();
  const queryClient = useQueryClient();
  const [slug, setSlug] = useState(GAMES[0]?.slug ?? "");
  const [widthMode, setWidthMode] = useState<"responsive" | "custom">("responsive");
  const [customWidth, setCustomWidth] = useState("800");
  const [height, setHeight] = useState("600");
  const [domain, setDomain] = useState("");
  const [created, setCreated] = useState<{ token: string; slug: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    if (!profile) return;
    setBusy(true);
    try {
      const { data: game } = await supabase
        .from("games")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!game) throw new Error("Game not found");
      const { data, error } = await supabase
        .from("embed_tokens")
        .insert({
          developer_id: profile.id,
          game_id: game.id,
          allowed_domain: domain.trim() || null,
        })
        .select("token")
        .maybeSingle();
      if (error) throw error;
      setCreated({ token: data!.token, slug });
      void queryClient.invalidateQueries({ queryKey: ["embed-tokens"] });
      toast.success("Embed generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate embed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const width = widthMode === "responsive" ? "100%" : customWidth;
  const code = created ? embedIframe(created.slug, created.token, height, width) : "";

  return (
    <div className="space-y-6">
      <div className="glass space-y-4 rounded-2xl p-5">
        <div>
          <label htmlFor="game" className="text-sm font-medium">
            Game
          </label>
          <select
            id="game"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-surface-2 px-4 py-3 text-sm"
          >
            {GAMES.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.title}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="width" className="text-sm font-medium">
              Embed width
            </label>
            <select
              id="width"
              value={widthMode}
              onChange={(e) => setWidthMode(e.target.value === "custom" ? "custom" : "responsive")}
              className="mt-1 w-full rounded-xl border border-input bg-surface-2 px-4 py-3 text-sm"
            >
              <option value="responsive">Responsive (100%)</option>
              <option value="custom">Custom</option>
            </select>
            {widthMode === "custom" ? (
              <input
                aria-label="Custom width in pixels"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value.replace(/\D/g, ""))}
                className="mt-2 w-full rounded-xl border border-input bg-surface-2 px-4 py-3 text-sm"
              />
            ) : null}
          </div>
          <div>
            <label htmlFor="height" className="text-sm font-medium">
              Embed height (px)
            </label>
            <input
              id="height"
              value={height}
              onChange={(e) => setHeight(e.target.value.replace(/\D/g, ""))}
              className="mt-1 w-full rounded-xl border border-input bg-surface-2 px-4 py-3 text-sm"
            />
          </div>
        </div>
        <div>
          <label htmlFor="domain" className="text-sm font-medium">
            Allowed domain (optional)
          </label>
          <input
            id="domain"
            placeholder="example.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-surface-2 px-4 py-3 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Leave empty to allow any site. Domain checks are enforced on the server.
          </p>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={busy || !profile}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          Generate Embed
        </button>
      </div>

      {created ? (
        <div className="glass space-y-3 rounded-2xl p-5">
          <h2 className="font-display text-lg">Your Embed Code</h2>
          <pre className="overflow-x-auto rounded-xl bg-surface-2 p-4 text-xs leading-relaxed">
            {code}
          </pre>
          <p className="break-all text-xs text-muted-foreground">
            Direct URL: {embedUrl(created.slug, created.token)}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(code);
                toast.success("Code copied");
              }}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Copy Code
            </button>
            <a
              href={embedUrl(created.slug, created.token)}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-border bg-surface-2 px-5 py-2.5 text-sm font-semibold"
            >
              Preview
            </a>
            <Link
              to="/developer/embeds"
              className="rounded-xl border border-border bg-surface-2 px-5 py-2.5 text-sm font-semibold"
            >
              Manage links
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function EmbedLinks() {
  const { profile } = useDeveloper();
  const { data: tokens, isLoading } = useTokens(profile?.id);
  const queryClient = useQueryClient();

  const { data: events } = useQuery({
    queryKey: ["embed-events", profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("embed_events")
        .select("embed_token_id, event_type")
        .limit(2000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const update = async (id: string, patch: { status?: string; token?: string }, message: string) => {
    const { error } = await supabase.from("embed_tokens").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(message);
      void queryClient.invalidateQueries({ queryKey: ["embed-tokens"] });
    }
  };

  const regenerate = async (id: string) => {
    if (!window.confirm("Regenerate token? The current link will stop working.")) return;
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    await update(id, { token }, "Token regenerated");
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading embeds…</p>;
  if (!tokens || tokens.length === 0)
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-sm text-muted-foreground">No embed links yet.</p>
        <Link
          to="/developer/generate"
          className="mt-4 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Generate your first embed
        </Link>
      </div>
    );

  return (
    <div className="glass overflow-x-auto rounded-2xl">
      <table className="w-full min-w-[42rem] text-left text-sm">
        <thead className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
          <tr>
            <th className="p-3">Game</th>
            <th className="p-3">Status</th>
            <th className="p-3">Created</th>
            <th className="p-3">Plays</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((t) => {
            const plays = (events ?? []).filter(
              (e) => e.embed_token_id === t.id && e.event_type === "play",
            ).length;
            const slug = t.games?.slug ?? "";
            return (
              <tr key={t.id} className="border-t border-border/50">
                <td className="p-3">{t.games?.name ?? slug}</td>
                <td className="p-3">
                  <span
                    className={
                      "rounded-full px-2 py-1 text-xs " +
                      (t.status === "active"
                        ? "bg-success text-success-foreground"
                        : "bg-surface-2 text-muted-foreground")
                    }
                  >
                    {t.status}
                  </span>
                </td>
                <td className="p-3">{new Date(t.created_at).toLocaleDateString()}</td>
                <td className="p-3">{plays}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={embedUrl(slug, t.token)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-border px-3 py-1.5 text-xs"
                    >
                      Preview
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(
                          embedIframe(slug, t.token, "600", "100%"),
                        );
                        toast.success("Code copied");
                      }}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (t.status === "active") {
                          if (!window.confirm("Disable embed? The link will stop working."))
                            return;
                          void update(t.id, { status: "disabled" }, "Link disabled");
                        } else {
                          void update(t.id, { status: "active" }, "Link enabled");
                        }
                      }}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs"
                    >
                      {t.status === "active" ? "Disable" : "Enable"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void regenerate(t.id)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs"
                    >
                      Regenerate
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function Analytics() {
  const { profile } = useDeveloper();
  const { data: tokens } = useTokens(profile?.id);
  const { data: events, isLoading } = useQuery({
    queryKey: ["embed-events-all", profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("embed_events")
        .select("id, event_type, created_at, game_id")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading analytics…</p>;

  const plays = (events ?? []).filter((e) => e.event_type === "play");
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 864e5);
    const count = plays.filter(
      (p) => new Date(p.created_at).toDateString() === d.toDateString(),
    ).length;
    return { label: d.toLocaleDateString(undefined, { weekday: "short" }), count };
  });
  const max = Math.max(1, ...days.map((d) => d.count));

  const perGame = new Map<string, number>();
  for (const p of plays) {
    const gid = p.game_id ?? "";
    perGame.set(gid, (perGame.get(gid) ?? 0) + 1);
  }
  const gameName = (id: string) =>
    (tokens ?? []).find((t) => t.game_id === id)?.games?.name ?? "Game";

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-5">
        <h2 className="font-display text-lg">Plays over time (7 days)</h2>
        <div className="mt-4 flex h-40 items-end gap-2">
          {days.map((d) => (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-primary"
                style={{ height: `${(d.count / max) * 100}%`, minHeight: "4px" }}
                aria-label={`${d.count} plays on ${d.label}`}
              />
              <span className="text-xs text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="glass rounded-2xl p-5">
        <h2 className="font-display text-lg">Games by popularity</h2>
        {perGame.size === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No embed plays recorded yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {[...perGame.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([id, count]) => (
                <li key={id} className="flex items-center gap-3 text-sm">
                  <span className="w-40 truncate">{gameName(id)}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <span
                      className="block h-full bg-accent"
                      style={{ width: `${(count / Math.max(...perGame.values())) * 100}%` }}
                    />
                  </span>
                  <span className="w-10 text-right">{count}</span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function AccountSettings() {
  const { profile, loading } = useDeveloper();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (profile) setName(profile.developer_name);
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, [profile]);

  const save = async () => {
    if (!profile) return;
    const { error } = await supabase
      .from("developer_profiles")
      .update({ developer_name: name })
      .eq("id", profile.id);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="glass max-w-lg space-y-4 rounded-2xl p-5">
      <div>
        <label htmlFor="devname" className="text-sm font-medium">
          Developer name
        </label>
        <input
          id="devname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-input bg-surface-2 px-4 py-3 text-sm"
        />
      </div>
      <div>
        <label htmlFor="devemail" className="text-sm font-medium">
          Email
        </label>
        <input
          id="devemail"
          value={email}
          readOnly
          className="mt-1 w-full rounded-xl border border-input bg-surface-2 px-4 py-3 text-sm text-muted-foreground"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Developer ID: <span className="font-mono">{profile?.developer_id}</span>
      </p>
      <button
        type="button"
        onClick={save}
        className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
      >
        Save changes
      </button>
    </div>
  );
}

export function ApiDocs() {
  const g = getGame("car-race");
  return (
    <div className="glass rounded-2xl p-5 text-sm text-muted-foreground">
      <h2 className="font-display text-lg text-foreground">API / Integration</h2>
      <p className="mt-2">
        Embeds are plain iframes — no SDK required. Example for {g?.title}:
      </p>
      <pre className="mt-3 overflow-x-auto rounded-xl bg-surface-2 p-4 text-xs">
{`<iframe src="YOUR_GENERATED_EMBED_URL" width="100%" height="600" style="border:0" allowfullscreen></iframe>`}
      </pre>
    </div>
  );
}
