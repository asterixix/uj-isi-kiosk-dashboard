import { useState } from 'react';
import '../styles/theme.css';
import './Inauguracja.css';
import { TASKS } from './inauguracjaData';

export function InauguracjaZadania() {
  const [activeId, setActiveId] = useState(TASKS[0].id);
  const [revealed, setRevealed] = useState<Record<string, number>>({});

  const task = TASKS.find((t) => t.id === activeId) ?? TASKS[0];
  const shown = revealed[task.id] ?? 0;

  return (
    <div className="zadania-page">
      <header className="zadania-header">
        <div className="zadania-logos">
          <img src="/images/isi.png" alt="Instytut Studiów Informacyjnych UJ" />
          <img src="/images/knzi.png" alt="Koło Naukowe ZaintrygowanI" />
        </div>
        <div>
          <h1>Zostań infobrokerem na 5 minut</h1>
          <p>Wybierz zadanie, szukaj w prawdziwym internecie, a odpowiedź pokaż osobie przy stoisku.</p>
        </div>
        <a className="zadania-google" href="https://www.google.com" target="_blank" rel="noreferrer">
          Otwórz Google w nowej karcie
        </a>
      </header>

      <main className="zadania-main">
        <nav className="zadania-nav" aria-label="Zadania">
          {TASKS.map((t, i) => (
            <button
              key={t.id}
              type="button"
              className={t.id === task.id ? 'zadania-tab is-active' : 'zadania-tab'}
              aria-current={t.id === task.id}
              onClick={() => setActiveId(t.id)}
            >
              <span className="zadania-tab-num">{i + 1}</span>
              <span className="zadania-tab-title">{t.title}</span>
              <span className="zadania-tab-time">{t.time}</span>
            </button>
          ))}
        </nav>

        <article className="zadania-task" key={task.id}>
          <h2>{task.title}</h2>
          <p className="zadania-story">{task.story}</p>

          <h3>Twoje zadanie</h3>
          <ol className="zadania-asks">
            {task.asks.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ol>

          <section className="zadania-hints" aria-live="polite">
            {task.hints.slice(0, shown).map((h, i) => (
              <p key={h} className="zadania-hint">
                <strong>Podpowiedź {i + 1}.</strong> {h}
              </p>
            ))}
            {shown < task.hints.length && (
              <button
                type="button"
                className="zadania-hint-btn"
                onClick={() => setRevealed({ ...revealed, [task.id]: shown + 1 })}
              >
                Pokaż podpowiedź ({shown + 1} z {task.hints.length})
              </button>
            )}
          </section>
        </article>
      </main>
    </div>
  );
}

export function InauguracjaSciagawka() {
  return (
    <div className="sciagawka">
      <h1>Ściągawka dla obsługi stoiska: odpowiedzi do zadań</h1>
      {TASKS.map((t, i) => (
        <section key={t.id}>
          <h2>
            {i + 1}. {t.title}
          </h2>
          <ol>
            {t.asks.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ol>
          <ul>
            {t.answers.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
