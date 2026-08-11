import { createFileRoute } from "@tanstack/react-router";
import { DevShell, Overview } from "@/components/DevPortal";

export const Route = createFileRoute("/_authenticated/developer/dashboard")({
  head: () => ({
    meta: [
      { title: "Developer Dashboard | OP Play Games" },
      { name: "description", content: "Your OP Play developer overview: plays, embeds and games." },
      { property: "og:title", content: "Developer Dashboard | OP Play Games" },
      { property: "og:description", content: "Plays, embeds and games at a glance." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <DevShell title="Overview">
      <Overview />
    </DevShell>
  ),
});
