import type { VercelRequest, VercelResponse } from '@vercel/node';
import gtfsRt from 'gtfs-realtime-bindings';
const { transit_realtime } = gtfsRt;

const GTFS_RT_BASE = 'https://gtfs.ztp.krakow.pl';
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

const cache = new Map<string, CachedDepartures>();

function isTramRoute(routeId: string): boolean {
  const num = parseInt(routeId, 10);
  return !isNaN(num) && num < 100;
}

function toVehicleType(routeId: string): VehicleType {
  return isTramRoute(routeId) ? 'tram' : 'bus';
}

function toUnixSeconds(time: transit_realtime.IStopTimeEvent['time']): number {
  if (time == null) return 0;
  return typeof time === 'number' ? time : (time as { low: number }).low;
}

function toISOString(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString();
}

async function fetchGtfsRtFeed(filename: string): Promise<transit_realtime.FeedMessage> {
  const response = await fetch(`${GTFS_RT_BASE}/${filename}`, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { 'User-Agent': 'UJ-ISI-Kiosk/2.0' },
  });

  if (!response.ok) {
    throw new Error(`GTFS-RT fetch failed: ${response.status} ${filename}`);
  }

  const buffer = await response.arrayBuffer();
  return transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
}

function matchesStopId(gtfsStopId: string | null | undefined, numericStopId: string): boolean {
  if (!gtfsStopId) return false;
  return gtfsStopId === numericStopId || gtfsStopId.endsWith(`_${numericStopId}`);
}

function extractDeparturesForStop(
  feed: transit_realtime.FeedMessage,
  stopId: string,
  now: number,
): Departure[] {
  const departures: Departure[] = [];

  for (const entity of feed.entity ?? []) {
    const tripUpdate = entity.tripUpdate;
    if (!tripUpdate) continue;

    const routeShortName = tripUpdate.trip?.routeId ?? '';
    const vehicleType = toVehicleType(routeShortName);

    for (const stopTimeUpdate of tripUpdate.stopTimeUpdate ?? []) {
      if (!matchesStopId(stopTimeUpdate.stopId, stopId)) continue;

      const depEvent = stopTimeUpdate.departure ?? stopTimeUpdate.arrival;
      if (!depEvent?.time) continue;

      const expectedUnix = toUnixSeconds(depEvent.time);
      const delaySeconds = depEvent.delay ?? 0;
      const plannedUnix = expectedUnix - delaySeconds;

      const minutesAway = Math.round((expectedUnix - now) / 60);
      if (minutesAway < 0) continue;

      departures.push({
        routeShortName,
        headsign: '',
        plannedDeparture: toISOString(plannedUnix),
        expectedDeparture: toISOString(expectedUnix),
        delaySeconds,
        vehicleType,
        minutesAway,
      });
    }
  }

  return departures;
}

async function fetchDeparturesForStop(stopId: string): Promise<Departure[]> {
  const now = Math.floor(Date.now() / 1000);

  const [tramFeed, busFeed] = await Promise.all([
    fetchGtfsRtFeed('TripUpdates_T.pb'),
    fetchGtfsRtFeed('TripUpdates_A.pb'),
  ]);

  const tramDepartures = extractDeparturesForStop(tramFeed, stopId, now);
  const busDepartures = extractDeparturesForStop(busFeed, stopId, now);

  return [...tramDepartures, ...busDepartures]
    .sort((a, b) => a.minutesAway - b.minutesAway)
    .slice(0, MAX_DEPARTURES);
}

async function getCachedDepartures(stopIds: string[]): Promise<Departure[]> {
  const cacheKey = [...stopIds].sort().join('|');
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const results = await Promise.all(stopIds.map(fetchDeparturesForStop));
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
