import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://*.googlesyndication.com https://*.google.com https://*.doubleclick.net https://www.googletagmanager.com https://widgets.scoreaxis.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.googlesyndication.com https://*.google.com https://*.doubleclick.net https://logo.clearbit.com https://ui-avatars.com https://api.dicebear.com https://crests.football-data.org https://upload.wikimedia.org https://placehold.co",
  "font-src 'self' data:",
  `connect-src 'self'${isDevelopment ? " ws:" : ""} https://*.google-analytics.com https://*.googlesyndication.com https://*.google.com https://*.doubleclick.net https://widgets.scoreaxis.com`,
  "frame-src 'self' https://*.googlesyndication.com https://*.google.com https://*.doubleclick.net https://widgets.scoreaxis.com",
  "media-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [{ source: "/privacy", destination: "/privacy-policy", permanent: true }];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self), browsing-topics=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'logo.clearbit.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'crests.football-data.org' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ]
  }
};

export default nextConfig;
