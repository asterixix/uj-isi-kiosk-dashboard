import type { VercelRequest, VercelResponse } from '@vercel/node';

const TTSS_BASE = 'https://ttss.mpk.krakow.pl/internetservice/services/passageInfo/stopPassages/stopDepartures';
const CACHE_TTL_MS = 15_000;
const MAX_DEPARTURES = 8;
const FETCH_TIMEOUT_MS = 10_000;

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

interface CachedDepartures {
  data: Departure[];
  expiresAt: number;
}

interface TtssPassage {
  patternText: string;
  direction: string;
  plannedTime: string;
  actualRelativeTime: number;
  status: string;
}

interface TtssResponse {
  actual: TtssPassage[];
}

const cache = new Map<string, CachedDepartures>();

function toVehicleType(routeShortName: string): VehicleType {
  const num = parseInt(routeShortName, 10);
  return !isNaN(num) && num < 100 ? 'tram' : 'bus';
}

function buildPlannedISO(plannedTime: string): string {
  const now = new Date();
  const [hh, mm] = plannedTime.split(':').map(Number);
  const planned = new Date(now);
  planned.setHours(hh, mm, 0, 0);
  // midnight crossing: "HH:MM" from TTSS is Warsaw local — if result is >6h in past, it belongs to tomorrow
  if (now.getTime() - planned.getTime() > 6 * 3600 * 1000) {
    planned.setDate(planned.getDate() + 1);
  }
  return planned.toISOString();
}

async function fetchTtssStop(stopId: string): Promise<Departure[]> {
  const url = `${TTSS_BASE}?stopId=${encodeURIComponent(stopId)}&mode=departure&language=pl`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      'User-Agent': 'UJ-ISI-Kiosk/2.0',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`TTSS API error: ${response.status} for stopId=${stopId}`);
  }

  const json = await response.json() as TtssResponse;
  const passages = json.actual ?? [];
  const now = Date.now();

  return passages
    .filter((p) => p.status !== 'DEPARTED' && p.actualRelativeTime >= -30)
    .map((p): Departure => {
      const minutesAway = Math.round(p.actualRelativeTime / 60);
      const expectedISO = new Date(now + p.actualRelativeTime * 1000).toISOString();
      const plannedISO = buildPlannedISO(p.plannedTime);
      const delaySeconds = Math.round(
        (new Date(expectedISO).getTime() - new Date(plannedISO).getTime()) / 1000,
      );

      return {
        routeShortName: p.patternText,
        headsign: p.direction,
        plannedDeparture: plannedISO,
        expectedDeparture: expectedISO,
        delaySeconds,
        vehicleType: toVehicleType(p.patternText),
        minutesAway,
      };
    })
    .sort((a, b) => a.minutesAway - b.minutesAway)
    .slice(0, MAX_DEPARTURES);
}

async function getCachedDepartures(stopIds: string[]): Promise<Departure[]> {
  const cacheKey = [...stopIds].sort().join('|');
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const results = await Promise.all(stopIds.map(fetchTtssStop));
  const merged = results
    .flat()
    .sort((a, b) => a.minutesAway - b.minutesAway)
    .slice(0, MAX_DEPARTURES);

  cache.set(cacheKey, { data: merged, expiresAt: Date.now() + CACHE_TTL_MS });
  return merged;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const rawStopId = req.query['stopId'];
  if (!rawStopId) {
    res.status(400).json({ error: 'Missing stopId parameter' });
    return;
  }

  const stopIds = Array.isArray(rawStopId) ? rawStopId : [rawStopId];

  try {
    const departures = await getCachedDepartures(stopIds);
    res.status(200).json(departures);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to fetch departures: ${message}` });
  }
}
