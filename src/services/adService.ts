/**
 * Ad service — Google Publisher Tag (GPT) integration.
 *
 * All ad unit paths come from environment variables. While
 * VITE_ADS_TEST_MODE=true the service uses Google's official public sample /
 * test ad units and enables GPT's test/debug friendly settings, so no real
 * production inventory is requested during development.
 *
 * No ad is ever auto-clicked, hidden, or disguised as game UI.
 */

const env = import.meta.env as Record<string, string | undefined>;

const bool = (v: string | undefined, fallback = false) =>
  v === undefined ? fallback : v === "true";

/** Google's officially published sample ad units, used only in test mode. */
const GOOGLE_TEST_UNITS = {
  interstitial: "/6355419/Travel/Europe/France/Paris",
  banner: "/6355419/Travel/Europe/France/Paris",
};

export const adConfig = {
  enabled: bool(env["VITE_ADS_ENABLED"], false),
  testMode: bool(env["VITE_ADS_TEST_MODE"], true),
  provider: env["VITE_ADS_PROVIDER"] ?? "gpt",
  publisherId: env["VITE_ADS_PUBLISHER_ID"] ?? "",
  interstitialUnit: env["VITE_ADS_INTERSTITIAL_UNIT"] ?? "",
  bannerUnit: env["VITE_ADS_BANNER_UNIT"] ?? "",
  /** Show an interstitial roughly once every N game starts. */
  interstitialFrequency: Number(env["VITE_INTERSTITIAL_FREQUENCY"] ?? 1) || 1,
  /** AdMob rewarded unit — mobile SDK only, unused on the web build. */
  rewardedUnit: env["VITE_ADS_REWARDED_UNIT"] ?? "",
  /** Seconds the pre-game ad stays on screen before Continue unlocks. */
  interstitialSeconds: Number(env["VITE_ADS_INTERSTITIAL_SECONDS"] ?? 5) || 5,
  /** Give up waiting for a creative after this many ms and start the game. */
  loadTimeoutMs: 6000,
};

export const interstitialUnitPath = () =>
  adConfig.testMode ? GOOGLE_TEST_UNITS.interstitial : adConfig.interstitialUnit;

export const bannerUnitPath = () =>
  adConfig.testMode ? GOOGLE_TEST_UNITS.banner : adConfig.bannerUnit;

/** True when we have everything needed to legitimately request an ad. */
export const isAdReady = () => {
  if (!adConfig.enabled || adConfig.provider !== "gpt") return false;
  if (!interstitialUnitPath() && !bannerUnitPath()) return false;
  if (typeof window === "undefined") return false;
  return scriptState === "ready";
};

type GoogleTag = any;

declare global {
  interface Window {
    googletag?: GoogleTag;
  }
}

let scriptState: "idle" | "loading" | "ready" | "failed" = "idle";
let initPromise: Promise<boolean> | null = null;

function cmd(fn: () => void) {
  const gt = window.googletag;
  if (!gt) return;
  gt.cmd = gt.cmd || [];
  gt.cmd.push(fn);
}

/** Loads the GPT library and enables services. Safe to call repeatedly. */
export function initializeAds(): Promise<boolean> {
  if (initPromise) return initPromise;
  if (typeof window === "undefined") return Promise.resolve(false);
  if (!adConfig.enabled || adConfig.provider !== "gpt") {
    scriptState = "failed";
    return Promise.resolve(false);
  }

  initPromise = new Promise<boolean>((resolve) => {
    scriptState = "loading";
    window.googletag = window.googletag || { cmd: [] };

    const finish = () => {
      cmd(() => {
        const gt = window.googletag;
        try {
          // No single-request mode: slots defined later (e.g. under the
          // Play button) each fire their own ad request and can fill.


          gt.pubads().collapseEmptyDivs(true);
          if (adConfig.testMode) {
            // Non-personalised requests while testing.
            gt.pubads().setPrivacySettings({ nonPersonalizedAds: true });
          }
          gt.enableServices();
          scriptState = "ready";
          resolve(true);
        } catch {
          scriptState = "failed";
          resolve(false);
        }
      });
    };

    const existing = document.querySelector<HTMLScriptElement>("script[data-gpt]");
    if (existing) {
      finish();
      return;
    }

    const s = document.createElement("script");
    s.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
    s.async = true;
    s.crossOrigin = "anonymous";
    s.dataset["gpt"] = "true";
    s.onload = finish;
    s.onerror = () => {
      scriptState = "failed";
      resolve(false);
    };
    document.head.appendChild(s);
  });

  return initPromise;
}

