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

interface ScheduledStop {
  tripId: string;
  departureTime: string;
}

interface GtfsStaticCache {
  tripMap: Map<string, RouteInfo>;
  stopSchedules: Map<string, ScheduledStop[]>;
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
  isScheduled?: boolean;
}

const tramCache: GtfsStaticCache = { tripMap: new Map(), stopSchedules: new Map(), fetchedAt: 0 };
const busCache: GtfsStaticCache = { tripMap: new Map(), stopSchedules: new Map(), fetchedAt: 0 };

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

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

function gtfsTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToDate(minutesSinceMidnight: number, todayMidnight: Date): Date {
  const result = new Date(todayMidnight);
  result.setMinutes(result.getMinutes() + minutesSinceMidnight);
  return result;
}

async function loadGtfsStatic(zipUrl: string, cache: GtfsStaticCache, targetStopIds: string[]): Promise<GtfsStaticCache> {
  const now = Date.now();
  if (cache.tripMap.size > 0 && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache;
  }

  const res = await fetch(zipUrl, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`GTFS zip fetch failed: ${res.status}`);

  const buf = await res.arrayBuffer();
  const files = unzipSync(new Uint8Array(buf));
  const decoder = new TextDecoder('utf-8');

  const routeMap = new Map<string, string>();
  for (const row of parseCsv(decoder.decode(files['routes.txt']))) {
    if (row['route_id'] && row['route_short_name']) {
      routeMap.set(row['route_id'], row['route_short_name']);
    }
  }

  const tripMap = new Map<string, RouteInfo>();
  for (const row of parseCsv(decoder.decode(files['trips.txt']))) {
    const tripId = row['trip_id'];
    const routeId = row['route_id'];
    if (tripId && routeId) {
      tripMap.set(tripId, {
        routeShortName: routeMap.get(routeId) ?? routeId,
        headsign: row['trip_headsign'] ?? '',
      });
    }
  }

  const targetSet = new Set(targetStopIds);
  const stopSchedules = new Map<string, ScheduledStop[]>();

  for (const row of parseCsv(decoder.decode(files['stop_times.txt']))) {
    const stopId = row['stop_id'];
    if (!targetSet.has(stopId)) continue;
    const dep = row['departure_time'] || row['arrival_time'];
    if (!dep) continue;
    const tripId = row['trip_id'];
    if (!stopSchedules.has(stopId)) stopSchedules.set(stopId, []);
    stopSchedules.get(stopId)!.push({ tripId, departureTime: dep });
  }

  cache.tripMap = tripMap;
  cache.stopSchedules = stopSchedules;
  cache.fetchedAt = now;
  return cache;
}

async function fetchLiveDepartures(
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

function getScheduledDepartures(
  targetStopIds: string[],
  stopSchedules: Map<string, ScheduledStop[]>,
  tripMap: Map<string, RouteInfo>,
  vehicleType: 'tram' | 'bus',
  limitMinutes = 180,
): Departure[] {
  const warsawNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Warsaw' }));
  const todayMidnight = new Date(warsawNow);
  todayMidnight.setHours(0, 0, 0, 0);
  const nowMinutes = warsawNow.getHours() * 60 + warsawNow.getMinutes();

  const departures: Departure[] = [];

  for (const stopId of targetStopIds) {
    for (const entry of stopSchedules.get(stopId) ?? []) {
      const depMinutes = gtfsTimeToMinutes(entry.departureTime);
      const minutesAway = depMinutes - nowMinutes;
      if (minutesAway < -1 || minutesAway > limitMinutes) continue;

      const depDate = minutesToDate(depMinutes, todayMidnight);
      const isoString = depDate.toISOString();
      const info = tripMap.get(entry.tripId) ?? { routeShortName: '?', headsign: '' };

      departures.push({
        routeShortName: info.routeShortName,
        headsign: info.headsign,
        plannedDeparture: isoString,
        expectedDeparture: isoString,
        delaySeconds: 0,
        vehicleType,
        minutesAway,
        isScheduled: true,
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
      const staticData = await loadGtfsStatic(`${GTFS_BASE}/GTFS_KRK_T.zip`, tramCache, tramStopIds);
      const live = await fetchLiveDepartures(`${GTFS_BASE}/TripUpdates_T.pb`, tramStopIds, staticData.tripMap, 'tram');
      results.push(...(live.length > 0 ? live : getScheduledDepartures(tramStopIds, staticData.stopSchedules, staticData.tripMap, 'tram')));
    }

    if (busStopIds) {
      try {
        const staticData = await loadGtfsStatic(`${GTFS_BASE}/GTFS_KRK_A.zip`, busCache, busStopIds);
        const live = await fetchLiveDepartures(`${GTFS_BASE}/TripUpdates_A.pb`, busStopIds, staticData.tripMap, 'bus');
        results.push(...(live.length > 0 ? live : getScheduledDepartures(busStopIds, staticData.stopSchedules, staticData.tripMap, 'bus')));
      } catch {
        void 0;
      }
    }

    results.sort((a, b) => a.minutesAway - b.minutesAway);
    return res.status(200).json(results.slice(0, 20));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: `Failed to fetch departures: ${msg}` });
  }
}
