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

interface CohortDef {
  program: 'EPI' | 'ZI';
  studyDegree: 'I' | 'II';
  studyYear: number;
}

const COHORTS: CohortDef[] = [
  { program: 'EPI', studyDegree: 'I', studyYear: 1 },
  { program: 'EPI', studyDegree: 'I', studyYear: 2 },
  { program: 'EPI', studyDegree: 'I', studyYear: 3 },
  { program: 'EPI', studyDegree: 'II', studyYear: 1 },
  { program: 'EPI', studyDegree: 'II', studyYear: 2 },
  { program: 'ZI', studyDegree: 'I', studyYear: 1 },
  { program: 'ZI', studyDegree: 'I', studyYear: 2 },
  { program: 'ZI', studyDegree: 'I', studyYear: 3 },
  { program: 'ZI', studyDegree: 'II', studyYear: 1 },
  { program: 'ZI', studyDegree: 'II', studyYear: 2 },
];

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

const toDateKey = (d: Date): string =>
  d.toLocaleDateString('pl-PL', {
    timeZone: appConfig.location.timezone,
    dateStyle: 'short',
  });

const isToday = (d: Date): boolean => {
  return toDateKey(d) === toDateKey(new Date());
};

const isTomorrow = (d: Date): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return toDateKey(d) === toDateKey(tomorrow);
};

const formatDayLabel = (d: Date): string => {
  if (isToday(d)) return 'Dziś';
  if (isTomorrow(d)) return 'Jutro';
  return formatDate(d);
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

const cohortTitle = (cohort: CohortDef): string =>
  `${cohort.program} | ${cohort.studyDegree} stopień | Rok ${cohort.studyYear}`;

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
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const todayEvents = sortedEvents.filter((e) => isToday(e.start));
  const hasEventsToday = todayEvents.length > 0;

  const highlightedEventIds = new Set(upcomingAlerts.map((event) => event.id));

  const grouped = new Map<string, CalendarEvent[]>();
  sortedEvents.forEach((event) => {
    if (event.program !== 'EPI' && event.program !== 'ZI') return;

    const key = `${event.program}|${event.studyDegree}|${event.studyYear ?? 'na'}`;
    const current = grouped.get(key) ?? [];
    current.push(event);
    grouped.set(key, current);
  });

  const nextEventPerCohort = COHORTS.map((cohort) => {
    const key = `${cohort.program}|${cohort.studyDegree}|${cohort.studyYear}`;
    return {
      cohort,
      event: grouped.get(key)?.[0] ?? null,
    };
  });

  return (
    <div className={`upcoming-events-panel tile ${alertActive ? 'alert-active' : ''}`}>
      <div className="panel-header">
        <h2>📅 Najbliższe zajęcia grup</h2>
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
      ) : !hasEventsToday && calendarReady ? (
        <div className="empty-state">
          <p>Dziś nie ma żadnych zajęć</p>
        </div>
      ) : (
        <div className="events-content">
          <div className="events-group-list">
            {nextEventPerCohort.map(({ cohort, event }) => {
              return (
                <section
                  key={`${cohort.program}-${cohort.studyDegree}-${cohort.studyYear}`}
                  className="events-group"
                >
                  <header className="events-group-header">
                    <h3>{cohortTitle(cohort)}</h3>
                    <span className="events-group-next">{event ? formatRelative(event.start) : 'brak zajęć'}</span>
                  </header>

                  <div className="events-list">
                    {event ? (
                      <article
                        key={event.id}
                        className={`event-row ${highlightedEventIds.has(event.id) ? 'event-row-alert' : ''}`}
                      >
                        <div className="event-time-col">
                          <span className="event-day">{formatDayLabel(event.start)}</span>
                          <span className="event-time">{formatTime(event.start)}</span>
                          <span className="event-time-end">-{formatTime(event.end)}</span>
                        </div>

                        <div className="event-info">
                          <div className="event-summary">{event.subject || event.summary}</div>
                          <div className="event-meta">
                            {event.groupLabel && <span className="event-group">gr. {event.groupLabel}</span>}
                            {event.courseType && <span className="event-tag">{event.courseType}</span>}
                            {event.location && <span className="event-location">📍 {event.location}</span>}
                            <span className="event-relative">{formatRelative(event.start)}</span>
                          </div>
                        </div>
                      </article>
                    ) : (
                      <article className="event-row event-row-empty">
                        <div className="event-info">
                          <div className="event-summary">Brak nadchodzących zajęć dla tej grupy</div>
                        </div>
                      </article>
                    )}
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
