const NEWS_URL = "https://isi.uj.edu.pl/studenci/news/komunikaty";
const SEPARATOR_RE = /^-{3,}$/;

export interface NewsItem {
  id: string;
  text: string;
}

export function extractNewsFromHtml(html: string): NewsItem[] {
  const contentMatch = html.match(
    /<div[^>]*class="[^"]*article__content[^"]*"[^>]*>([\s\S]*?)<\/div>/
  );
  if (!contentMatch) return [];

  const paragraphMatches = [...contentMatch[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];

  return paragraphMatches
    .map((m) =>
      m[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(
      (text) =>
        text.length > 20 &&
        !SEPARATOR_RE.test(text) &&
        !text.startsWith("Szanowni")
    )
    .map((text, index) => ({ id: `news-${index}`, text }));
}

export async function fetchNewsFromSource(): Promise<NewsItem[]> {
  const response = await fetch(NEWS_URL, {
    headers: { "User-Agent": "UJ-ISI-Kiosk/1.0" },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  return extractNewsFromHtml(html);
}
