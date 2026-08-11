import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About OP Play Games — Original Browser Mini Games" },
      {
        name: "description",
        content:
          "OP Play Games is a mobile-first platform of ten original HTML5 mini games with local high scores, leaderboards and a developer embed system.",
      },
      { property: "og:title", content: "About | OP Play Games" },
      {
        property: "og:description",
        content: "Ten original HTML5 mini games with leaderboards and embeds.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
        <h1 className="font-display text-3xl sm:text-4xl">About OP Play Games</h1>
        <p className="text-muted-foreground">
          OP Play Games is a mobile-first arcade of ten original HTML5 mini games. Every
          game runs entirely in the browser, loads in seconds and works with touch,
          mouse and keyboard.
        </p>
        <div className="glass space-y-3 rounded-2xl p-6">
          <h2 className="font-display text-xl">Original artwork only</h2>
          <p className="text-sm text-muted-foreground">
            All graphics are drawn with Canvas, CSS and SVG. No copyrighted characters,
            logos, sounds or level designs are used anywhere on the platform.
          </p>
        </div>
        <div className="glass space-y-3 rounded-2xl p-6">
          <h2 className="font-display text-xl">Scores and privacy</h2>
          <p className="text-sm text-muted-foreground">
            High scores are stored on your device and, when a score is submitted, on the
            public leaderboard. Guests appear as “Guest Player”. We do not publish email
            addresses or other private account information.
          </p>
        </div>
        <div className="glass space-y-3 rounded-2xl p-6">
          <h2 className="font-display text-xl">For developers</h2>
          <p className="text-sm text-muted-foreground">
            Generate an authorised embed link and drop any OP Play game into your own
            site with a single iframe.
          </p>
          <Link
            to="/developer"
            className="inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Developer Portal
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
