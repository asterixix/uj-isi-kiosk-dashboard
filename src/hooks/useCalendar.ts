import { useState, useCallback, useEffect } from 'react';
import type { CalendarEvent } from '../types';
import { parseIcsEvents, saveEventsToStorage, loadEventsFromStorage } from '../utils/icsParser';

const ICS_URL = '/calendar.ics';
const REFRESH_INTERVAL_MS = 60 * 60 * 1000;

export function useCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>(() => loadEventsFromStorage() ?? []);
  const [hasFile, setHasFile] = useState(() => (loadEventsFromStorage() ?? []).length > 0);

  const loadFromUrl = useCallback(async () => {
    try {
      const res = await fetch(ICS_URL, { cache: 'no-store' });
      if (!res.ok) return;
      const text = await res.text();
      const parsed = parseIcsEvents(text);
      if (parsed.length === 0) return;
      setEvents(parsed);
      saveEventsToStorage(parsed);
      setHasFile(true);
    } catch (_) {
      void 0;
    }
  }, []);

  useEffect(() => {
    loadFromUrl();
    const id = setInterval(loadFromUrl, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [loadFromUrl]);

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      try {
        const parsed = parseIcsEvents(text);
        setEvents(parsed);
        saveEventsToStorage(parsed);
        setHasFile(true);
      } catch (err) {
        console.error('Failed to parse ICS file:', err);
      }
    };
    reader.readAsText(file);
  }, []);

  const upcomingEvents = events.filter((e) => e.end.getTime() > Date.now());

  return { events: upcomingEvents, hasFile, handleFileUpload };
}
