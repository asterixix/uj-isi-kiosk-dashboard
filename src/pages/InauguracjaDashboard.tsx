import '../styles/theme.css';
import '../App.css';
import './Inauguracja.css';
import { TargiTimeWeatherWidget } from '../components/targi/TargiTimeWeatherWidget';
import { DeparturesPanel } from '../components/DeparturesPanel';
import { NewsTicker } from '../components/NewsTicker';
import { UJNewsTicker } from '../components/UJNewsTicker';
import { useStudentNews } from '../hooks/useStudentNews';
import { useUJNews } from '../hooks/useUJNews';
import { useRotation } from '../hooks/useRotation';
import { appConfig } from '../config/appConfig';
import { KOLO_FORM_URL, KOLO_SLIDES } from './inauguracjaData';

function KoloPanel() {
  const index = useRotation(KOLO_SLIDES.length, 10_000);
  const slide = KOLO_SLIDES[index];

  return (
    <div className="kolo-panel">
      <div className="panel-header kolo-header">
        <img src="/images/knzi.png" alt="" className="kolo-logo" />
        <div>
          <h2>Koło Naukowe Zarządzania Informacją UJ „ZaintrygowanI”</h2>
          <p className="kolo-sub">Działamy od 1987 roku. W 2025/2026 ponad 20 aktywnych studentów.</p>
        </div>
      </div>

      <div className="kolo-photos">
        {KOLO_SLIDES.map((s, i) => (
          <img
            key={s.img}
            src={s.img}
            alt={s.title}
            className={i === index ? 'kolo-photo is-active' : 'kolo-photo'}
            style={s.position ? { objectPosition: s.position } : undefined}
          />
        ))}
      </div>

      <div className="kolo-caption" key={index}>
        <h3>{slide.title}</h3>
        <p>{slide.text}</p>
      </div>
    </div>
  );
}

export function InauguracjaDashboard() {
  const { news, error: newsError } = useStudentNews();
  const { news: ujNews, error: ujNewsError } = useUJNews();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <NewsTicker news={news} error={newsError} />
      </header>

      <main className="dashboard-main">
        <div className="tile tile-time">
          <TargiTimeWeatherWidget
            qrUrl={KOLO_FORM_URL}
            qrLabel="Dołącz do Koła"
            qrCaption="Zeskanuj i zapisz się"
          />
        </div>

        <div className="tile tile-events">
          <KoloPanel />
        </div>

        {appConfig.stops.map((stop, i) => (
          <div key={stop.id} className={`tile tile-departures-${i}`}>
            <DeparturesPanel stopLabel={stop.label} stopIds={stop.stopIds} />
          </div>
        ))}
      </main>

      <footer className="dashboard-footer">
        <UJNewsTicker news={ujNews} error={ujNewsError} />
      </footer>
    </div>
  );
}
