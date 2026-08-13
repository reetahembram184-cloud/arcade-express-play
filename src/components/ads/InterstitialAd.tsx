import { useEffect, useRef, useState } from "react";
import { adConfig, displayBannerAd, displayInterstitialAd } from "@/services/adService";

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
  const [seconds, setSeconds] = useState(adConfig.interstitialSeconds);

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
    // Also request the native web interstitial (fills only on real inventory).
    void displayInterstitialAd();
    return () => {
      active = false;
      cleanup?.();
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSeconds((s: number) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinished();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/95 p-4 backdrop-blur-sm">
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
        Advertisement
      </span>

      <div className="glass flex w-full max-w-md flex-col items-center gap-3 rounded-2xl p-4">
        <div ref={slotRef} className="flex min-h-[100px] w-full justify-center" />
        <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
          Your game starts right after this ad.
        </p>
      </div>

      <button
        type="button"
        onClick={finish}
        disabled={seconds > 0}
        className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
      >
        {seconds > 0 ? `Continue in ${seconds}s` : "Continue to game"}
      </button>
    </div>
  );
}
