export const CONSENT_STORAGE_KEY = "tattica_cookie_consent_v1";
export const CONSENT_CHANGE_EVENT = "tattica:consent-change";
export const OPEN_CONSENT_EVENT = "tattica:open-consent";

export type ConsentPreferences = {
  version: 1;
  analytics: boolean;
  advertising: boolean;
  updatedAt: string;
};

export function parseConsent(raw: string | null): ConsentPreferences | null {
  try {
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentPreferences>;
    if (parsed.version !== 1) return null;
    return {
      version: 1,
      analytics: parsed.analytics === true,
      advertising: parsed.advertising === true,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return null;
  }
}

export function getConsentSnapshot() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(CONSENT_STORAGE_KEY);
}

export function readConsent() {
  return parseConsent(getConsentSnapshot());
}

export function subscribeToConsent(callback: () => void) {
  const notify = () => callback();
  window.addEventListener(CONSENT_CHANGE_EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, notify);
    window.removeEventListener("storage", notify);
  };
}

export function saveConsent(preferences: Pick<ConsentPreferences, "analytics" | "advertising">) {
  const consent: ConsentPreferences = {
    version: 1,
    analytics: preferences.analytics,
    advertising: preferences.advertising,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent<ConsentPreferences>(CONSENT_CHANGE_EVENT, { detail: consent }));
  return consent;
}
