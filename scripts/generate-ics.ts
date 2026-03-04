import { load } from "cheerio";
import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PLANS_DIR = join(ROOT, "public", "plans");
const OUTPUT_FILE = join(ROOT, "public", "calendar.ics");
const SEMESTER_END = "20260619T215959Z";
const SEMESTER_START = new Date("2026-02-23T00:00:00");

const WEEKDAY_MAP: Record<string, number> = {
  poniedzialek: 1,
  wtorek: 2,
  sroda: 3,
  czwartek: 4,
  piatek: 5,
};

const COURSE_TYPE_PATTERNS: Array<[RegExp, string]> = [
  [/^wyklad|^wykl\b/i, "WYKŁAD"],
  [/^cwiczenia|^cwien|^ćwiczenia/i, "ĆWICZENIA"],
  [/^laboratorium|^lab\b/i, "LABORATORIUM"],
  [/^konwersatorium/i, "KONWERSATORIUM"],
  [/^seminarium/i, "SEMINARIUM"],
  [/^lektorat/i, "LEKTORAT"],
];

const TIME_SLOTS: Array<[[number, number], [number, number]]> = [
  [[8, 0], [9, 30]],
  [[9, 45], [11, 15]],
  [[11, 30], [13, 0]],
  [[13, 15], [14, 45]],
  [[15, 0], [16, 30]],
  [[16, 45], [18, 15]],
  [[18, 30], [20, 0]],
];

const LECTURER_TITLE_RE = /(dr hab\.|dr\s|mgr inż\.|mgr\s|prof\. dr hab\.|prof\. UJ|prof\.)/;

interface CourseEvent {
  kierunek: string;
  stopien: string;
  rok: string;
  courseType: string;
  courseName: string;
  room: string;
  lecturer: string;
  weekday: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  specificDates: Date[] | null;
  biweekly: "even" | "odd" | null;
}

function normalizeToAscii(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0142/g, "l")
    .replace(/\s+/g, "");
}

function matchWeekday(text: string): number | null {
  const norm = normalizeToAscii(text);
  for (const [key, val] of Object.entries(WEEKDAY_MAP)) {
    if (norm.startsWith(key)) return val;
  }
  return null;
}

function matchCourseType(text: string): string | null {
  for (const [pattern, name] of COURSE_TYPE_PATTERNS) {
    if (pattern.test(text.trim())) return name;
  }
  return null;
}

function parseTimeStr(raw: string): [number, number] | null {
  const m = raw.match(/(\d{1,2})[:.h](\d{2})/);
  return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : null;
}

function parseTimeRange(text: string): [[number, number], [number, number]] | null {
  const m = text.match(/(\d{1,2}[:.]\d{2})\s*[-\u2013]\s*(\d{1,2}[:.]\d{2})/);
  if (!m) return null;
  const s = parseTimeStr(m[1]);
  const e = parseTimeStr(m[2]);
  return s && e ? [s, e] : null;
}

function extractSpecificDates(text: string): Date[] | null {
  const matches = [...text.matchAll(/\b(\d{1,2})\.(\d{2})\.(\d{4})?\b/g)].filter((m) => {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    return day >= 1 && day <= 31 && month >= 1 && month <= 12;
  });
  if (matches.length < 4) return null;
  return matches.map((m) =>
    new Date(parseInt(m[3] ?? "2026", 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10))
  );
}

function extractBiweekly(text: string): "even" | "odd" | null {
  const lower = text.toLowerCase();
  if (lower.includes("nieparzyste")) return "odd";
  if (lower.includes("parzyste")) return "even";
  return null;
}

function splitAtLecturerTitle(text: string): [string, string] {
  const match = LECTURER_TITLE_RE.exec(text);
  if (!match) return [text.trim(), ""];
  return [text.slice(0, match.index).trim(), text.slice(match.index).trim()];
}

