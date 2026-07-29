"use client";

const STORAGE_KEY = "bg_attribution_v1";

export type Attribution = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  referrer: string;
  landingPath: string;
};

const empty: Attribution = { utmSource: "", utmMedium: "", utmCampaign: "", referrer: "", landingPath: "" };

/** Captures first-touch UTM/referrer info once per browser and persists it across the visit. */
export function captureAttribution() {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(STORAGE_KEY)) return; // first touch already recorded

    const params = new URLSearchParams(window.location.search);
    const attribution: Attribution = {
      utmSource: params.get("utm_source") ?? "",
      utmMedium: params.get("utm_medium") ?? "",
      utmCampaign: params.get("utm_campaign") ?? "",
      referrer: document.referrer ?? "",
      landingPath: window.location.pathname + window.location.search,
    };

    const hasAnySignal = attribution.utmSource || attribution.utmMedium || attribution.utmCampaign || attribution.referrer;
    if (hasAnySignal) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
    }
  } catch {
    // localStorage unavailable (private mode, etc.) — attribution is best-effort only.
  }
}

export function readAttribution(): Attribution {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
}
