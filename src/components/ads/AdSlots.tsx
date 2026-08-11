import { useEffect, useState } from "react";
import { adConfig } from "@/lib/ads";

function Placeholder({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={
        "flex w-full items-center justify-center rounded-xl border border-dashed border-border bg-surface/60 text-[0.65rem] font-medium uppercase tracking-[0.3em] text-muted-foreground " +
        (className ?? "")
      }
      role="complementary"
      aria-label="Advertisement placeholder"
    >
      {label}
    </div>
  );
}

/** Responsive banner slot. Renders a labelled placeholder until a provider is configured. */
export function BannerAd({ className }: { className?: string }) {
  if (!adConfig.enableAds) {
    return <Placeholder label="Advertisement" className={"h-16 sm:h-20 " + (className ?? "")} />;
  }
  return <Placeholder label="Advertisement" className={"h-16 sm:h-20 " + (className ?? "")} />;
}

/** Larger in-flow slot used between page sections. */
export function InterstitialAd({ className }: { className?: string }) {
  return <Placeholder label="Advertisement" className={"h-24 sm:h-28 " + (className ?? "")} />;
}

/** Shown after a run ends, above the score summary. */
export function PostGameAd({ className }: { className?: string }) {
  return <Placeholder label="Advertisement" className={"h-20 " + (className ?? "")} />;
}

/**
 * Pre-game interstitial placeholder with a short countdown, shown before a run
 * starts. No real ad is served and nothing is auto-clicked.
 */
export function PreGameAd({ onContinue }: { onContinue: () => void }) {
  const [left, setLeft] = useState(adConfig.preGameCountdown);

  useEffect(() => {
    if (left <= 0) return;
    const t = window.setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left]);

  return (
    <div className="glass flex w-full flex-col items-center gap-5 rounded-2xl p-6 text-center sm:p-10">
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
        Advertisement
      </span>
      <div className="flex h-40 w-full items-center justify-center rounded-xl border border-dashed border-border bg-surface/60 px-4 text-sm text-muted-foreground sm:h-48">
        Ad slot reserved. No advertising provider is configured yet.
      </div>
      <p className="text-xs text-muted-foreground">
        Your game starts right after this slot.
      </p>
      <button
        type="button"
        onClick={onContinue}
        disabled={left > 0}
        className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
      >
        {left > 0 ? `Continue in ${left}s` : "Continue to Game"}
      </button>
    </div>
  );
}
