"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getConsentSnapshot, parseConsent, subscribeToConsent } from "@/lib/consent";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

type AdBannerProps = {
  slotId?: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
};

const publisherId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const configuredSlotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT;

/**
 * A CLS-safe AdSense placement. It deliberately renders nothing until a
 * publisher ID is configured, so preview and development environments stay ad-free.
 */
export default function AdBanner({ slotId, format = "auto" }: AdBannerProps) {
  const activeSlotId = slotId || configuredSlotId;
  const advertisingAllowed = parseConsent(useSyncExternalStore(subscribeToConsent, getConsentSnapshot, () => null))?.advertising === true;

  useEffect(() => {
    if (!publisherId || !activeSlotId || !advertisingAllowed) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ad blockers and unavailable ad inventory must not affect the page.
    }
  }, [activeSlotId, advertisingAllowed]);

  if (!publisherId || !activeSlotId || !advertisingAllowed) return null;

  return (
    <aside
      aria-label="Pubblicità"
      className="mx-auto w-full max-w-5xl px-4"
      style={{ minHeight: format === "horizontal" ? 90 : 250 }}
    >
      <ins
        className="adsbygoogle block h-full w-full overflow-hidden"
        data-ad-client={publisherId}
        data-ad-slot={activeSlotId}
        data-ad-format={format}
        data-full-width-responsive={format === "auto" ? "true" : undefined}
      />
    </aside>
  );
}
