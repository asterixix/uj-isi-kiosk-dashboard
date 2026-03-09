import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFile } from "fs/promises";
import { join } from "path";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const filePath = join(process.cwd(), "public", "calendar.ics");
    const ics = await readFile(filePath, "utf-8");

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return res.status(200).send(ics);
  } catch {
    return res.status(500).json({ error: "Unable to read calendar.ics" });
  }
}

