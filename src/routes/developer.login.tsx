import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { AuthCard } from "@/components/AuthCard";

export const Route = createFileRoute("/developer/login")({
  head: () => ({
    meta: [
      { title: "Developer Sign In | OP Play Games" },
      { name: "description", content: "Sign in to the OP Play Games developer portal to manage your embeds." },
      { property: "og:title", content: "Developer Sign In | OP Play Games" },
      { property: "og:description", content: "Sign in to manage your OP Play game embeds." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { next?: string } =>
    typeof s["next"] === "string" ? { next: s["next"] } : {},
  component: LoginPage,
});

function LoginPage() {
  const { next } = Route.useSearch();
  return (
    <SiteLayout>
      <AuthCard mode="login" next={next} />
    </SiteLayout>
  );
}