function parseCellTextFormatA(
  text: string
): { courseType: string; room: string; courseName: string; lecturer: string } | null {
  const m = text.match(
    /^(KONWERSATORIUM|LABORATORIUM|WYKLAD|CWICZENIA|CWIEN|SEMINARIUM|LEKTORAT)[,.]?\s+(?:s\.\s*|sala\s+)?(\d+[.,]\d+)\s*/i
  );
  if (!m) return null;
  const courseType = matchCourseType(m[1]);
  if (!courseType) return null;
  const afterRoom = text.slice(m[0].length).replace(/^\s+/, "");
  const [rawName, lecturer] = splitAtLecturerTitle(afterRoom);
  const courseName = rawName
    .replace(/,?\s*\d{1,2}\.\d{2}\.?\s*/g, " ")
    .replace(/,?\s*gr\.\s*\d+\s*/gi, " ")
    .replace(/raz na dwa tygodnie\s*[-\u2013]?\s*(?:nie)?parzyste/gi, "")
    .replace(/\/+/g, "")
    .replace(/,?\s*w\s+godz\.\s*\d{1,2}[:.]\d{2}[-\u2013]\d{1,2}[:.]\d{2}/gi, "")
    .replace(/,?\s*w\s+godz:?\s*\d{1,2}[:.]\d{2}[-\u2013]\d{1,2}[:.]\d{2}/gi, "")
    .replace(/\d{1,2}:\d{2}[-\u2013]\d{1,2}:\d{2}/g, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+i\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\n.*/s, "")
    .trim();
  return { courseType, room: m[2].trim(), courseName, lecturer };
}

function parseCellTextFormatB(text: string): {
  courseType: string;
  room: string;
  courseName: string;
  lecturer: string;
  timeRange?: [[number, number], [number, number]];
} | null {
  const timeRange = parseTimeRange(text);
  const withoutTime = text.replace(/^\d{1,2}[:.]\d{2}\s*[-\u2013]\s*\d{1,2}[:.]\d{2}[,\s]*/, "");
  const withoutGroup = withoutTime
    .replace(/,?\s*gr\.\s*\d+[,\s]*/g, " ")
    .replace(/[a-zA-Z\u00C0-\u017E\s]*tygodnie\s*[-\u2013]?\s*\S*parzyste\S*/gi, "")
    .replace(/\/+/g, "")
    .trim();

  const mWithRoom = withoutGroup.match(/^(.+?)\s*[-\u2013]\s*([A-Za-z\u00C0-\u017E]+)\s*\(([^)]+)\)\s*(.*)?$/);
  if (mWithRoom) {
    const courseType = matchCourseType(mWithRoom[2]);
    if (courseType) {
      const [, lecturer] = splitAtLecturerTitle(mWithRoom[4] ?? "");
      return {
        courseType,
        room: mWithRoom[3].trim(),
        courseName: mWithRoom[1].trim(),
        lecturer: lecturer || (mWithRoom[4] ?? "").trim(),
        timeRange: timeRange ?? undefined,
      };
    }
  }

  const mNoRoom = withoutGroup.match(/^(.+?)\s*[-\u2013]\s*([A-Za-z\u00C0-\u017E]+)\s*$/);
  if (mNoRoom) {
    const courseType = matchCourseType(mNoRoom[2]);
    if (courseType) {
      return {
        courseType,
        room: "",
        courseName: mNoRoom[1].trim(),
        lecturer: "",
        timeRange: timeRange ?? undefined,
      };
    }
  }

  return null;
}

function parseCellText(raw: string): {
  courseType: string;
  room: string;
  courseName: string;
  lecturer: string;
  timeRange?: [[number, number], [number, number]];
} | null {
  const text = raw.replace(/\u00a0/g, " ").trim();
  if (!text || text.length < 5) return null;

  if (/^(KONWERSATORIUM|LABORATORIUM|WYKLAD|CWICZENIA|CWIEN|SEMINARIUM|LEKTORAT)[,.]?\s+(?:s\.\s*|sala\s+)/i.test(text)) {
    return parseCellTextFormatA(text);
  }

  if (/^\d{1,2}[:.]\d{2}\s*[-\u2013]/.test(text)) {
    return parseCellTextFormatB(text);
  }

  return null;
}

