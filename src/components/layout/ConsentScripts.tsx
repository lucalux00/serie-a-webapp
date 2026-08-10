"use client";

import { useSyncExternalStore } from "react";
import Script from "next/script";
import { getConsentSnapshot, parseConsent, subscribeToConsent } from "@/lib/consent";

type ConsentScriptsProps = {
  analyticsEnabled: boolean;
  gaId?: string;
};

export default function ConsentScripts({ analyticsEnabled, gaId }: ConsentScriptsProps) {
  const consent = parseConsent(useSyncExternalStore(subscribeToConsent, getConsentSnapshot, () => null));

  const allowAnalytics = analyticsEnabled && Boolean(gaId) && consent?.analytics === true;

  return (
    <>
      {allowAnalytics ? (
        <>
          <Script id="google-analytics-loader" src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}', { anonymize_ip: true });`}</Script>
        </>
      ) : null}
    </>
  );
}
