import React, { useRef } from 'react';
import type { CalendarEvent } from '../types';
import { appConfig } from '../config/appConfig';
import './UpcomingEventsPanel.css';

interface Props {
  events: CalendarEvent[];
  alertActive: boolean;
  upcomingAlerts: CalendarEvent[];
  hasFile: boolean;
  onFileUpload: (file: File) => void;
}

const formatTime = (d: Date): string => {
  return d.toLocaleTimeString('pl-PL', {
    timeZone: appConfig.location.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const formatDate = (d: Date): string => {
  return d.toLocaleDateString('pl-PL', {
    timeZone: appConfig.location.timezone,
    day: 'numeric',
    month: 'short',
  });
};

const isToday = (d: Date): boolean => {
  const now = new Date();
  const opts: Intl.DateTimeFormatOptions = { timeZone: appConfig.location.timezone, dateStyle: 'short' };
  const dStr = new Intl.DateTimeFormat('pl-PL', opts).format(d);
  const nowStr = new Intl.DateTimeFormat('pl-PL', opts).format(now);
  return dStr === nowStr;
};

export const UpcomingEventsPanel: React.FC<Props> = ({
  events,
  alertActive,
  upcomingAlerts,
  hasFile,
  onFileUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const now = new Date();
  const sortedEvents = [...events]
    .filter((e) => e.end > now)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 8);

  return (
    <div className={`upcoming-events-panel tile ${alertActive ? 'alert-active' : ''}`}>
      <div className="panel-header">
        <h2>📅 Nadchodzące wydarzenia</h2>
        <button className="upload-btn" onClick={handleUploadClick} title="Załaduj plik .ics">
          ⬆
        </button>
        <input
          type="file"
          accept=".ics"
          ref={fileInputRef}
          onChange={handleFileChange}
          hidden
        />
      </div>

      {upcomingAlerts.length > 0 && (
        <div className="alert-banner">
          ⚠️ {upcomingAlerts.length} wydarzeń za chwilę!
        </div>
      )}

      {!hasFile ? (
        <div className="empty-state" onClick={handleUploadClick}>
          <div className="upload-icon">⬆</div>
          <p>Upuść plik .ics lub kliknij ⬆</p>
        </div>
      ) : sortedEvents.length === 0 ? (
        <div className="empty-state">
          <p>Brak nadchodzących wydarzeń</p>
        </div>
      ) : (
        <div className="events-list">
          {sortedEvents.map((event) => (
            <div key={event.id} className="event-row">
              <div className="event-time-col">
                <span className="event-time">{formatTime(event.start)}</span>
                {!isToday(event.start) && (
                  <span className="event-date">{formatDate(event.start)}</span>
                )}
              </div>
              <div className="event-info">
                <div className="event-summary">{event.summary}</div>
                {event.location && (
                  <div className="event-location">📍 {event.location}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
