import { useEffect, useRef, useState } from "react";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { adConfig, displayBannerAd, displayInterstitialAd, displayRewardedAd } from "@/services/adService";

/**
 * Full-screen advertisement shown before a game run.
 *
 * Web platforms cannot serve AdMob (mobile SDK) creatives, so we use Google's
 * web ad stack (GPT). We first ask for a real out-of-page interstitial; in
 * parallel we always render a real in-page ad slot inside this overlay so the
 * player reliably sees an advertisement. After the countdown the player can
 * continue — the ad itself is never required to be clicked.
 */
export function InterstitialAd({ onFinished }: { onFinished: () => void }) {
  const slotRef = useRef<HTMLDivElement | null>(null);
  const finishedRef = useRef(false);
  const [status, setStatus] = useState("Requesting Google test ad…");

  // Real GPT ad request inside the overlay.
  useEffect(() => {
    const el = slotRef.current;
    if (!el || !adConfig.enabled) return;
    let cleanup: (() => void) | null = null;
    let active = true;
    void displayBannerAd(el).then((fn) => {
      if (!active) fn();
      else cleanup = fn;
    });
    void (async () => {
      setStatus("Loading rewarded test ad…");
      const rewarded = await displayRewardedAd();
      if (!active) return;
      if (rewarded === "shown") {
        finishedRef.current = true;
        onFinished();
        return;
      }
      setStatus("Rewarded unavailable — trying interstitial…");
      const interstitial = await displayInterstitialAd();
      if (!active) return;
      setStatus(interstitial === "shown" ? "Ad complete" : "Ad unavailable — starting game");
      finishedRef.current = true;
      onFinished();
    })();
    return () => {
      active = false;
      cleanup?.();
    };
  }, [onFinished]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/95 p-4 backdrop-blur-sm">
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Advertisement
      </span>

      <div className="ad-stage flex w-full max-w-md flex-col items-center gap-4 rounded-lg p-4">
        <div ref={slotRef} className="flex min-h-[50px] w-full justify-center overflow-hidden" />
        <LoaderCircle className="size-6 animate-spin text-primary" aria-hidden />
        <p className="text-center text-xs text-muted-foreground" role="status" aria-live="polite">
          {status}
        </p>
        <div className="flex items-center gap-2 text-[0.65rem] text-muted-foreground">
          <ShieldCheck className="size-3.5 text-success" aria-hidden />
          Official Google test inventory
        </div>
      </div>
    </div>
  );
}
