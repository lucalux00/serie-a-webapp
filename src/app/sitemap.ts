import type { MetadataRoute } from 'next';
import { ALL_TEAMS } from '@/data/teams';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://webapp-two-nu-71.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = ['', '/mercato', '/pronostici', '/classifiche', '/fantacalcio', '/notizie', '/privacy', '/privacy-policy', '/terms', '/contacts'];

  return [
    ...pages.map((path) => ({ url: `${siteUrl}${path}`, lastModified: now, changeFrequency: 'daily' as const, priority: path === '' ? 1 : 0.8 })),
    ...ALL_TEAMS.map((team) => ({ url: `${siteUrl}/squadra/${team.id}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 })),
  ];
}
