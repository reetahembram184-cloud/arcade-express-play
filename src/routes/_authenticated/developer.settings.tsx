import { createFileRoute } from "@tanstack/react-router";
import { AccountSettings, DevShell } from "@/components/DevPortal";

export const Route = createFileRoute("/_authenticated/developer/settings")({
  head: () => ({
    meta: [
      { title: "Account Settings | OP Play Games" },
      { name: "description", content: "Update your OP Play developer profile details." },
      { property: "og:title", content: "Account Settings | OP Play Games" },
      { property: "og:description", content: "Manage your developer account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <DevShell title="Account Settings">
      <AccountSettings />
    </DevShell>
  ),
});
