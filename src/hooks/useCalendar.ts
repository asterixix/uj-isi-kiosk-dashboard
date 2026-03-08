import { useState, useCallback, useEffect } from 'react';
import type { CalendarEvent } from '../types';
import { parseIcsEvents } from '../utils/icsParser';

const ICS_URL = '/calendar.ics';
const REFRESH_INTERVAL_MS = 60 * 60 * 1000;

export function useCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendarReady, setCalendarReady] = useState(false);
  const [calendarError, setCalendarError] = useState(false);

  const loadFromUrl = useCallback(async () => {
    try {
      const res = await fetch(ICS_URL, { cache: 'no-store' });
      if (!res.ok) {
        setCalendarError(true);
        return;
      }

      const text = await res.text();
      const parsed = parseIcsEvents(text);

      setEvents(parsed);
      setCalendarReady(true);
      setCalendarError(false);
    } catch (_) {
      setCalendarError(true);
    }
  }, []);

  useEffect(() => {
    loadFromUrl();
    const id = setInterval(loadFromUrl, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [loadFromUrl]);

  const upcomingEvents = events.filter((e) => e.end.getTime() > Date.now());

  return { events: upcomingEvents, calendarReady, calendarError };
}
