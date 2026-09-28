import type { CSSProperties } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import '../styles/theme.css';
import './Inauguracja.css';
import { useRotation } from '../hooks/useRotation';
import {
  ALUMNI,
  CAREERS,
  KOLO_FORM_URL,
  MINDMAP_CENTER,
  MINDMAP_NODES,
  RESEARCH_TRENDS,
  STUDENT_PUBLICATIONS,
  THESIS_TOPICS,
} from './inauguracjaData';

const SLIDE_MS = 15_000;

const stagger = (i: number) => ({ '--i': i }) as CSSProperties;

function MindMap() {
  // Nodes sit on an ellipse around the centre, starting at 12 o'clock; coordinates are % of the slide body.
  const points = MINDMAP_NODES.map((_, i) => {
    const angle = -Math.PI / 2 + (i / MINDMAP_NODES.length) * 2 * Math.PI;
    return { x: 50 + 40 * Math.cos(angle), y: 50 + 40 * Math.sin(angle) };
  });

  return (
    <>
      <h1>Jeden kierunek, wiele dziedzin</h1>
      <div className="mindmap">
        <svg className="mindmap-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {points.map((p, i) => (
            <line key={i} x1="50" y1="50" x2={p.x} y2={p.y} style={stagger(i)} />
          ))}
        </svg>
        <div className="mindmap-center">{MINDMAP_CENTER}</div>
        {MINDMAP_NODES.map((n, i) => (
          <div
            key={n.label}
            className="mindmap-node"
            style={{ left: `${points[i].x}%`, top: `${points[i].y}%`, ...stagger(i) }}
          >
            <strong>{n.label}</strong>
            <span>{n.detail}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function Careers() {
  return (
    <>
      <h1>Co robisz po Zarządzaniu informacją?</h1>
      <div className="careers">
        {CAREERS.map((c, i) => (
          <div key={c.role} className="career" style={stagger(i)}>
            <strong>{c.role}</strong>
            <span>{c.benefit}</span>
          </div>
        ))}
      </div>
      <p className="slide-note">
        Rekrutacja 2025: 271 kandydatów na 100 miejsc. Studia I stopnia trwają 3 lata, II stopnia 2 lata.
      </p>
    </>
  );
}

function Trends() {
  return (
    <>
      <h1>Co badamy w ISI UJ w latach 2023-2026</h1>
      <div className="trends">
        {RESEARCH_TRENDS.map((t, i) => (
          <div key={t.topic} className="trend" style={stagger(i)}>
            <strong>{t.topic}</strong>
            <em>{t.title}</em>
            <span>{t.authors}</span>
          </div>
        ))}
      </div>
      <p className="slide-note">Pełne teksty w Repozytorium UJ: ruj.uj.edu.pl</p>
    </>
  );
}

function Alumni() {
  return (
    <>
      <h1>Studiowali tutaj. Dziś uczą.</h1>
      <div className="alumni">
        {ALUMNI.map((a, i) => (
          <div key={a.name} className="alumnus" style={stagger(i)}>
            <strong>{a.name}</strong>
            {a.role && <span>{a.role}</span>}
          </div>
        ))}
      </div>
      <p className="slide-note">Absolwenci informacji naukowej i bibliotekoznawstwa UJ. I wielu innych pracowników Instytutu.</p>
    </>
  );
}

function Students() {
  return (
    <>
      <h1>Studenci też prowadzą badania</h1>
      <div className="students">
        <div className="student-pubs">
          {STUDENT_PUBLICATIONS.map((p, i) => (
            <div key={p.title} className="student-pub" style={stagger(i)}>
              <em>{p.title}</em>
              <span>
                {p.author}, {p.where}
              </span>
            </div>
          ))}
        </div>
        <div className="thesis">
          <h2>Tematy prac dyplomowych 2025/2026</h2>
          <ul>
            {THESIS_TOPICS.map((t, i) => (
              <li key={t} style={stagger(i)}>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function JoinKolo() {
  return (
    <div className="join">
      <div>
        <h1>Chcesz działać już od pierwszego roku?</h1>
        <p>
          Koło Naukowe Zarządzania Informacją UJ „ZaintrygowanI”: warsztaty z AI, wykłady gości, Infokawka,
          wspólna nauka i planszówki. Działamy od 1987 roku.
        </p>
      </div>
      <div className="join-qr">
        <QRCodeSVG value={KOLO_FORM_URL} size={320} bgColor="#ffffff" fgColor="#00519E" level="M" />
        <span>Zeskanuj i zapisz się do Koła</span>
      </div>
    </div>
  );
}

const SLIDES = [MindMap, Careers, Trends, Alumni, Students, JoinKolo];

export function InauguracjaInfografika() {
  const index = useRotation(SLIDES.length, SLIDE_MS);
  const Slide = SLIDES[index];

  return (
    <div className="infografika">
      <section className="slide" key={index}>
        <Slide />
      </section>
      <footer className="infografika-footer">
        <img src="/images/isi.png" alt="Instytut Studiów Informacyjnych UJ" />
        <span>Instytut Studiów Informacyjnych, Wydział Zarządzania i Komunikacji Społecznej UJ</span>
        <div className="progress" key={index} style={{ animationDuration: `${SLIDE_MS}ms` }} />
      </footer>
    </div>
  );
}
