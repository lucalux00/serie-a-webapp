"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

type AdBannerProps = {
  slotId: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
};

const publisherId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

/**
 * A CLS-safe AdSense placement. It deliberately renders nothing until a
 * publisher ID is configured, so preview and development environments stay ad-free.
 */
export default function AdBanner({ slotId, format = "auto" }: AdBannerProps) {
  useEffect(() => {
    if (!publisherId) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ad blockers and unavailable ad inventory must not affect the page.
    }
  }, []);

  if (!publisherId) return null;

  return (
    <aside
      aria-label="Pubblicità"
      className="mx-auto w-full max-w-5xl px-4"
      style={{ minHeight: format === "horizontal" ? 90 : 250 }}
    >
      <Script
        id="adsense-loader"
        async
        strategy="afterInteractive"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
        crossOrigin="anonymous"
      />
      <ins
        className="adsbygoogle block h-full w-full overflow-hidden"
        data-ad-client={publisherId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={format === "auto" ? "true" : undefined}
      />
    </aside>
  );
}
