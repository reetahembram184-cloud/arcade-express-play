/**
 * Advertisement configuration.
 *
 * No real ad provider is wired up yet — the app renders clearly labelled
 * placeholder slots. To enable a real provider later, set the environment
 * variables below and implement the provider script inside AdSlot.
 *
 * Required env (client-safe, publishable values only — never secret keys):
 *   VITE_AD_PROVIDER          e.g. "adsense"
 *   VITE_AD_BANNER_UNIT       banner ad unit id
 *   VITE_AD_INTERSTITIAL_UNIT interstitial ad unit id
 *   VITE_ENABLE_ADS           "true" to enable
 */
const env = import.meta.env as Record<string, string | undefined>;

export const adConfig = {
  adProvider: env["VITE_AD_PROVIDER"] ?? "placeholder",
  bannerAdUnit: env["VITE_AD_BANNER_UNIT"] ?? "",
  interstitialAdUnit: env["VITE_AD_INTERSTITIAL_UNIT"] ?? "",
  enableAds: env["VITE_ENABLE_ADS"] === "true",
  /** Seconds the pre-game placeholder counts down before "Continue" unlocks. */
  preGameCountdown: 4,
};

export const isRealProviderConfigured = () =>
  adConfig.enableAds && adConfig.adProvider !== "placeholder";
