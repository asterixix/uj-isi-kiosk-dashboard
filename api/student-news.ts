import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';

interface NewsItem {
  id: string;
  text: string;
}

interface CachedNews {
  timestamp: number;
  data: NewsItem[];
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const NEWS_URL = 'https://isi.uj.edu.pl/studenci/news/komunikaty';
let newsCache: CachedNews | null = null;

const DATE_PATTERN = /\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/g;
const AUTHOR_PREFIX = /^(Autor|Opublikowano|Tagi):\s*/i;

function normalizeText(raw: string): string {
  return raw
    .replace(DATE_PATTERN, '')
    .replace(AUTHOR_PREFIX, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function scrapeNews(): Promise<NewsItem[]> {
  const res = await fetch(NEWS_URL, {
    headers: { 'User-Agent': 'UJ-ISI-Kiosk/1.0', Accept: 'text/html' },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  const items: NewsItem[] = [];
  $('.article__content p').each((_i, el) => {
    const text = normalizeText($(el).text());
    if (text.length > 10) {
      items.push({ id: `news-${items.length}`, text });
    }
  });

  return items;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (newsCache && Date.now() - newsCache.timestamp < CACHE_TTL_MS) {
    res.status(200).json(newsCache.data);
    return;
  }

  try {
    const data = await scrapeNews();
    const result = data.length > 0
      ? data
      : [{ id: 'fallback', text: 'Komunikaty niedostępne — sprawdź isi.uj.edu.pl' }];

    newsCache = { timestamp: Date.now(), data: result };
    res.status(200).json(result);
  } catch {
    const fallback = [{ id: 'fallback', text: 'Komunikaty niedostępne — sprawdź isi.uj.edu.pl' }];
    res.status(200).json(fallback);
  }
}
