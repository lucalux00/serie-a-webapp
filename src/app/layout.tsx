import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import ClientLayoutWrapper from "@/components/layout/ClientLayoutWrapper";
import ConsentScripts from "@/components/layout/ConsentScripts";

const gaId = process.env.NEXT_PUBLIC_GA_ID;
const analyticsEnabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true";
const cmpScriptSrc = process.env.NEXT_PUBLIC_CMP_SCRIPT_SRC;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://tatticaepronostici.it'),
  title: {
    default: 'Tattica & Pronostici',
    template: '%s | Tattica & Pronostici',
  },
  description: 'Analisi statistiche, calciomercato e dati sulle squadre di calcio: segui le competizioni e scopri i prossimi match.',
  keywords: ['calcio', 'Serie A', 'pronostici statistici', 'calciomercato', 'fantacalcio', 'classifiche calcio'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: '/',
    siteName: 'Tattica & Pronostici',
    title: 'Tattica & Pronostici',
    description: 'Analisi statistiche, calciomercato e dati sulle squadre di calcio.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tattica & Pronostici',
    description: 'Analisi statistiche, calciomercato e dati sulle squadre di calcio.',
  },
  other: {
    'ga-site-verification': 'HQDCGvQBBk35TIElVkih_D3N',
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pronostici",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="dark">
      <body
        className="antialiased bg-[#0F172A] text-[#F8FAFC]"
      >
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
        {cmpScriptSrc && <Script id="cmp-provider" src={cmpScriptSrc} strategy="beforeInteractive" />}
        <ConsentScripts analyticsEnabled={analyticsEnabled} gaId={gaId} />
      </body>
    </html>
  );
}
