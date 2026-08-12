import { useEffect, useRef } from "react";
import { adConfig, displayBannerAd } from "@/services/adService";

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

/**
 * Responsive banner slot. Renders a real GPT slot when ads are enabled and an
 * ad unit is configured; otherwise a clearly labelled reserved space.
 */
export function BannerAd({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !adConfig.enabled) return;
    let cleanup: (() => void) | null = null;
    let active = true;
    void displayBannerAd(el).then((fn) => {
      if (!active) fn();
      else cleanup = fn;
    });
    return () => {
      active = false;
      cleanup?.();
    };
  }, []);

  if (!adConfig.enabled) {
    return <Placeholder label="Advertisement" className={"h-16 sm:h-20 " + (className ?? "")} />;
  }

  return (
    <div className={"w-full " + (className ?? "")}>
      <span className="mb-1 block text-center text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Advertisement
      </span>
      <div ref={ref} className="flex min-h-[50px] w-full justify-center" />
    </div>
  );
}

/** Larger in-flow slot used between page sections. */
export function InterstitialAdSlot({ className }: { className?: string }) {
  return <BannerAd className={className} />;
}

/** Shown after a run ends, above the score summary. */
export function PostGameAd({ className }: { className?: string }) {
  return <BannerAd className={className} />;
}
