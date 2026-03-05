import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";
import { fetchUJNewsFromSource, type UJNewsItem } from "./_uj-news-scraper.js";

const KV_KEY = "uj-news";

async function readFromKv(): Promise<UJNewsItem[] | null> {
  try {
    return await kv.get<UJNewsItem[]>(KV_KEY);
  } catch {
    return null;
  }
}

async function writeToKv(items: UJNewsItem[]): Promise<void> {
  try {
    await kv.set(KV_KEY, items);
  } catch {
    return;
  }
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");

  const cached = await readFromKv();
  if (cached && cached.length > 0) {
    return res.status(200).json(cached);
  }

  try {
    const news = await fetchUJNewsFromSource();
    if (news.length > 0) await writeToKv(news);
    return res.status(200).json(news);
  } catch {
    return res.status(200).json([]);
  }
}
