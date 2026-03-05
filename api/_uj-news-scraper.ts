const UJ_NEWS_URL = "https://www.uj.edu.pl/wiadomosci";
const DATE_RE = /^(\d{2})\.(\d{2})\.(\d{4})$/;

export interface UJNewsItem {
  id: string;
  title: string;
  date: string;
  url: string;
}

function parseDdMmYyyy(dateStr: string): Date | null {
  const match = dateStr.trim().match(DATE_RE);
  if (!match) return null;
  return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
}

function isWithinLastDays(dateStr: string, days: number): boolean {
  const parsed = parseDdMmYyyy(dateStr);
  if (!parsed) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return parsed >= cutoff;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractUJNewsFromHtml(html: string): UJNewsItem[] {
  const articlePattern = /<div[^>]*class="[^"]*post-excerpt__text-container[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
  const titlePattern = /<h3[^>]*class="[^"]*post-excerpt__title[^"]*"[^>]*>\s*<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i;
  const datePattern = /<div[^>]*class="[^"]*post-excerpt__sub-title[^"]*"[^>]*>([\s\S]*?)<\/div>/i;

  const items: UJNewsItem[] = [];
  let match: RegExpExecArray | null;

  while ((match = articlePattern.exec(html)) !== null) {
    const block = match[1];

    const titleMatch = block.match(titlePattern);
    const dateMatch = block.match(datePattern);

    if (!titleMatch || !dateMatch) continue;

    const url = titleMatch[1].trim();
    const rawTitle = titleMatch[2].replace(/<[^>]+>/g, "");
    const title = decodeHtmlEntities(rawTitle);
    const dateText = dateMatch[1].replace(/<[^>]+>/g, "").trim();

    if (!isWithinLastDays(dateText, 5)) continue;

    const fullUrl = url.startsWith("http") ? url : `https://www.uj.edu.pl${url}`;

    items.push({
      id: `uj-news-${items.length}`,
      title,
      date: dateText,
      url: fullUrl,
    });
  }

  return items;
}

export async function fetchUJNewsFromSource(): Promise<UJNewsItem[]> {
  const response = await fetch(UJ_NEWS_URL, {
    headers: { "User-Agent": "UJ-ISI-Kiosk/1.0" },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  return extractUJNewsFromHtml(html);
}
