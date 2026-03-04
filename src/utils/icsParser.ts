import ICAL from 'ical.js';
import type { CalendarEvent } from '../types';

function extractDescriptionField(description: string, key: string): string {
  const re = new RegExp(`${key}:\\s*([^\\n]+)`, 'i');
  return description.match(re)?.[1]?.trim() ?? '';
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
      return {
        id: event.uid || crypto.randomUUID(),
        summary: event.summary || 'Untitled Event',
        location: event.location || extractDescriptionField(rawDescription, 'Sala'),
        description: rawDescription,
        courseType: extractDescriptionField(rawDescription, 'Rodzaj zajęć'),
        lecturer: extractDescriptionField(rawDescription, 'Prowadzący'),
        start: event.startDate.toJSDate(),
        end: event.endDate.toJSDate(),
      };
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

const STORAGE_KEY = 'uj-kiosk-ics-events';

export function saveEventsToStorage(events: CalendarEvent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function loadEventsFromStorage(): CalendarEvent[] | null {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;

  try {
    const parsed = JSON.parse(data) as CalendarEvent[];
    return parsed.map((e) => ({
      ...e,
      courseType: e.courseType ?? '',
      lecturer: e.lecturer ?? '',
      start: new Date(e.start),
      end: new Date(e.end),
    }));
  } catch {
    return null;
  }
}
