import type { VercelRequest, VercelResponse } from '@vercel/node';
import gtfsRt from 'gtfs-realtime-bindings';
import { unzipSync } from 'fflate';

const { transit_realtime } = gtfsRt;

const GTFS_BASE = 'https://gtfs.ztp.krakow.pl';

const TRAM_STOP_IDS: Record<string, string[]> = {
  '234361': ['stop_346_269019', 'stop_346_269029'],
  '234363': ['stop_345_268819', 'stop_345_268829'],
};

const BUS_STOP_IDS: Record<string, string[]> = {
  '234361': ['stop_1134_269003', 'stop_1134_269004'],
  '234363': ['stop_1132_268803', 'stop_1132_268804'],
};

interface RouteInfo {
  routeShortName: string;
  headsign: string;
}

interface GtfsCache {
  tripMap: Map<string, RouteInfo>;
  fetchedAt: number;
}

interface Departure {
  routeShortName: string;
  headsign: string;
  plannedDeparture: string;
  expectedDeparture: string;
  delaySeconds: number;
  vehicleType: 'tram' | 'bus';
  minutesAway: number;
}

const tramCache: GtfsCache = { tripMap: new Map(), fetchedAt: 0 };
const busCache: GtfsCache = { tripMap: new Map(), fetchedAt: 0 };

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r/g, '').split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h.trim()] = (values[i] ?? '').trim(); });
    return row;
  });
}

async function loadGtfsLookup(zipUrl: string, cache: GtfsCache): Promise<Map<string, RouteInfo>> {
  const now = Date.now();
  if (cache.tripMap.size > 0 && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.tripMap;
  }

  const res = await fetch(zipUrl, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`GTFS zip fetch failed: ${res.status}`);

  const buf = await res.arrayBuffer();
  const files = unzipSync(new Uint8Array(buf));

  const decoder = new TextDecoder('utf-8');
  const tripsText = decoder.decode(files['trips.txt']);
  const routesText = decoder.decode(files['routes.txt']);

  const routeMap = new Map<string, string>();
  for (const row of parseCsv(routesText)) {
    if (row['route_id'] && row['route_short_name']) {
      routeMap.set(row['route_id'], row['route_short_name']);
    }
  }

  const tripMap = new Map<string, RouteInfo>();
  for (const row of parseCsv(tripsText)) {
    const tripId = row['trip_id'];
    const routeId = row['route_id'];
    const headsign = row['trip_headsign'] ?? '';
    if (tripId && routeId) {
      tripMap.set(tripId, {
        routeShortName: routeMap.get(routeId) ?? routeId,
        headsign,
      });
    }
  }

  cache.tripMap = tripMap;
  cache.fetchedAt = now;
  return tripMap;
}

async function fetchDepartures(
  pbUrl: string,
  targetStopIds: string[],
  tripMap: Map<string, RouteInfo>,
  vehicleType: 'tram' | 'bus',
): Promise<Departure[]> {
  const res = await fetch(pbUrl, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`GTFS-RT fetch failed: ${res.status}`);

  const buf = await res.arrayBuffer();
  const feed = transit_realtime.FeedMessage.decode(new Uint8Array(buf));

  const now = Date.now();
  const departures: Departure[] = [];
  const targetSet = new Set(targetStopIds);

  for (const entity of feed.entity) {
    if (!entity.tripUpdate) continue;
    const { trip, stopTimeUpdate } = entity.tripUpdate;
    const tripId = trip?.tripId ?? '';
    const info = tripMap.get(tripId) ?? { routeShortName: '?', headsign: '' };

    for (const stu of stopTimeUpdate) {
      if (!targetSet.has(stu.stopId ?? '')) continue;

      const scheduled = stu.departure?.time ?? stu.arrival?.time;
      if (!scheduled) continue;

      const scheduledMs = Number(scheduled) * 1000;
      const delaySeconds = Number(stu.departure?.delay ?? stu.arrival?.delay ?? 0);
      const expectedMs = scheduledMs + delaySeconds * 1000;
      const minutesAway = Math.round((expectedMs - now) / 60_000);

      if (minutesAway < -1) continue;

      departures.push({
        routeShortName: info.routeShortName,
        headsign: info.headsign,
        plannedDeparture: new Date(scheduledMs).toISOString(),
        expectedDeparture: new Date(expectedMs).toISOString(),
        delaySeconds,
        vehicleType,
        minutesAway,
      });
    }
  }

  return departures;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const stopId = String(req.query.stopId ?? '');
  if (!stopId) {
    return res.status(400).json({ error: 'Missing stopId parameter' });
  }

  const tramStopIds = TRAM_STOP_IDS[stopId];
  const busStopIds = BUS_STOP_IDS[stopId];

  if (!tramStopIds && !busStopIds) {
    return res.status(404).json({ error: `Unknown stopId: ${stopId}` });
  }

  try {
    const results: Departure[] = [];

    if (tramStopIds) {
      const tramMap = await loadGtfsLookup(`${GTFS_BASE}/GTFS_KRK_T.zip`, tramCache);
      const tramDeps = await fetchDepartures(`${GTFS_BASE}/TripUpdates_T.pb`, tramStopIds, tramMap, 'tram');
      results.push(...tramDeps);
    }

    if (busStopIds) {
      try {
        const busMap = await loadGtfsLookup(`${GTFS_BASE}/GTFS_KRK_A.zip`, busCache);
        const busDeps = await fetchDepartures(`${GTFS_BASE}/TripUpdates_A.pb`, busStopIds, busMap, 'bus');
        results.push(...busDeps);
      } catch {
        // bus feed optional
      }
    }

    results.sort((a, b) => a.minutesAway - b.minutesAway);
    return res.status(200).json(results.slice(0, 20));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: `Failed to fetch departures: ${msg}` });
  }
}
