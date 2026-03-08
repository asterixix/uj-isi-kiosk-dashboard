import * as cheerio from "cheerio";

const UJ_CALENDAR_URL = "https://www.uj.edu.pl/kalendarz";

export interface UJNewsItem {
  id: string;
  title: string;
  date: string;
  url: string;
}

function parseIcsDate(value: string | null): Date | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function formatDateRange(start: Date, end: Date | null): string {
  if (!end || end.getTime() === start.getTime()) {
    return formatDate(start);
  }
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function isUpcomingOrOngoing(start: Date, end: Date | null): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventEnd = end ?? start;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + 60);
  cutoff.setHours(23, 59, 59, 999);

  return eventEnd >= today && start <= cutoff;
}

function decodeParam(value: string | null): string {
  if (!value) return "";
  try {
    return decodeURIComponent(value.replace(/\+/g, " ")).trim();
  } catch {
    return value.replace(/\+/g, " ").trim();
  }
}

export function extractUJNewsFromHtml(html: string): UJNewsItem[] {
  const $ = cheerio.load(html);

  const seen = new Set<string>();
  const items: UJNewsItem[] = [];

  $('a[href*="gen/event.ics"]').each((index, element) => {
    const href = $(element).attr("href");
    if (!href) return;

    const fullHref = href.startsWith("http") ? href : `https://www.uj.edu.pl${href}`;

    let url: URL;
    try {
      url = new URL(fullHref);
    } catch {
      return;
    }

    const params = url.searchParams;
    const summaryRaw = params.get("summary");
    const startRaw = params.get("start");
    const endRaw = params.get("end");

    const start = parseIcsDate(startRaw);
    const end = parseIcsDate(endRaw ?? startRaw);

    if (!summaryRaw || !start) return;
    if (!isUpcomingOrOngoing(start, end)) return;

    const title = decodeParam(summaryRaw);
    const dateLabel = formatDateRange(start, end);

    const key = `${title}__${dateLabel}`;
    if (seen.has(key)) return;
    seen.add(key);

    items.push({
      id: `uj-event-${index}`,
      title,
      date: dateLabel,
      url: "https://www.uj.edu.pl/kalendarz",
    });
  });

  return items;
}

export async function fetchUJNewsFromSource(): Promise<UJNewsItem[]> {
  const response = await fetch(UJ_CALENDAR_URL, {
    headers: { "User-Agent": "UJ-ISI-Kiosk/1.0" },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  return extractUJNewsFromHtml(html);
}
