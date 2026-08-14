// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";

// GitHub Pages: static SPA build (no server runtime).
// Enabled by setting GITHUB_PAGES=true in the deploy workflow so the normal
// Lovable/server build stays exactly as it was.
const isGithubPages = process.env["GITHUB_PAGES"] === "true";

export default defineConfig({
  plugins: [mcpPlugin()],

  vite: {
    base: "/arcade-express-play/",
  },

  // Nitro (server bundle) is not used for GitHub Pages — output is pure static.
  ...(isGithubPages ? { nitro: false as const } : {}),

  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    ...(isGithubPages
      ? {
          // One static shell (index.html) that boots the client router for every route.
          spa: { enabled: true, prerender: { outputPath: "/index.html" } },
        }
      : {}),
  },
});
