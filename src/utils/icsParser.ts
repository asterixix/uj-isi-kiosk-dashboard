import ICAL from 'ical.js';
import type { CalendarEvent } from '../types';

function extractDescriptionField(description: string, key: string): string {
  const re = new RegExp(`${key}:\\s*([^\\n]+)`, 'i');
  return description.match(re)?.[1]?.trim() ?? '';
}

function normalizeStudyDegreeToken(token: string | undefined): string {
  if (!token) return '';
  const t = token.toLowerCase();

  if (t === 'i' || t === 'ii') return token;
  if (t.startsWith('lic')) return 'I';
  if (t.startsWith('mgr') || t.startsWith('mag')) return 'II';

  return token;
}

function parseAcademicSummary(summary: string): {
  subject: string;
  program: string;
  studyDegree: string;
  studyYear: number | null;
  groupLabel: string;
} {
  const bracketMatch = summary.match(/^\[([^\]]+)\]\s*(.+)$/);
  const subjectWithGroup = bracketMatch?.[2]?.trim() || summary.trim();
  const metaRaw = bracketMatch?.[1]?.trim() || '';

  const tokens = metaRaw.split(/\s+/).filter(Boolean);
  const program = tokens[0] ?? '';
  const studyDegree = normalizeStudyDegreeToken(tokens[1]);
  const yearToken = tokens.find((token) => /^\d+$/.test(token));
  const studyYear = yearToken ? Number.parseInt(yearToken, 10) : null;

  const groupMatch = subjectWithGroup.match(/\bgr\.?\s*([A-Za-z0-9IVX]+)\b/i);
  const groupLabel = groupMatch?.[1]?.trim().toUpperCase() ?? '';

  const subject = subjectWithGroup.replace(/\s+gr\.?\s*[A-Za-z0-9IVX]+\s*$/i, '').trim();

  return {
    subject,
    program,
    studyDegree,
    studyYear,
    groupLabel,
  };
}

export function parseIcsEvents(icsText: string): CalendarEvent[] {
  const jcalData = ICAL.parse(icsText);
  const comp = new ICAL.Component(jcalData);

  const timezones = comp.getAllSubcomponents('vtimezone');
  timezones.forEach((tz: ICAL.Component) => {
    ICAL.TimezoneService.register(new ICAL.Timezone(tz));
  });

  const vevents = comp.getAllSubcomponents('vevent');

  return vevents
    .map((vevent: ICAL.Component) => {
      const event = new ICAL.Event(vevent);
      const rawDescription = event.description || '';
      const summary = event.summary || 'Untitled Event';
      const academicMeta = parseAcademicSummary(summary);

      return {
        id: event.uid || crypto.randomUUID(),
        summary,
        subject: academicMeta.subject,
        location: event.location || extractDescriptionField(rawDescription, 'Sala'),
        description: rawDescription,
        courseType:
          extractDescriptionField(rawDescription, 'Rodzaj') ||
          extractDescriptionField(rawDescription, 'Rodzaj zajęć'),
        lecturer: extractDescriptionField(rawDescription, 'Prowadzący'),
        program: academicMeta.program,
        studyDegree: academicMeta.studyDegree,
        studyYear: academicMeta.studyYear,
        groupLabel: academicMeta.groupLabel,
        start: event.startDate.toJSDate(),
        end: event.endDate.toJSDate(),
      };
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}