function extractTableHtml(jsonPath: string): string | null {
  const raw = JSON.parse(readFileSync(jsonPath, "utf-8"));
  for (const page of raw.pdf_info ?? []) {
    for (const block of page.para_blocks ?? []) {
      if (block.type === "table") {
        for (const sub of block.blocks ?? []) {
          for (const line of sub.lines ?? []) {
            for (const span of line.spans ?? []) {
              if (span.type === "table" && span.html) return span.html as string;
            }
          }
        }
      }
    }
  }
  return null;
}

function buildDayColumnMap($: ReturnType<typeof load>): number[] {
  const dayColumns: number[] = [];
  $("tr")
    .first()
    .find("th, td")
    .each((_, cell) => {
      const colspan = parseInt($(cell).attr("colspan") ?? "1", 10);
      const weekday = matchWeekday($(cell).text().trim());
      for (let i = 0; i < colspan; i++) {
        dayColumns.push(weekday ?? 0);
      }
    });
  return dayColumns;
}

function parseTableToEvents(html: string, kierunek: string, stopien: string, rok: string): CourseEvent[] {
  const $ = load(html);
  const dayColumns = buildDayColumnMap($);
  const events: CourseEvent[] = [];

  $("tr").each((rowIndex, row) => {
    if (rowIndex === 0) return;

    const slotIndex = rowIndex - 1;
    const timeSlot = TIME_SLOTS[slotIndex] ?? TIME_SLOTS[TIME_SLOTS.length - 1];
    let cellCol = 0;

    $(row)
      .find("th, td")
      .each((_, cell) => {
        const colspan = parseInt($(cell).attr("colspan") ?? "1", 10);
        const rowspan = parseInt($(cell).attr("rowspan") ?? "1", 10);

        if (cellCol === 0) {
          cellCol += colspan;
          return;
        }

        const cellText = $(cell).text().replace(/\u00a0/g, " ").trim();
        if (cellText) {
          const weekday = dayColumns[cellCol] ?? 0;
          if (weekday > 0) {
            const parsed = parseCellText(cellText);
            if (parsed) {
              const endSlotIndex = Math.min(slotIndex + rowspan - 1, TIME_SLOTS.length - 1);
              const [startH, startM] = parsed.timeRange?.[0] ?? timeSlot[0];
              const [endH, endM] = parsed.timeRange?.[1] ?? TIME_SLOTS[endSlotIndex][1];

              events.push({
                kierunek,
                stopien,
                rok,
                courseType: parsed.courseType,
                courseName: parsed.courseName,
                room: parsed.room,
                lecturer: parsed.lecturer,
                weekday,
                startHour: startH,
                startMinute: startM,
                endHour: endH,
                endMinute: endM,
                specificDates: extractSpecificDates(cellText),
                biweekly: extractBiweekly(cellText),
              });
            }
          }
        }

        cellCol += colspan;
      });
  });

  return events;
}

function getFirstOccurrence(weekday: number): Date {
  const date = new Date(SEMESTER_START);
  const startWeekday = date.getDay() === 0 ? 7 : date.getDay();
  let diff = weekday - startWeekday;
  if (diff < 0) diff += 7;
  date.setDate(date.getDate() + diff);
  return date;
}

