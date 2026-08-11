import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { GAMES } from "@/games/registry";

export const Route = createFileRoute("/developer/")({
  head: () => ({
    meta: [
      { title: "Developer Portal — Embed Games | OP Play Games" },
      {
        name: "description",
        content:
          "Create a developer account, generate an authorised embed link and add OP Play mini games to your own website with one iframe.",
      },
      { property: "og:title", content: "Developer Portal | OP Play Games" },
      {
        property: "og:description",
        content: "Generate authorised embed links for OP Play mini games.",
      },
    ],
  }),
  component: DeveloperLanding,
});

const STEPS = [
  ["Step 1", "Create a developer account", "Sign up with your email address or Google."],
  ["Step 2", "Select a game", "Choose any of the OP Play games from the generator."],
  ["Step 3", "Generate an embed link", "A secure random token is issued for that game."],
  ["Step 4", "Copy the iframe code", "One click copies a ready-to-paste snippet."],
  ["Step 5", "Paste it into your website", "Drop the iframe anywhere in your HTML."],
] as const;

function DeveloperLanding() {
  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <h1 className="font-display text-3xl sm:text-4xl">Developer Portal</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Add OP Play Games to your website. Generate an authorised embed link for any
          of our {GAMES.length} games, control which domains may load it, and track
          plays from your dashboard.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/developer/dashboard"
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Open Dashboard
          </Link>
          <Link
            to="/developer/register"
            className="rounded-xl border border-border bg-surface-2 px-6 py-3 text-sm font-semibold"
          >
            Create Account
          </Link>
          <Link
            to="/developer/login"
            className="rounded-xl border border-border bg-surface-2 px-6 py-3 text-sm font-semibold"
          >
            Sign In
          </Link>
        </div>

        <section className="mt-12">
          <h2 className="font-display text-2xl">How to Embed a Game</h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2">
            {STEPS.map(([step, title, body]) => (
              <li key={step} className="glass rounded-2xl p-5">
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-primary">
                  {step}
                </span>
                <h3 className="mt-1 font-display text-lg">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="glass mt-6 rounded-2xl p-5">
          <h2 className="font-display text-xl">Example</h2>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-surface-2 p-4 text-xs leading-relaxed text-muted-foreground">
{`<iframe
  src="YOUR_GENERATED_EMBED_URL"
  width="100%"
  height="600"
  frameborder="0"
  allowfullscreen>
</iframe>`}
          </pre>
          <p className="mt-3 text-sm text-muted-foreground">
            The generated token controls access to the embed. Disabling or regenerating
            a token immediately stops the old link from loading the game, and an
            optional allowed domain restricts which site may embed it.
          </p>
        </section>
      </div>
    </SiteLayout>
  );
}
