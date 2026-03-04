import type { VercelRequest, VercelResponse } from '@vercel/node';

type VehicleType = 'tram' | 'bus';

interface Departure {
  routeShortName: string;
  headsign: string;
  plannedDeparture: string;
  expectedDeparture: string;
  delaySeconds: number;
  vehicleType: VehicleType;
  minutesAway: number;
}

interface TTSSPassage {
  actualRelativeTime: number;
  actualTime: string;
  direction: string;
  patternText: string;
  plannedTime: string;
  relativeTime: number;
  status: string;
  vehicleId: string;
}

interface TTSSResponse {
  actual: TTSSPassage[];
  old: TTSSPassage[];
}

interface CachedDepartures {
  timestamp: number;
  data: Departure[];
}

const CACHE_TTL_MS = 15_000;
const TTSS_BASE = 'https://ttss.mpk.krakow.pl/internetservice/services/passageInfo/stopPassages/stop';
const cache = new Map<string, CachedDepartures>();

function getVehicleType(routeShortName: string): VehicleType {
  const num = parseInt(routeShortName, 10);
  return !isNaN(num) && num < 100 ? 'tram' : 'bus';
}

function timeToISO(hhMM: string): string {
  const [hStr, mStr] = hhMM.split(':');
  const now = new Date();
  const d = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    parseInt(hStr, 10),
    parseInt(mStr, 10),
    0,
  );
  // handle midnight crossover: if the result is more than 3 hours in the past, shift +1 day
  if (now.getTime() - d.getTime() > 3 * 60 * 60 * 1000) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString();
}

async function fetchTTSSDepartures(stopId: string): Promise<Departure[]> {
  const url = `${TTSS_BASE}?stop=${encodeURIComponent(stopId)}&mode=departures&skipCancelled=true&maxCount=30`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'UJ-ISI-Kiosk/1.0' },
    signal: AbortSignal.timeout(8_000),
  });

  if (!res.ok) throw new Error(`TTSS responded ${res.status} for stop ${stopId}`);

  const json: TTSSResponse = await res.json() as TTSSResponse;
  const passages = json.actual ?? [];

  return passages.map((p): Departure => {
    const minutesAway = Math.round(p.actualRelativeTime / 60);
    return {
      routeShortName: p.patternText,
      headsign: p.direction,
      plannedDeparture: timeToISO(p.plannedTime),
      expectedDeparture: timeToISO(p.actualTime),
      delaySeconds: p.actualRelativeTime - p.relativeTime,
      vehicleType: getVehicleType(p.patternText),
      minutesAway,
    };
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const rawStop = req.query['stopId'];
  const stopIds: string[] = Array.isArray(rawStop)
    ? rawStop
    : rawStop
      ? [rawStop]
      : [];

  if (stopIds.length === 0) {
    res.status(400).json({ error: 'Missing stopId query parameter' });
    return;
  }

  const cacheKey = [...stopIds].sort().join('|');
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    res.status(200).json(cached.data);
    return;
  }

  try {
    const results = await Promise.all(stopIds.map(fetchTTSSDepartures));
    const departures = results
      .flat()
      .filter(d => d.minutesAway >= 0)
      .sort((a, b) => a.minutesAway - b.minutesAway)
      .slice(0, 8);

    cache.set(cacheKey, { timestamp: Date.now(), data: departures });
    res.status(200).json(departures);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: `Failed to fetch departures: ${message}` });
  }
}
