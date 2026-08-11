import { createFileRoute } from "@tanstack/react-router";
import { DevShell, EmbedLinks } from "@/components/DevPortal";

export const Route = createFileRoute("/_authenticated/developer/embeds")({
  head: () => ({
    meta: [
      { title: "Embed Links | OP Play Games" },
      { name: "description", content: "Manage, disable and regenerate your OP Play embed links." },
      { property: "og:title", content: "Embed Links | OP Play Games" },
      { property: "og:description", content: "Manage your OP Play game embed links." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <DevShell title="Embed Links">
      <EmbedLinks />
    </DevShell>
  ),
});
