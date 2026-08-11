import { createFileRoute } from "@tanstack/react-router";
import { ApiDocs, DevShell, GenerateEmbed } from "@/components/DevPortal";

export const Route = createFileRoute("/_authenticated/developer/generate")({
  head: () => ({
    meta: [
      { title: "Generate Embed | OP Play Games" },
      { name: "description", content: "Generate a secure embed link for any OP Play game." },
      { property: "og:title", content: "Generate Embed | OP Play Games" },
      { property: "og:description", content: "Create an authorised iframe embed for your site." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <DevShell title="Generate Embed">
      <div className="space-y-6">
        <GenerateEmbed />
        <ApiDocs />
      </div>
    </DevShell>
  ),
});
