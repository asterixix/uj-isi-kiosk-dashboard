import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";
import { fetchUJNewsFromSource } from "../_uj-news-scraper.js";

const KV_KEY = "uj-news";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const news = await fetchUJNewsFromSource();
    if (news.length > 0) {
      await kv.set(KV_KEY, news);
    }
    return res.status(200).json({ refreshed: news.length, timestamp: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
