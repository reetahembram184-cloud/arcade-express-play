import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { AuthCard } from "@/components/AuthCard";

export const Route = createFileRoute("/developer/register")({
  head: () => ({
    meta: [
      { title: "Create a Developer Account | OP Play Games" },
      {
        name: "description",
        content: "Register as an OP Play Games developer to generate authorised game embed links.",
      },
      { property: "og:title", content: "Create a Developer Account | OP Play Games" },
      { property: "og:description", content: "Register to generate authorised game embed links." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <SiteLayout>
      <AuthCard mode="register" />
    </SiteLayout>
  ),
});
