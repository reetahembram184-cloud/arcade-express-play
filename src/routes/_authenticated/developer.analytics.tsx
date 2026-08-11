import { createFileRoute } from "@tanstack/react-router";
import { Analytics, DevShell } from "@/components/DevPortal";

export const Route = createFileRoute("/_authenticated/developer/analytics")({
  head: () => ({
    meta: [
      { title: "Embed Analytics | OP Play Games" },
      { name: "description", content: "Plays over time and game popularity for your embeds." },
      { property: "og:title", content: "Embed Analytics | OP Play Games" },
      { property: "og:description", content: "Track plays across your embedded games." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <DevShell title="Analytics">
      <Analytics />
    </DevShell>
  ),
});