/* ------------------------------------------------------------------ */
/* Banner                                                              */
/* ------------------------------------------------------------------ */

let bannerSeq = 0;

/**
 * Defines and displays a responsive banner in an existing container element.
 * Returns a cleanup function that destroys the slot.
 */
export async function displayBannerAd(container: HTMLElement): Promise<() => void> {
  const ok = await initializeAds();
  const unit = bannerUnitPath();
  if (!ok || !unit) return () => {};

  const divId = `gpt-banner-${++bannerSeq}`;
  const div = document.createElement("div");
  div.id = divId;
  container.appendChild(div);

  let slot: any = null;
  cmd(() => {
    const gt = window.googletag;
    slot = gt
      .defineSlot(unit, [[320, 50], [336, 280], [728, 90], [970, 90]], divId)
      ?.addService(gt.pubads());
    if (!slot) return;
    slot.defineSizeMapping(
      gt
        .sizeMapping()
        .addSize([1024, 0], [[970, 90], [728, 90]])
        .addSize([768, 0], [[728, 90], [320, 50]])
        .addSize([0, 0], [[320, 50]])
        .build(),
    );
    gt.display(divId);
  });

  return () => {
    cmd(() => {
      if (slot) window.googletag.destroySlots([slot]);
    });
    div.remove();
  };
}

/* ------------------------------------------------------------------ */
/* Interstitial                                                        */
/* ------------------------------------------------------------------ */

export type InterstitialResult = "shown" | "unavailable";

/**
 * Requests a GPT web interstitial and resolves once it has been shown and
 * dismissed, or as soon as we know none is available. Never rejects and
 * never blocks longer than the configured timeout before the creative
 * renders, so gameplay is never permanently blocked.
 */
export function displayInterstitialAd(): Promise<InterstitialResult> {
  if (typeof window === "undefined") return Promise.resolve("unavailable");

  return initializeAds().then((ok) => {
    const unit = interstitialUnitPath();
    if (!ok || !unit) return "unavailable" as const;

    return new Promise<InterstitialResult>((resolve) => {
      let settled = false;
      let rendered = false;
      const done = (r: InterstitialResult) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(loadTimer);
        window.clearTimeout(showTimer);
        cmd(() => {
          const gt = window.googletag;
          gt.pubads().removeEventListener("slotRenderEnded", onRenderEnded);
          gt.pubads().removeEventListener("slotVisibilityChanged", onVisibility);
          if (slot) gt.destroySlots([slot]);
        });
        resolve(r);
      };

      const loadTimer = window.setTimeout(
        () => !rendered && done("unavailable"),
        adConfig.loadTimeoutMs,
      );
      // Hard safety cap: never trap the player behind an ad surface.
      const showTimer = window.setTimeout(() => done("shown"), 60000);

      let slot: any = null;

      const onRenderEnded = (event: any) => {
        if (!slot || event.slot !== slot) return;
        if (event.isEmpty) {
          done("unavailable");
          return;
        }
        rendered = true;
        window.clearTimeout(loadTimer);
      };

      const onVisibility = (event: any) => {
        if (!slot || event.slot !== slot) return;
        // The user dismissed the interstitial (its own close control).
        if (rendered && event.inViewPercentage === 0) done("shown");
      };

      cmd(() => {
        const gt = window.googletag;
        try {
          slot = gt.defineOutOfPageSlot(unit, gt.enums.OutOfPageFormat.INTERSTITIAL);
          if (!slot) {
            done("unavailable");
            return;
          }
          slot.addService(gt.pubads());
          gt.pubads().addEventListener("slotRenderEnded", onRenderEnded);
          gt.pubads().addEventListener("slotVisibilityChanged", onVisibility);
          gt.display(slot);
        } catch {
          done("unavailable");
        }
      });
    });
  });
}

/* ------------------------------------------------------------------ */
/* Frequency capping                                                   */
/* ------------------------------------------------------------------ */

const COUNT_KEY = "opplay:ad:starts";

/** Decides whether this game start is allowed to request an interstitial. */
export function shouldShowInterstitial(): boolean {
  if (!adConfig.enabled) return false;
  const every = Math.max(1, adConfig.interstitialFrequency);
  let n = 0;
  try {
    n = Number(localStorage.getItem(COUNT_KEY) ?? "0") || 0;
    localStorage.setItem(COUNT_KEY, String(n + 1));
  } catch {
    return true;
  }
  return n % every === 0; // first launch shows, then every Nth start
}
