import "server-only";

import { sql } from "@vercel/postgres";

export type StoredNews = {
  id: number;
  title: string;
  link: string;
  source: string;
  snippet: string | null;
  pub_date: string | Date;
};

export function parseNewsId(value: string | undefined) {
  if (!value || !/^\d{1,10}$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function safeExternalNewsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function getStoredNews(id: number): Promise<StoredNews | null> {
  const { rows } = await sql<StoredNews>`
    SELECT id, title, link, source, snippet, pub_date
    FROM news
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] ?? null;
}
