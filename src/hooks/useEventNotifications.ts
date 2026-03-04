import { useState, useEffect, useRef } from 'react';
import type { CalendarEvent } from '../types';
import { appConfig } from '../config/appConfig';

interface NotificationState {
  alertActive: boolean;
  upcomingAlerts: CalendarEvent[];
}

export function useEventNotifications(events: CalendarEvent[]): NotificationState {
  const [state, setState] = useState<NotificationState>({ alertActive: false, upcomingAlerts: [] });
  const notifiedWindowsRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.preload = 'auto';
  }, []);

  useEffect(() => {
    const check = () => {
      const now = Date.now();
      const threshold = now + appConfig.notifications.alertBeforeMinutes * 60 * 1000;

      const upcoming = events.filter((e) => {
        const startMs = e.start.getTime();
        return startMs > now && startMs <= threshold;
      });

      if (upcoming.length === 0) {
        setState({ alertActive: false, upcomingAlerts: [] });
        return;
      }

      const windowKey = upcoming.map((e) => e.id).sort().join('|');

      if (!notifiedWindowsRef.current.has(windowKey)) {
        notifiedWindowsRef.current.add(windowKey);
        audioRef.current?.play().catch(() => {});
        setState({ alertActive: true, upcomingAlerts: upcoming });
        setTimeout(() => setState((prev) => ({ ...prev, alertActive: false })), 15000);
      } else {
        setState((prev) => ({ ...prev, upcomingAlerts: upcoming }));
      }
    };

    check();
    const id = setInterval(check, appConfig.notifications.checkIntervalMs);
    return () => clearInterval(id);
  }, [events]);

  return state;
}
