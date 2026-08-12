import { useEffect, useRef, useState } from "react";
import { displayInterstitialAd } from "@/services/adService";

type Status = "loading" | "showing" | "failed";

/**
 * Requests a real GPT interstitial and reports back when it is finished.
 * The player is never asked to interact with the ad — the provider owns the
 * creative and its close control. If nothing is available we say so and
 * continue to the game automatically.
 */
export function InterstitialAd({ onFinished }: { onFinished: () => void }) {
  const [status, setStatus] = useState<Status>("loading");
  const finishedRef = useRef(false);

  useEffect(() => {
    let active = true;
    void displayInterstitialAd().then((result) => {
      if (!active) return;
      if (result === "shown") {
        setStatus("showing");
        if (!finishedRef.current) {
          finishedRef.current = true;
          onFinished();
        }
        return;
      }
      setStatus("failed");
      window.setTimeout(() => {
        if (!active || finishedRef.current) return;
        finishedRef.current = true;
        onFinished();
      }, 900);
    });
    return () => {
      active = false;
    };
  }, [onFinished]);

  return (
    <div className="glass flex w-full flex-col items-center gap-4 rounded-2xl p-8 text-center">
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
        Advertisement
      </span>
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
        aria-hidden
      />
      <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
        {status === "failed"
          ? "Advertisement unavailable. Starting game…"
          : "Loading advertisement…"}
      </p>
    </div>
  );
}