function toIcsLocal(date: Date, hour: number, minute: number): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(hour).padStart(2, "0");
  const mi = String(minute).padStart(2, "0");
  return `${y}${mo}${d}T${h}${mi}00`;
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function buildVevent(
  uid: string,
  dtstamp: string,
  dtstart: string,
  dtend: string,
  summary: string,
  description: string,
  location: string,
  rrule?: string
): string {
  const lines = [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=Europe/Warsaw:${dtstart}`,
    `DTEND;TZID=Europe/Warsaw:${dtend}`,
  ];
  if (rrule) lines.push(rrule);
  lines.push(
    `SUMMARY:${escapeIcs(summary)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    `LOCATION:${escapeIcs(location)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT"
  );
  return lines.join("\r\n");
}

function eventToVevents(event: CourseEvent, dtstamp: string): string {
  const prefix = `[${event.kierunek} ${event.stopien} ${event.rok}]`;
  const summary = `${prefix} ${event.courseType} \u2013 ${event.courseName}`;
  const description = [
    `Kierunek: ${event.kierunek}`,
    `Stopie\u0144: ${event.stopien}`,
    `Rok studi\u00f3w: ${event.rok}`,
    `Rodzaj zaj\u0119\u0107: ${event.courseType}`,
    `Nazwa: ${event.courseName}`,
    `Sala: ${event.room}`,
    `Prowadz\u0105cy: ${event.lecturer}`,
  ].join("\\n");
  const location = `Sala ${event.room}`;

  if (event.specificDates && event.specificDates.length > 0) {
    return event.specificDates
      .map((date) => {
        const uid = `${randomUUID()}@uj.edu.pl`;
        const dtstart = toIcsLocal(date, event.startHour, event.startMinute);
        const dtend = toIcsLocal(date, event.endHour, event.endMinute);
        return buildVevent(uid, dtstamp, dtstart, dtend, summary, description, location);
      })
      .join("\r\n");
  }

  const uid = `${randomUUID()}@uj.edu.pl`;
  const firstDate = getFirstOccurrence(event.weekday);
  const dtstart = toIcsLocal(firstDate, event.startHour, event.startMinute);
  const dtend = toIcsLocal(firstDate, event.endHour, event.endMinute);
  const interval = event.biweekly ? 2 : 1;
  const rrule = `RRULE:FREQ=WEEKLY;INTERVAL=${interval};UNTIL=${SEMESTER_END}`;
  return buildVevent(uid, dtstamp, dtstart, dtend, summary, description, location, rrule);
}

function extractMetaFromFilename(filename: string): { kierunek: string; stopien: string; rok: string } {
  const base = filename.replace(".json", "");
  const parts = base.split(" ");
  return {
    kierunek: parts[0] ?? "UNKNOWN",
    stopien: parts[1] ?? "UNKNOWN",
    rok: parts[2] ?? "1",
  };
}

function processDirectory(dirPath: string): CourseEvent[] {
  if (!existsSync(dirPath)) return [];
  const files = readdirSync(dirPath).filter((f) => f.endsWith(".json"));
  const allEvents: CourseEvent[] = [];

  for (const filename of files) {
    const { kierunek, stopien, rok } = extractMetaFromFilename(filename);
    const html = extractTableHtml(join(dirPath, filename));
    if (!html) continue;
    const events = parseTableToEvents(html, kierunek, stopien, rok);
    allEvents.push(...events);
  }

  return allEvents;
}

function buildCalendar(vevents: string[]): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UJ ISI Kiosk//PL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Plan zaj\u0119\u0107 UJ ISI",
    "X-WR-TIMEZONE:Europe/Warsaw",
    ...vevents,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

function main(): void {
  const dtstamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  const winterEvents = processDirectory(join(PLANS_DIR, "winter"));
  const summerEvents = processDirectory(join(PLANS_DIR, "summer"));
  const allEvents = [...winterEvents, ...summerEvents];

  const vevents = allEvents.map((event) => eventToVevents(event, dtstamp));
  writeFileSync(OUTPUT_FILE, buildCalendar(vevents), "utf-8");

  console.log(
    `Generated calendar.ics with ${allEvents.length} events` +
      ` (winter: ${winterEvents.length}, summer: ${summerEvents.length})`
  );
}

main();
