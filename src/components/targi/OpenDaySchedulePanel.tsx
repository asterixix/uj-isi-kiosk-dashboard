import { useState, useEffect } from 'react';
import './OpenDaySchedulePanel.css';

interface ScheduleEntry {
  time: string;
  title: string;
  detail?: string;
}

interface Room {
  id: string;
  label: string;
  entries: ScheduleEntry[];
}

const SCHEDULE: Room[] = [
  {
    id: 'aula-duza-a',
    label: 'Aula Duża A',
    entries: [
      { time: '09:00', title: 'Prezentacja Działu Rekrutacji na Studia' },
      { time: '09:30', title: 'OFICJALNE ROZPOCZĘCIE — Przywitanie gości przez JM Rektora' },
      {
        time: '09:45',
        title: 'WYKŁAD OTWARTY: „Fizyka w Gwiezdnych Wojnach"',
        detail: 'dr Witold Zawadzki',
      },
      {
        time: '10:45',
        title: 'WYKŁAD OTWARTY: „Dlaczego się nie rozumiemy? O komunikacji międzykulturowej bez mitów"',
        detail: 'mgr Joanna Nachman, doktorantka',
      },
      {
        time: '11:45',
        title: 'WYKŁAD OTWARTY: „Czy wojna nigdy się nie zmienia? Ewolucja konfliktów zbrojnych w erze AI"',
        detail: 'dr hab. Marcin Marcinko',
      },
      { time: '12:45', title: 'Prezentacja — Wydział Lekarski' },
    ],
  },
  {
    id: 'aula-duza-b',
    label: 'Aula Duża B',
    entries: [
      { time: '09:00', title: 'Wydział Zarządzania i Komunikacji Społecznej' },
      { time: '09:30', title: 'Wydział Lekarski' },
      { time: '10:00', title: 'Samorząd Studentów — „Co poza zajęciami?"' },
      { time: '10:30', title: 'Wydział Filologiczny' },
      { time: '11:00', title: 'Wydział Chemii' },
      { time: '11:30', title: 'Wydział Biologii' },
      { time: '12:00', title: 'Prezentacja Działu Rekrutacji na Studia' },
      { time: '12:30', title: 'Wydział Fizyki, Astronomii i Informatyki Stosowanej' },
      { time: '13:00', title: 'Wydział Prawa i Administracji' },
      { time: '13:30', title: 'Wydział Filozoficzny' },
    ],
  },
  {
    id: 'aula-srednia-a',
    label: 'Aula Średnia A',
    entries: [
      { time: '09:00', title: 'Wydział Biochemii, Biofizyki i Biotechnologii' },
      { time: '09:30', title: 'Wydział Matematyki i Informatyki' },
      { time: '10:00', title: 'Wydział Studiów Międzynarodowych i Politycznych' },
      { time: '10:30', title: 'Wydział Prawa i Administracji' },
      { time: '11:00', title: 'Wydział Historyczny' },
      { time: '11:30', title: 'Wydział Geografii i Geologii' },
      { time: '12:00', title: 'Wydział Nauk o Zdrowiu' },
      { time: '12:30', title: 'Wydział Farmaceutyczny' },
      { time: '13:00', title: 'Wydział Zarządzania i Komunikacji Społecznej' },
    ],
  },
  {
    id: 'aula-srednia-b',
    label: 'Aula Średnia B',
    entries: [
      { time: '09:00', title: 'Wydział Fizyki, Astronomii i Informatyki Stosowanej' },
      { time: '09:30', title: 'Wydział Nauk o Zdrowiu' },
      { time: '10:00', title: 'Wydział Filozoficzny' },
      { time: '10:30', title: 'Wydział Farmaceutyczny' },
      { time: '11:00', title: 'Wydział Polonistyki' },
      { time: '11:30', title: 'Wydział Biochemii, Biofizyki i Biotechnologii' },
      { time: '12:00', title: 'Wydział Matematyki i Informatyki' },
      { time: '12:30', title: 'Wydział Studiów Międzynarodowych i Politycznych' },
      { time: '13:00', title: 'Wydział Historyczny' },
      { time: '13:30', title: 'Wydział Filologiczny' },
    ],
  },
  {
    id: 'aula-mala',
    label: 'Aula Mała',
    entries: [
      { time: '10:30', title: 'Welcome to the JU (presentation in English)', detail: '20 minut' },
      { time: '11:00', title: 'Międzywydziałowe Studia Matematyczno-Przyrodnicze' },
      { time: '11:30', title: 'Międzywydziałowe Indywidualne Studia Humanistyczne' },
      { time: '12:00', title: 'Una Europa Joint Bachelor in Sustainability (BASUS) — międzynarodowy kierunek studiów wspólnych' },
    ],
  },
];

const CYCLE_INTERVAL_MS = 10_000;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function getEntryStatus(entry: ScheduleEntry, nextEntry: ScheduleEntry | undefined): 'past' | 'current' | 'upcoming' {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const startMins = timeToMinutes(entry.time);
  const endMins = nextEntry ? timeToMinutes(nextEntry.time) : startMins + 60;

  if (nowMins >= endMins) return 'past';
  if (nowMins >= startMins) return 'current';
  return 'upcoming';
}

export function OpenDaySchedulePanel() {
  const [activeRoom, setActiveRoom] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setActiveRoom((prev) => (prev + 1) % SCHEDULE.length);
    }, CYCLE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused]);

  const room = SCHEDULE[activeRoom];

  return (
    <div className="open-day-panel">
      <div className="open-day-header">
        <h2>🎓 Program Dzień Otwarty 2026</h2>
      </div>

      <div
        className="open-day-tabs"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {SCHEDULE.map((r, i) => (
          <button
            key={r.id}
            className={`open-day-tab ${i === activeRoom ? 'active' : ''}`}
            onClick={() => { setActiveRoom(i); setPaused(true); }}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="open-day-schedule">
        {room.entries.map((entry, i) => {
          const status = getEntryStatus(entry, room.entries[i + 1]);
          return (
            <div
              key={`${room.id}-${entry.time}`}
              className={`schedule-entry schedule-entry--${status}`}
            >
              <span className="schedule-time">{entry.time}</span>
              <div className="schedule-content">
                <span className="schedule-title">{entry.title}</span>
                {entry.detail && <span className="schedule-detail">{entry.detail}</span>}
              </div>
              {status === 'current' && <span className="schedule-now-badge">TERAZ</span>}
            </div>
          );
        })}
      </div>

      <div className="open-day-cycle-indicator">
        {SCHEDULE.map((_, i) => (
          <span
            key={i}
            className={`cycle-dot ${i === activeRoom ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
