import { useState, useEffect } from 'react';
import type { Departure } from '../types';
import { appConfig } from '../config/appConfig';

export function useDepartures(stopIds: readonly string[]) {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchDepartures = async () => {
      try {
        const params = new URLSearchParams();
        stopIds.forEach((id) => params.append('stopId', id));
        const res = await fetch(`/api/departures?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Departure[] = await res.json();
        if (!cancelled) {
          setDepartures(data.slice(0, appConfig.departures.maxDepartures));
          setError(false);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchDepartures();
    const id = setInterval(fetchDepartures, appConfig.departures.refreshIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [stopIds.join(',')]);

  return { departures, loading, error };
}
