import type { CalendarEvent } from '../types';
import { appConfig } from '../config/appConfig';
import './UpcomingEventsPanel.css';

interface Props {
  events: CalendarEvent[];
  alertActive: boolean;
  upcomingAlerts: CalendarEvent[];
  calendarReady: boolean;
  calendarError: boolean;
}

const formatTime = (d: Date): string =>
  d.toLocaleTimeString('pl-PL', {
    timeZone: appConfig.location.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

const formatDate = (d: Date): string =>
  d.toLocaleDateString('pl-PL', {
    timeZone: appConfig.location.timezone,
    day: 'numeric',
    month: 'short',
  });

const isToday = (d: Date): boolean => {
  const opts: Intl.DateTimeFormatOptions = { timeZone: appConfig.location.timezone, dateStyle: 'short' };
  return (
    new Intl.DateTimeFormat('pl-PL', opts).format(d) ===
    new Intl.DateTimeFormat('pl-PL', opts).format(new Date())
  );
};

const formatRelative = (date: Date): string => {
  const deltaMs = date.getTime() - Date.now();
  const minutes = Math.max(0, Math.round(deltaMs / 60000));

  if (minutes < 60) return `za ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (remainder === 0) return `za ${hours} h`;
  return `za ${hours} h ${remainder} min`;
};

const groupTitle = (event: CalendarEvent): string => {
  const parts = [event.program, event.studyDegree, event.studyYear ? `Rok ${event.studyYear}` : '']
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(' | ') : 'Pozostałe grupy';
};

export function UpcomingEventsPanel({
  events,
  alertActive,
  upcomingAlerts,
  calendarReady,
  calendarError,
}: Props) {
  const now = new Date();

  const sortedEvents = events
    .filter((e) => e.end > now)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, appConfig.departures.maxDepartures * 2);

  const highlightedEventIds = new Set(upcomingAlerts.map((event) => event.id));

  const grouped = new Map<string, CalendarEvent[]>();
  sortedEvents.forEach((event) => {
    const key = `${event.program}|${event.studyDegree}|${event.studyYear ?? 'na'}`;
    const current = grouped.get(key) ?? [];
    current.push(event);
    grouped.set(key, current);
  });

  const orderedGroups = [...grouped.values()].sort(
    (a, b) => a[0].start.getTime() - b[0].start.getTime(),
  );

  const nextEvent = sortedEvents[0];

  return (
    <div className={`upcoming-events-panel tile ${alertActive ? 'alert-active' : ''}`}>
      <div className="panel-header">
        <h2>📅 Najbliższe zajęcia</h2>
      </div>

      {upcomingAlerts.length > 0 && (
        <div className="alert-banner">⚠️ {upcomingAlerts.length} zajęć rozpoczyna się wkrótce</div>
      )}

      {!calendarReady && !calendarError ? (
        <div className="empty-state">
          <p>Ładowanie kalendarza z public/calendar.ics...</p>
        </div>
      ) : calendarError ? (
        <div className="empty-state">
          <p>Nie udało się odczytać public/calendar.ics</p>
        </div>
      ) : sortedEvents.length === 0 ? (
        <div className="empty-state">
          <p>Brak nadchodzących wydarzeń</p>
        </div>
      ) : (
        <div className="events-content">
          {nextEvent && (
            <div className="next-event-highlight">
              <div className="next-event-label">Najbliżej</div>
              <div className="next-event-main">{groupTitle(nextEvent)}</div>
              <div className="next-event-meta">
                {nextEvent.subject} • {formatTime(nextEvent.start)}-{formatTime(nextEvent.end)} ({formatRelative(nextEvent.start)})
              </div>
            </div>
          )}

          <div className="events-group-list">
            {orderedGroups.map((groupEvents) => {
              const leadEvent = groupEvents[0];

              return (
                <section
                  key={`${leadEvent.program}-${leadEvent.studyDegree}-${leadEvent.studyYear ?? 'na'}`}
                  className="events-group"
                >
                  <header className="events-group-header">
                    <h3>{groupTitle(leadEvent)}</h3>
                    <span className="events-group-next">{formatRelative(leadEvent.start)}</span>
                  </header>

                  <div className="events-list">
                    {groupEvents.slice(0, 4).map((event) => (
                      <article
                        key={event.id}
                        className={`event-row ${highlightedEventIds.has(event.id) ? 'event-row-alert' : ''}`}
                      >
                        <div className="event-time-col">
                          <span className="event-time">{formatTime(event.start)}</span>
                          <span className="event-time-end">-{formatTime(event.end)}</span>
                          {!isToday(event.start) && <span className="event-date">{formatDate(event.start)}</span>}
                        </div>

                        <div className="event-info">
                          <div className="event-summary">{event.subject || event.summary}</div>
                          <div className="event-meta">
                            {event.groupLabel && <span className="event-group">gr. {event.groupLabel}</span>}
                            {event.courseType && <span className="event-tag">{event.courseType}</span>}
                            {event.location && <span className="event-location">📍 {event.location}</span>}
                            {event.lecturer && <span className="event-lecturer">👤 {event.lecturer}</span>}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
