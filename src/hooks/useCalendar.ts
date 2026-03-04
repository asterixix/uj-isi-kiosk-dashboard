import { useState, useCallback } from 'react';
import type { CalendarEvent } from '../types';
import { parseIcsEvents, saveEventsToStorage, loadEventsFromStorage } from '../utils/icsParser';

export function useCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>(() => loadEventsFromStorage() ?? []);
  const [hasFile, setHasFile] = useState(() => events.length > 0);

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
