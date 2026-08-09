"use client";

import { useSyncExternalStore } from "react";
import Script from "next/script";
import { getConsentSnapshot, parseConsent, subscribeToConsent } from "@/lib/consent";

type ConsentScriptsProps = {
  adsenseClient?: string;
  analyticsEnabled: boolean;
  gaId?: string;
};

export default function ConsentScripts({ adsenseClient, analyticsEnabled, gaId }: ConsentScriptsProps) {
  const consent = parseConsent(useSyncExternalStore(subscribeToConsent, getConsentSnapshot, () => null));

  const allowAnalytics = analyticsEnabled && Boolean(gaId) && consent?.analytics === true;
  const allowAdvertising = Boolean(adsenseClient) && consent?.advertising === true;

  return (
    <>
      {allowAdvertising ? (
        <Script id="adsense-loader" async strategy="afterInteractive" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`} crossOrigin="anonymous" />
      ) : null}
      {allowAnalytics ? (
        <>
          <Script id="google-analytics-loader" src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}', { anonymize_ip: true });`}</Script>
        </>
      ) : null}
    </>
  );
}
