import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listGamesTool from "./tools/list-games";
import getLeaderboardTool from "./tools/get-leaderboard";
import myScoresTool from "./tools/my-scores";
import myEmbedsTool from "./tools/my-embeds";

// The OAuth issuer must be the direct Supabase host; the project ref is the only
// value that survives publish unchanged.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "play-arcade-hub",
  title: "Play Arcade Hub",
  version: "0.1.0",
  instructions:
    "Tools for OP Play Games. Use `list_games` to browse the mini games, `get_leaderboard` for public high scores, `my_scores` for the signed-in player's own results, and `my_embeds` for the signed-in developer's embed links.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listGamesTool, getLeaderboardTool, myScoresTool, myEmbedsTool],
});
