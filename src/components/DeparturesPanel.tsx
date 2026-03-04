import { useState, useEffect } from 'react';
import type { Departure } from '../types';
import { appConfig } from '../config/appConfig';
import './DeparturesPanel.css';

interface Props {
  stopLabel: string;
  stopIds: readonly string[];
}

export function DeparturesPanel({ stopLabel, stopIds }: Props) {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDepartures = async () => {
      try {
        const params = new URLSearchParams();
        stopIds.forEach((id) => params.append('stopId', id));
        const res = await fetch(`/api/departures?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Departure[] = await res.json();
        setDepartures(data.slice(0, appConfig.departures.maxDepartures));
        setError(false);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartures();
    const id = setInterval(fetchDepartures, appConfig.departures.refreshIntervalMs);
    return () => clearInterval(id);
  }, [stopIds]);

  return (
    <div className="departures-panel">
      <div className="panel-header">
        <h2>🚌 {stopLabel}</h2>
      </div>

      {loading && <div className="departures-loading">Loading departures…</div>}
      {error && <div className="departures-error">⚠ Connection error</div>}

      <div className="departures-list">
        {departures.map((dep, i) => (
          <div key={`${dep.routeShortName}-${dep.expectedDeparture}-${i}`} className="departure-row">
            <div className={`departure-line ${dep.vehicleType === 'tram' ? 'line-tram' : 'line-bus'}`}>
              {dep.routeShortName}
            </div>
            <div className="departure-direction">{dep.headsign}</div>
            <div className={`departure-time ${dep.delaySeconds > 60 ? 'departure-delayed' : ''}`}>
              {dep.minutesAway <= 0 ? '>>>' : `${dep.minutesAway} min`}
            </div>
            {dep.delaySeconds > 60 && (
              <span className="departure-delay">+{Math.round(dep.delaySeconds / 60)}</span>
            )}
          </div>
        ))}

        {!loading && !error && departures.length === 0 && (
          <div className="departures-empty">Brak odjazdów</div>
        )}
      </div>
    </div>
  );
}
