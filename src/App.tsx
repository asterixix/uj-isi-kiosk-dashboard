import './styles/theme.css';
import './App.css';
import { TimeWeatherWidget } from './components/TimeWeatherWidget';
import { UpcomingEventsPanel } from './components/UpcomingEventsPanel';
import { DeparturesPanel } from './components/DeparturesPanel';
import { NewsTicker } from './components/NewsTicker';
import { useCalendar } from './hooks/useCalendar';
import { useStudentNews } from './hooks/useStudentNews';
import { useEventNotifications } from './hooks/useEventNotifications';
import { appConfig } from './config/appConfig';

function App() {
  const { events, hasFile, handleFileUpload } = useCalendar();
  const { news, error: newsError } = useStudentNews();
  const { alertActive, upcomingAlerts } = useEventNotifications(events);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <NewsTicker news={news} error={newsError} />
      </header>

      <main className="dashboard-main">
        <div className="tile tile-time">
          <TimeWeatherWidget />
        </div>

        <div className="tile tile-events">
          <UpcomingEventsPanel
            events={events}
            alertActive={alertActive}
            upcomingAlerts={upcomingAlerts}
            hasFile={hasFile}
            onFileUpload={handleFileUpload}
          />
        </div>

        <div className="tile tile-departures">
          <DeparturesPanel
            stopLabel={appConfig.stops[0].label}
            stopIds={appConfig.stops[0].stopIds}
          />
        </div>

        <div className="tile tile-departures">
          <DeparturesPanel
            stopLabel={appConfig.stops[1].label}
            stopIds={appConfig.stops[1].stopIds}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
