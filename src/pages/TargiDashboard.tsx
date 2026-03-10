import '../styles/theme.css';
import '../App.css';
import './TargiDashboard.css';
import { TargiTimeWeatherWidget } from '../components/targi/TargiTimeWeatherWidget';
import { OpenDaySchedulePanel } from '../components/targi/OpenDaySchedulePanel';
import { DeparturesPanel } from '../components/DeparturesPanel';
import { TargiNewsTicker } from '../components/targi/TargiNewsTicker';
import { TargiUJNewsTicker } from '../components/targi/TargiUJNewsTicker';

const TARGI_STOPS = {
  aghUr: {
    label: 'AGH / UR',
    stopIds: ['agh-ur'] as const,
  },
  bagatela: {
    label: 'Teatr Bagatela',
    stopIds: ['teatr-bagatela'] as const,
  },
};

export function TargiDashboard() {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <TargiNewsTicker />
      </header>

      <main className="dashboard-main">
        <div className="tile tile-time">
          <TargiTimeWeatherWidget />
        </div>

        <div className="tile tile-events">
          <OpenDaySchedulePanel />
        </div>

        <div className="tile tile-departures-0">
          <DeparturesPanel
            stopLabel={TARGI_STOPS.aghUr.label}
            stopIds={TARGI_STOPS.aghUr.stopIds}
          />
        </div>

        <div className="tile tile-departures-1">
          <DeparturesPanel
            stopLabel={TARGI_STOPS.bagatela.label}
            stopIds={TARGI_STOPS.bagatela.stopIds}
          />
        </div>
      </main>

      <footer className="dashboard-footer">
        <TargiUJNewsTicker />
      </footer>
    </div>
  );
}
