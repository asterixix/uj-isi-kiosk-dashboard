import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";
import { fetchNewsFromSource, type NewsItem } from "./_news-scraper.js";

const KV_KEY = "student-news";

async function readFromKv(): Promise<NewsItem[] | null> {
  try {
    return await kv.get<NewsItem[]>(KV_KEY);
  } catch {
    return null;
  }
}

async function writeToKv(items: NewsItem[]): Promise<void> {
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
    const news = await fetchNewsFromSource();
    if (news.length > 0) await writeToKv(news);
    return res.status(200).json(news);
  } catch {
    return res.status(200).json([]);
  }
}
